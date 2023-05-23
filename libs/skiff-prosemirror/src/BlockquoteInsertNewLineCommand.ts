import { Fragment, Schema } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { BLOCKQUOTE, HARD_BREAK } from './NodeNames';
import UICommand from './ui/UICommand';

// This handles the case when user press SHIFT + ENTER key to insert a new line
// into blockquote.
function insertNewLine(tr: Transaction, schema: Schema): Transaction {
  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const { from, empty } = selection;

  if (!empty) {
    return tr;
  }

  const br = schema.nodes[HARD_BREAK];

  if (!br) {
    return tr;
  }

  const blockquote = schema.nodes[BLOCKQUOTE];
  const result = findParentNodeOfType(blockquote)(selection);

  if (!result) {
    return tr;
  }

  tr = tr.insert(from, Fragment.from(br.create()));
  tr = tr.setSelection(TextSelection.create(tr.doc, from + 1, from + 1));
  return tr;
}

class BlockquoteInsertNewLineCommand extends UICommand {
  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { schema, selection } = state;
    const tr = insertNewLine(state.tr.setSelection(selection), schema);

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

export default BlockquoteInsertNewLineCommand;
