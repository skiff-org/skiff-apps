import { Command } from 'prosemirror-commands';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { DOC_DESCRIPTION, DOC_TITLE } from '../NodeNames';

const NOT_FOCUSABLE_NODES = [DOC_TITLE, DOC_DESCRIPTION];

/**
 * focus to the first text block when pressing enter at the end of the doc title
 * @param state
 * @param dispatch
 * @param view
 * @returns
 */
export const enterFromTitle: Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
) => {
  if (!dispatch || !view) return false;
  const { to } = state.selection;

  const inTitle = state.doc.resolve(to).parent.type.name === DOC_TITLE;
  // if not in title - return
  if (!inTitle) return false;

  const atEndOfTitle = view.endOfTextblock('right');
  // if not at the end of the title - return
  if (!atEndOfTitle) return false;

  let firstTextBlockPos: number | undefined;

  // go throw the doc to find the first text block after the title
  state.doc.descendants((node, pos) => {
    if (firstTextBlockPos) return false;
    const { name } = node.type;
    // make sure to skip title and description
    if (!NOT_FOCUSABLE_NODES.includes(name)) {
      // find the first text block and set the selection in this block beginning
      if (node.isTextblock) {
        firstTextBlockPos = pos;
        return false;
      }
    }
    return true;
  });
  if (!firstTextBlockPos) return false;

  const { tr } = state;
  tr.setSelection(new TextSelection(state.doc.resolve(firstTextBlockPos + 1)));
  dispatch(tr);
  return true;
};
