// @flow

import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import UICommand from './ui/UICommand';

function insertEnDash(tr: Transaction, schema: Schema): Transaction {
  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const { from, to } = selection;

  if (from !== to) {
    return tr;
  }

  tr = tr.insert(from, schema.text('–'));
  return tr;
}

class EnDash extends UICommand {
  execute = (state: EditorState, dispatch: ((tr: Transaction) => void) | null | undefined): boolean => {
    const { selection, schema } = state;
    const tr = insertEnDash(state.tr.setSelection(selection), schema);

    if (tr.docChanged && dispatch) {
      dispatch(tr);
      return true;
    }
    return false;
  };
}

export default EnDash;
