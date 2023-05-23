import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ComponentProps } from 'react';

import applyMark from './applyMark';
import findNodesWithSameMark from './findNodesWithSameMark';
import { MARK_LINK } from './MarkNames';
import createPopUp from './ui/createPopUp';
import LinkURLEditor from './ui/LinkURLEditor';
import { PopUpHandle } from './ui/PopUp';
import { atAnchorBottomLeft } from './ui/PopUpPosition';
import UICommand from './ui/UICommand';
import uuid from './ui/uuid';

class LinkSetURLCommand extends UICommand {
  _popUp: PopUpHandle<ComponentProps<typeof LinkURLEditor>> | null = null;

  isEnabled = (state: EditorState): boolean => {
    if (!(state.selection instanceof TextSelection)) {
      // Could be a NodeSelection or CellSelection.
      return false;
    }

    const markType = state.schema.marks[MARK_LINK];

    if (!markType) {
      return false;
    }

    const { from, to } = state.selection;
    return from < to;
  };

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): Promise<any> => {
    if (this._popUp) {
      return Promise.resolve(undefined);
    }

    const { doc, schema, selection } = state;
    const markType = schema.marks[MARK_LINK];

    if (!markType) {
      return Promise.resolve(undefined);
    }

    const { from, to } = selection;
    if (from >= to) return Promise.resolve(undefined);
    const result = findNodesWithSameMark(doc, from, to, markType);
    const href = result ? result.mark.attrs.href : null;
    const anchorEl = document.getElementsByClassName('selection-marker')[0];
    return new Promise((resolve) => {
      this._popUp = createPopUp(
        LinkURLEditor,
        {
          href
        },
        {
          modal: false,
          onClose: (val) => {
            if (this._popUp) {
              this._popUp = null;
              resolve(val);
            }
          },
          anchor: anchorEl,
          autoDismiss: false,
          closeOnClick: true,
          position: atAnchorBottomLeft
        }
      );
    });
  };

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    href?: string | null
  ): boolean => {
    if (dispatch) {
      const { selection, schema } = state;
      let { tr } = state;
      tr = tr.setSelection(selection);

      if (href !== undefined) {
        const markType = schema.marks[MARK_LINK];
        const attrs = href
          ? {
              href,
              id: uuid()
            }
          : null;
        tr = applyMark(tr.setSelection(state.selection), schema, markType, attrs);
      }

      dispatch(tr);
    }

    view?.focus();
    return true;
  };
}

export default LinkSetURLCommand;
