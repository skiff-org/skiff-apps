/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DOMSerializer, Node as PMNode, ResolvedPos, Slice } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { dropPoint, insertPoint } from 'prosemirror-transform';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

const dropCursorKey = new PluginKey('dropCursorKey');

/**
 * dispatches a transaction with relevant data for the placeholder plugin.
 *
 * @param {EditorView} view - Current Editor View.
 * @param {ResolvedPos} pos - Cursor resolved position.
 * @param {string[]} sliceTypes - Array with valid node types names.
 *
 * should be called every time the mouse position has been changed.
 * Returns true on successful dispatch, false otherwise.
 */
const placeholderEmitter = (view: EditorView, pos: ResolvedPos, sliceTypes: string[]) => {
  // @ts-ignore
  if (pos.pos && view.dragging && sliceTypes.includes(view.dragging.slice.content.content[0].type.name)) {
    const { tr } = view.state;
    tr.setMeta(dropCursorKey, {
      // @ts-ignore
      slice: view.dragging.slice.content.content[0] as PMNode,
      pos: pos.pos
    });
    view.dispatch(tr);
    return true;
  }

  return false;
};

/**
 * Returns the drop cursor plugin
 *
 * @param DOMPlaceHolders - Object that contains all valid node for the placeholder plugin as keys.
 * Values are functions that will receive the dragged node of type `key` and the depth he is going to be inserted in.
 * The function should return className for the placeholder (string) or DOM representation of the placeholder (HTMLElement)
 * @param containerValidation - Will be called before inserting the placeholder to the DOM. Function that will receive as arguments
 * the placeholder DOM container(`parent`), his depth(`depth`), the dragged node(`draggedNode`) and the point the placeholder is going to be inserted in(`dropPoint`).
 * should return true for valid insertion, false otherwise
 * @param options - Object with prosemirror-dropCursor config.
 */
function dropCursor(
  DOMPlaceHolders: Record<string, (node: Node, depth: number) => string | HTMLElement>,
  containerValidation: (parent: PMNode, depth: number, slice: Node, dropPoint: number) => boolean,
  options: {
    width: number;
    color: string;
    class: string;
  } = { class: '', color: '', width: 0 }
) {
  return new Plugin<DecorationSet>({
    key: dropCursorKey,

    view(editorView) {
      return new DropCursorView(editorView, {
        ...options,
        blockNodes: Object.keys(DOMPlaceHolders)
      });
    },

    state: {
      init() {
        return DecorationSet.empty;
      },

      apply(tr, set, state) {
        // get information transferred by dropCursor plugin.
        const action = tr.getMeta(this);

        // Clean placeholders
        if (!action || action.dragend) {
          return DecorationSet.empty;
        }

        // map set
        let newSet = set.map(tr.mapping, tr.doc);

        // hide origin
        if (action.dragstart) {
          newSet = DecorationSet.empty;
          const draggedNodeDecoration = Decoration.node(
            action.pos,
            action.pos + action.slice.nodeSize,
            {
              class: 'hidden'
            },
            {
              origin: true
            }
          );
          newSet = newSet.add(tr.doc, [draggedNodeDecoration]);
        }

        // check for a valid drop point for the place holder.
        const dropPoint = insertPoint(tr.doc, action.pos, action.slice.type);

        if (dropPoint || dropPoint === 0) {
          // remove old placeholder
          const placeholder = newSet.find(undefined, undefined, (spec) => spec.placeholder);

          newSet = newSet.remove(placeholder);
          // find parent for the placeHolder
          const container = tr.doc.resolve(dropPoint);
          // find matching representation for the placeholder from DOMPlaceHolders.
          const elementToDepth = DOMPlaceHolders[action.slice.type.name](action.slice, container.depth);
          let placeholderDOM;

          if (typeof elementToDepth === 'string') {
            // add className to the serialized node
            placeholderDOM = DOMSerializer.fromSchema(state.schema).serializeNode(action.slice);
            if (placeholderDOM instanceof Element) placeholderDOM.className = elementToDepth;
          } else {
            // use the DOM representation from DOMPlaceHolders;
            placeholderDOM = elementToDepth;
          }

          // check if the dropPoint is valid with containerValidation;
          if (containerValidation(container.parent, container.depth, action.slice, dropPoint)) {
            const placeholder = Decoration.widget(dropPoint, placeholderDOM, {
              placeholder: true
            });
            newSet = newSet.add(tr.doc, [placeholder]);
          }
        }

        return newSet;
      }
    },

    appendTransaction(transactions, oldState, newState) {
      const lastTr = transactions[transactions.length - 1];

      if (lastTr.getMeta('uiEvent') === 'drop') {
        const { tr } = newState;

        // @ts-ignore
        const dropLastPos: number = lastTr.steps[1].to + lastTr.steps[1].slice.size;
        tr.setSelection(TextSelection.create(tr.doc, dropLastPos - 1));
        return tr;
      }

      return null;
    },

    props: {
      decorations(state) {
        return this.getState(state);
      },
      handleDrop(view: EditorView, event: any, slice: Slice, moved: boolean) {
        let inTable = false;
        const path = event.path || event.composedPath(); //event.path is not supported in safari
        path.forEach((element: any) => {
          if (element.nodeName === 'TABLE') {
            inTable = true;
          }
        });
        return inTable;
      }
    }
  });
} // The class to handle the view props in the DropCursorPlugin.

