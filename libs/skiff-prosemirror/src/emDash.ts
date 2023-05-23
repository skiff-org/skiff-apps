// @flow

import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import UICommand from './ui/UICommand';

function insertEmDash(tr: Transaction, schema: Schema): Transaction {
  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const { from, to } = selection;

  if (from !== to) {
    return tr;
  }

  tr = tr.insert(from, schema.text('—'));
  return tr;
}

class EmDash extends UICommand {
  execute = (state: EditorState, dispatch: ((tr: Transaction) => void) | null | undefined): boolean => {
    const { selection, schema } = state;
    const tr = insertEmDash(state.tr.setSelection(selection), schema);
    if (tr.docChanged && dispatch) {
      dispatch(tr);
      return true;
    }
    return false;
  };
}

export default EmDash;
