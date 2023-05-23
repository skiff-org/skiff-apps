// eslint-disable-next-line max-classes-per-file
import './ui/skiff-pop-up.css';

import { Mark } from 'prosemirror-model';
import { Plugin, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ComponentProps } from 'react';

import applyMark from './applyMark';
import findNodesWithSameMark from './findNodesWithSameMark';
import lookUpElement from './lookUpElement';
import { MARK_LINK } from './MarkNames';
import createPopUp from './ui/createPopUp';
import CustomEditorView from './ui/CustomEditorView';
import LinkTooltip from './ui/LinkTooltip';
import LinkURLEditor from './ui/LinkURLEditor';
import { PopUpHandle } from './ui/PopUp';
import { atAnchorTopCenterOverflow } from './ui/PopUpPosition';
import uuid from './ui/uuid';
// https://prosemirror.net/examples/tooltip/
const SPEC = {
  view(editorView: EditorView) {
    return new LinkTooltipView(editorView);
  }
};

class LinkTooltipPlugin extends Plugin {
  constructor() {
    super(SPEC);
  }
}

class LinkTooltipView {
  _anchorEl: Node | null = null;

  _popup: PopUpHandle<ComponentProps<typeof LinkTooltip>> | null = null;

  _editor: PopUpHandle<ComponentProps<typeof LinkURLEditor>> | null = null;

  constructor(editorView: EditorView) {
    this.update(editorView);
  }

  update(view: EditorView): void {
    if (!(view instanceof CustomEditorView) || view.readOnly) {
      this.destroy();
      return;
    }

    const { state } = view;
    const { doc, selection, schema } = state;
    const markType = schema.marks[MARK_LINK];

    if (!markType) {
      return;
    }

    const { from, to } = selection;

    if (from !== to) {
      this.destroy();
      return;
    }

    let result: { from: number; to: number; mark: Mark } | undefined;
    // make sure the `nodesBetween` 'from' and 'to' not exeeding the doc size
    // `2` - the min pos to find text node
    // `doc.nodeSize - 2` - the max pos to find text node
    doc.nodesBetween(Math.max(from - 1, 2), Math.min(to + 1, doc.nodeSize - 2), (node, pos) => {
      const maybeMark = node.marks.find((mark) => mark.type === markType);
      if (maybeMark) {
        result = { from: pos, to: pos + node.nodeSize, mark: maybeMark };
        return false;
      }
      return true;
    });

    if (!result) {
      this.destroy();
      return;
    }

    // migrate all old links (without id attrs) to have id
    if (!result.mark.attrs.id && result.from !== result.to) {
      const { tr } = view.state;
      tr.removeMark(result.from, result.to, result.mark.type);
      tr.addMark(
        result.from,
        result.to,
        result.mark.type.create({
          ...result.mark.attrs,
          id: uuid()
        })
      );

      view.dispatch(tr);
    }

    // try to find a element by node id
    let anchorEl: HTMLElement | Node | null = document.getElementById(result.mark.attrs.id);

    // try to find from pos if there is on id to the node
    if (!anchorEl) {
      const domFound = view.domAtPos(from);

      if (!domFound) {
        this.destroy();
        return;
      }

      anchorEl = lookUpElement(domFound.node, (el) => el.nodeName === 'A');
    }

    if (!anchorEl) {
      this.destroy();
      return;
    }

    const popup = this._popup;
    const viewPops = {
      editorState: state,
      editorView: view,
      href: result.mark.attrs.href,
      onCancel: this._onCancel,
      onEdit: this._onEdit,
      onRemove: this._onRemove
    };

    if (popup && anchorEl === this._anchorEl) {
      popup.update(viewPops);
    } else {
      popup?.close();
      this._anchorEl = anchorEl;
      this._popup = createPopUp(LinkTooltip, viewPops, {
        anchor: anchorEl,
        autoDismiss: false,
        onClose: this._onClose,
        position: atAnchorTopCenterOverflow // update here to follow
      });
    }
  }

  destroy() {
    this._popup?.close();
    this._editor?.close();
  }

  _onCancel = (view: EditorView): void => {
    this.destroy();
    view.focus();
  };

  _onClose = (): void => {
    this._anchorEl = null;
    this._editor = null;
    this._popup = null;
  };

  _onEdit = (view: EditorView): void => {
    if (this._editor) {
      return;
    }

    const { state } = view;
    const { schema, doc, selection } = state;
    const { from, to } = selection;
    const markType = schema.marks[MARK_LINK];
    const result = findNodesWithSameMark(doc, from, to, markType);

    if (!result) {
      return;
    }

    let { tr } = state;
    const linkSelection = TextSelection.create(tr.doc, result.from.pos, result.to.pos + 1);
    tr = tr.setSelection(linkSelection);
    view.dispatch(tr);
    const href = result ? result.mark.attrs.href : null;
    const anchorEl = document.getElementsByClassName('selection-marker')[0];
    this._editor = createPopUp(
      LinkURLEditor,
      {
        href
      },
      {
        onClose: (value) => {
          this._editor = null;

          this._onEditEnd(view, selection, value);
        },
        modal: false,
        anchor: anchorEl,
        position: atAnchorTopCenterOverflow
      }
    );
  };

  _onRemove = (view: EditorView): void => {
    this._onEditEnd(view, view.state.selection, null);
  };

  _onEditEnd = (view: EditorView, initialSelection: TextSelection, href?: string | null): void => {
    const { state, dispatch } = view;
    let { tr } = state;
    if (href !== undefined) {
      const { schema } = state;
      const markType = schema.marks[MARK_LINK];

      if (markType) {
        const result =
          findNodesWithSameMark(tr.doc, initialSelection.from, initialSelection.to, markType) ||
          // findNodesWithSameMark finds the node directly after the selection, if at the end of the link it wont be found
          // so we try to take the selection one step back
          findNodesWithSameMark(tr.doc, initialSelection.from - 1, initialSelection.to - 1, markType);

        if (result) {
          const linkSelection = TextSelection.create(tr.doc, result.from.pos, result.to.pos + 1);
          tr = tr.setSelection(linkSelection);
          const attrs = href
            ? {
                href,
                id: result.mark.attrs.id
              }
            : null;
          tr = applyMark(tr, schema, markType, attrs);
        }
      }
    }

    tr = tr.setSelection(TextSelection.create(tr.doc, initialSelection.from, initialSelection.to));
    dispatch(tr);
    view.focus();
  };
}

export default LinkTooltipPlugin;