class DropCursorView {
  editorView: EditorView;

  width: number;

  color: string;

  handlers: Array<{ name: string; handler: (evt: Event) => void }>;

  class: string;

  cursorPos: null | number;

  element: null | HTMLElement;

  timeout: NodeJS.Timeout | null | number;

  dragGhost: null | Node;

  blockNodes: string[];

  constructor(editorView: EditorView, options: { blockNodes: string[]; width: number; color: string; class: string }) {
    this.editorView = editorView;
    this.width = options.width || 1;
    this.color = options.color || window.getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
    this.class = options.class;
    this.cursorPos = null;
    this.element = null;
    this.timeout = null;
    this.dragGhost = null;
    this.blockNodes = options.blockNodes;
    // apply event listeners on the view DOM
    this.handlers = ['dragover', 'dragend', 'drop', 'dragleave', 'dragstart'].map((name) => {
      const handler = (e: Event) => this[name](e);

      editorView.dom.addEventListener(name, handler);
      return {
        name,
        handler
      };
    });
  }

  // remove event listeners from DOM.
  destroy() {
    this.handlers.forEach(({ name, handler }) => this.editorView.dom.removeEventListener(name, handler));
  }

  // called every time the view updates;
  update(editorView: EditorView, prevState: EditorState) {
    if (this.cursorPos != null && prevState.doc !== editorView.state.doc) this.updateOverlay();
  }

