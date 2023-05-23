import { NodeType, ResolvedPos } from 'prosemirror-model';
import { Schema } from 'prosemirror-model';
import { EditorState, NodeSelection, Plugin, PluginKey, TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import React from 'react';
import ReactDOM from 'react-dom';

import depthByType from '../DepthByType';
import nodeAt from '../nodeAt';
import {
  BLOCKQUOTE,
  CODE_BLOCK,
  HEADING,
  LIST_ITEM,
  LIST_TASK_ITEM,
  PARAGRAPH,
  TOGGLE_ITEM_CONTENT,
  TOGGLE_ITEM_TITLE,
  TOGGLE_LIST_ITEM
} from '../NodeNames';
import DragHandle from '../ui/DragHandle/DragHandle';

// list of node names that should get dragHandle
const ELEMENTS = [LIST_TASK_ITEM, LIST_ITEM, TOGGLE_LIST_ITEM, BLOCKQUOTE, PARAGRAPH, HEADING];
const handlesPluginKey = new PluginKey('handlesPlugin');

const selectTextBlockText = (pos: number, view: EditorView) => {
  const { parent } = view.state.doc.resolve(pos);
  const node = nodeAt(view.state.doc, pos);
  const { tr } = view.state;
  // if the node is a code block we want to select that block not its parent as is the case when the node is a text Node
  if (node?.type.name === CODE_BLOCK) {
    const endOfNode = pos + node.nodeSize;
    tr.setSelection(TextSelection.create(tr.doc, pos, endOfNode));
  } else {
    const endOfNode = pos + parent.nodeSize - 1;
    tr.setSelection(TextSelection.create(tr.doc, pos, endOfNode));
  }

  view.dispatch(tr);
};
// Returns the node and its position that the drag handle should appear next to
// types array contains the node types we allow drag handles next to
const findParentNodeWithSomeTypeClosestToPos = (position: ResolvedPos, types: NodeType[], schema: Schema) => {
  const result = types.map((type) => {
    const parent = findParentNodeOfTypeClosestToPos(position, type);

    // toggle list handling - show drag handles on nodes in the item content
    if (type.name === TOGGLE_LIST_ITEM && parent) {
      const insideToggleBody = findParentNodeOfTypeClosestToPos(position, schema.nodes[TOGGLE_ITEM_CONTENT]);
      const onToggleTitle = findParentNodeOfTypeClosestToPos(position, schema.nodes[TOGGLE_ITEM_TITLE]);
      const onNestedToggleList = insideToggleBody && onToggleTitle;

      if (insideToggleBody && !onNestedToggleList) {
        return undefined;
      }
    }

    if (parent) {
      return { foundPosition: parent.pos, node: parent.node };
    }
    return undefined;
  });
  // Result will have one or zero defined elements, in case there is one, that element will have the node and position where hadnle should appear
  return result.filter((item) => item !== undefined)[0];
};
export function handlesFactory(isBlock = false, onMouseDown?: () => void, onMouseUp?: () => void) {
  return (view: EditorView, getPos: () => number) => {
    const container = document.createElement('div');
    container.contentEditable = 'false';
    container.className = 'drag-handle-container';
    container.dataset.test = 'drag-handle-container';
    container.addEventListener('mousedown', () => {
      onMouseDown?.();
      const { tr } = view.state;
      tr.setSelection(NodeSelection.create(tr.doc, getPos() - (isBlock ? 0 : 1)));
      view.dispatch(tr);
    });
    container.addEventListener('mouseup', () => {
      onMouseUp?.();
      selectTextBlockText(getPos(), view);
    });
    ReactDOM.render(<DragHandle />, container);
    return container;
  };
}

function mouseEventHandler(view: EditorView, event: any) {
  // get mouse corresponding doc position
  const pos = view.posAtCoords({
    left: event.clientX,
    top: event.clientY
  });
  if (!pos) return;
  const resPos = view.state.doc.resolve(pos.inside + 1);

  const allowedNode = findParentNodeWithSomeTypeClosestToPos(
    resPos,
    ELEMENTS.map((name) => view.state.schema.nodes[name]),
    view.state.schema
  );

  const parent = resPos.node(depthByType.paragraph);
  const { tr } = view.state;

  if (allowedNode) {
    pos.inside = allowedNode.foundPosition;
  }
  const { handlePos } = handlesPluginKey.getState(view.state);

  if (
    !parent || // no textBlock in position
    !allowedNode?.node || // element shouldn't get handle, allowed node exists if the cursor is in a node that should have handle
    view.state.selection.from !== view.state.selection.to || // there is text selection in the doc
    handlePos === pos.inside // element already has handle
  ) {
    if (handlePos !== pos.inside && handlePos !== null) {
      tr.setMeta('handles', 'removeHandle');
      view.dispatch(tr);
      return;
    }
    // element already has handle
    return;
  }

  let set = DecorationSet.empty;
  const handleDecoration = Decoration.widget(pos.inside + 1, handlesFactory(), {
    containerId: parent.attrs.componentId,
    pos: pos.inside,
    side: -1
  });

  set = set.add(view.state.doc, [handleDecoration]);

  tr.setMeta('handles', {
    set,
    handlePos: pos.inside
  });
  view.dispatch(tr);
}

const textBlockHandle = () =>
  new Plugin({
    key: handlesPluginKey,
    state: {
      init() {
        return {
          set: DecorationSet.empty,
          handlePos: null
        };
      },

      apply(tr: Transaction, value) {
        const newSet = tr.getMeta('handles');
        if (newSet === 'removeHandle' || !newSet) {
          if (tr.selection instanceof NodeSelection && value.handlePos && tr.getMeta('uiEvent') !== 'drop') {
            return value;
          }

          return {
            set: DecorationSet.empty,
            handlePos: null
          };
        }

        return {
          set: newSet.set,
          handlePos: newSet.handlePos
        };
      }
    },
    props: {
      decorations(state: EditorState) {
        return this.getState(state).set;
      },

      handleDOMEvents: {
        mousemove(view: EditorView<any>, event: any): boolean {
          if (!view.dragging) mouseEventHandler(view, event);
          return false;
        }
      }
    }
  });

export default textBlockHandle;
