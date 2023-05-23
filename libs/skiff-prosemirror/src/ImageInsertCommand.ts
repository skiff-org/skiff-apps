import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ComponentProps } from 'react';
import { assertExists } from 'skiff-utils';

import createPopUp from './ui/createPopUp';
import ImageUploadPane from './ui/ImageUploadPane';
import LinkURLEditor from './ui/LinkURLEditor';
import { PopUpHandle } from './ui/PopUp';
import { atAnchorBottomLeft } from './ui/PopUpPosition';
import UICommand from './ui/UICommand';

class ImageInsertCommand extends UICommand {
  _popUp: PopUpHandle<ComponentProps<typeof LinkURLEditor>> | null = null;

  isEnabled = (state: EditorState): boolean => {
    const tr = state;
    const { selection } = tr;
    if (selection instanceof TextSelection) {
      return selection.from === selection.to;
    }

    return false;
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

    const anchorEl = document.getElementById('image-insert');

    return new Promise((resolve) => {
      this._popUp = createPopUp(
        ImageUploadPane,
        {
          editorState: state
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
          closeOnClick: false,
          position: atAnchorBottomLeft
        }
      );
    });
  };

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    imgSrc?: string | null
  ): boolean => {
    if (dispatch) {
      const schema = state.schema as Schema;
      assertExists(schema.nodes.image, 'Image node not found in schema');
      const node = schema.nodes.image.create({
        src: imgSrc
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      let { tr } = state;
      const { selection } = state;
      tr = tr.setSelection(selection);
      const transaction = tr.insert(tr.selection.from, node);
      dispatch(transaction);
    }

    view?.focus();
    return true;
  };
}

export default ImageInsertCommand;
