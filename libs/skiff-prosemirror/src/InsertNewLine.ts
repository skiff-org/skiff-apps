import { Fragment } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { HARD_BREAK } from './NodeNames';

export function insertNewLine(
  state: EditorState,
  dispatch: ((tr: Transaction<any>) => void) | undefined,
  view: EditorView | undefined | null
): boolean {
  if (!dispatch) return false;

  const { selection } = state;

  if (!selection) {
    return false;
  }

  const { from, empty } = selection;

  if (!empty) {
    return false;
  }

  const br = state.schema.nodes[HARD_BREAK];

  if (!br) {
    return false;
  }

  const { tr } = state;

  tr.insert(from, Fragment.from(br.create()));
  tr.setSelection(TextSelection.create(tr.doc, from + 1, from + 1));

  dispatch(tr);
  return true;
}
