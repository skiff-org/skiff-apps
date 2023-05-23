import { setCellAttr } from '@skiff-org/prosemirror-tables';
import nullthrows from 'nullthrows';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ComponentProps } from 'react';

import ColorEditor from './ui/ColorEditor';
import createPopUp from './ui/createPopUp';
import { PopUpHandle } from './ui/PopUp';
import { atAnchorRight } from './ui/PopUpPosition';
import UICommand from './ui/UICommand';

const setCellBackgroundBlack = setCellAttr('background', '#000000');

class TableBackgroundColorCommand extends UICommand {
  _popUp: PopUpHandle<ComponentProps<typeof ColorEditor>> | null = null;

  shouldRespondToUIEvent = (e: React.SyntheticEvent | MouseEvent): boolean => e.type === UICommand.EventType.MOUSEENTER;

  isEnabled = (state: EditorState): boolean => setCellBackgroundBlack(state);

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): Promise<any> => {
    if (this._popUp) {
      return Promise.resolve(undefined);
    }

    const target = nullthrows(event).currentTarget;

    if (!(target instanceof HTMLElement)) {
      return Promise.resolve(undefined);
    }

    const anchor = event ? event.currentTarget : null;
    return new Promise((resolve) => {
      this._popUp = createPopUp(
        ColorEditor,
        {
          highlight: true
        },
        {
          anchor,
          position: atAnchorRight,
          onClose: (val) => {
            if (this._popUp) {
              this._popUp = null;
              resolve(val);
            }
          }
        }
      );
    });
  };

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    hex?: string | null
  ): boolean => {
    if (dispatch && hex !== undefined) {
      const cmd = setCellAttr('background', hex);
      cmd(state, dispatch);
      return true;
    }

    return false;
  };

  cancel(): void {
    this._popUp?.close(undefined);
  }
}

export default TableBackgroundColorCommand;