  // update cursor pos
  setCursor(pos: number | null) {
    if (pos === this.cursorPos) return;
    this.cursorPos = pos;

    if (pos == null && this.element) {
      this.element.parentNode?.removeChild(this.element);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  }

  // update placeholder/dropCursor
  updateOverlay() {
    // get cursor resolvedPos.
    const $pos = this.editorView.state.doc.resolve(Number(this.cursorPos));
    // if valid slice, dispatch transaction to placeholder plugin.
    const res = placeholderEmitter(this.editorView, $pos, this.blockNodes);
    // if dispatched transaction by placeholderEmitter abort default dropCursor behavior.

    if (
      res ||
      (this.editorView.dragging &&
        // @ts-ignore
        this.blockNodes.includes(this.editorView.dragging.slice.content.content[0].type.name)) ||
      !this.editorView.dragging
    )
      return;
    // default prosemirror-dropCursor behavior
    let rect;

    if (!$pos.parent.inlineContent) {
      const before = $pos.nodeBefore;
      const after = $pos.nodeAfter;

      if ((before || after) && this.cursorPos !== null) {
        const nodeDOM = this.editorView?.nodeDOM(this.cursorPos - (before ? before.nodeSize : 0));
        const nodeRect = nodeDOM instanceof HTMLElement && nodeDOM?.getBoundingClientRect();
        if (!nodeRect) return;
        let top = before ? nodeRect?.bottom : nodeRect?.top;
        const nodeDOMAtCursor = this.editorView.nodeDOM(Number(this.cursorPos));
        if (before && after && nodeDOMAtCursor instanceof HTMLElement)
          top = (top + nodeDOMAtCursor.getBoundingClientRect().top) / 2;
        rect = {
          left: nodeRect.left,
          right: nodeRect.right,
          top: top - this.width / 2,
          bottom: top + this.width / 2
        };
      }
    }

    if (!rect) {
      const coords = this.editorView.coordsAtPos(Number(this.cursorPos));
      rect = {
        left: coords.left - this.width / 2,
        right: coords.left + this.width / 2,
        top: coords.top,
        bottom: coords.bottom
      };
    }

    const parent = this.editorView.dom instanceof HTMLElement ? this.editorView.dom.offsetParent : undefined;

    if (!this.element && parent instanceof Element) {
      this.element = parent.appendChild(document.createElement('div'));
      if (this.class && this.element !== null) {
        this.element.className = this.class;
        this.element.style.cssText = `position: absolute; z-index: 50; pointer-events: none; background: ${this.color}`;
      }
    }

    const parentRect =
      !parent || (parent === document.body && parent instanceof HTMLElement && parent.style.position === 'static')
        ? {
            left: 0,
            top: 0
          }
        : parent.getBoundingClientRect();
    if (this.element !== null) {
      this.element.style.left = `${rect.left - parentRect.left}px`;
      this.element.style.top = `${rect.top - parentRect.top}px`;
      this.element.style.width = `${rect.right - rect.left}px`;
      this.element.style.height = `${rect.bottom - rect.top}px`;
    }
  }

  scheduleRemoval(timeout: number | undefined) {
    if (this.dragGhost) {
      document.body.removeChild(this.dragGhost);
      this.dragGhost = null;
    }
    clearTimeout(this.timeout as NodeJS.Timeout);
    this.timeout = setTimeout(() => this.setCursor(null), timeout);
  }

  // dispatch a transaction hide origin element on drag start
  dragstart(event: DragEvent) {
    // get current dragged node.
    // @ts-ignore
    const draggedNode: PMNode = this.editorView.dragging?.slice.content.content[0];
    // if not valid node for placeholder - return
    if (!this.blockNodes.includes(draggedNode.type.name)) return;
    // get mouse corresponding doc position
    const pos = this.editorView.posAtCoords({
      left: event.clientX,
      top: event.clientY
    });
    if (!pos) return;
    const { inside: draggedNodePos } = pos;
    const { tr } = this.editorView.state;
    tr.setMeta(dropCursorKey, {
      pos: draggedNodePos,
      dragstart: true,
      slice: draggedNode
    });
    // push to end of event-loop to prevent the node from diapering before the `dragover` event has been dispatched
    setTimeout(() => {
      this.editorView.dispatch(tr);
    }, 0);
    // changing the ghost node on dragging
    // https://stackoverflow.com/a/29131825/10839175
    let ghost;

    // Check if browser grab the svg and change the ghost to be related <p/>
    if (event.target instanceof HTMLElement && event.target?.dataset.svgHandle) {
      ghost = event.target?.parentNode?.parentNode?.parentNode?.cloneNode(true);
    } else if (event.target instanceof Node) {
      ghost = event.target?.cloneNode(true);
    }
    if (ghost instanceof HTMLElement) {
      ghost.style.position = 'relative';
      ghost.style.background = 'transparent';
      ghost.style.color = 'rgba(0,0,0,0.5)';
      ghost.style.maxWidth = `${window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--skiff-doc-width-us-letter-portrait')}`;
      ghost.style.boxShadow = 'none';
      this.dragGhost = ghost;
      if (this.dragGhost !== null) document.body.appendChild(this.dragGhost);
      if (this.editorView.dom instanceof HTMLElement) this.editorView.dom.style.caretColor = 'transparent';
      event.dataTransfer?.setDragImage(ghost, 0, 0);
    }
  }

  // update the cursor position on every mousemove while dragging
  dragover(event: DragEvent) {
    if (!this.editorView.editable) return;
    const pos = this.editorView.posAtCoords({
      left: event.clientX,
      top: event.clientY
    });

    if (pos) {
      let target = pos.pos;

      if (this.editorView.dragging && this.editorView.dragging.slice) {
        target = Number(dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice));
        if (target == null) target = pos.pos;
        if (target === -1 || target === 0) target = 1;
      }

      this.setCursor(target);
      this.scheduleRemoval(5000);
    }
  }

  // dispatch a transaction to remove all placeholders on dragend
  dragend() {
    const { tr } = this.editorView.state;
    tr.setMeta(dropCursorKey, {
      dragend: true
    });
    this.editorView.dispatch(tr);
    if (this.editorView.dom instanceof HTMLElement)
      this.editorView.dom.style.caretColor = `${window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary')}`;
    this.scheduleRemoval(20);
  }

  drop(e: DragEvent) {
    this.scheduleRemoval(20);
    if (this.editorView.dom instanceof HTMLElement)
      this.editorView.dom.style.caretColor = `${window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary')}`;
    // Stop browser for trying handle the drop and leave it to prosemirror only
    // Fixed: Uncaught Invariant Violation: Cannot call hover while not dragging.

    e.stopPropagation();
  }

  dragleave(event: MouseEvent) {
    if (
      event.relatedTarget instanceof EventTarget ||
      event.target === this.editorView.dom ||
      !this.editorView.dom.contains(event.relatedTarget)
    )
      this.setCursor(null);
  }
}
const DropCursorPlugin = dropCursor(
  {
    paragraph: () => 'textBlock-placeholder',
    heading: () => 'textBlock-placeholder',
    ordered_list: () => 'textBlock-placeholder',
    bullet_list: () => 'textBlock-placeholder',
    code_block: () => 'textBlock-placeholder'
  },
  (parent) =>
    // disable drop in table
    parent.type.name !== 'table_cell'
);

export default DropCursorPlugin;
