import { isInTable } from '@skiff-org/prosemirror-tables';
import { Fragment, Schema } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { HARD_BREAK, LIST_ITEM, LIST_TASK_ITEM } from './NodeNames';
import splitListItem from './splitListItem';
import UICommand from './ui/UICommand';

// This handles the case when user press SHIFT + ENTER key to insert a new line
// into list item.
function insertNewLine(
  tr: Transaction,
  schema: Schema,
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): Transaction {
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

  const listItem = schema.nodes[LIST_ITEM];
  const todoItem = schema.nodes[LIST_TASK_ITEM];
  const result = findParentNodeOfType(listItem)(selection) || findParentNodeOfType(todoItem)(selection);

  if (!result) {
    return tr;
  }

  if (isInTable(state)) {
    return splitListItem(tr.setSelection(selection), schema);
  }

  tr = tr.insert(from, Fragment.from(br.create()));
  tr = tr.setSelection(TextSelection.create(tr.doc, from + 1, from + 1));
  return tr;
}

class ListItemInsertNewLineCommand extends UICommand {
  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { schema, selection } = state;
    const tr = insertNewLine(state.tr.setSelection(selection), schema, state, dispatch);

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

export default ListItemInsertNewLineCommand;
