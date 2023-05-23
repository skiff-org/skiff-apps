import { Fragment } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';

import { syncOrderedLists } from './syncOrderedLists';

export const deleteListItem = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null) => {
  const {
    selection: { from, to },
    schema
  } = state;
  const { tr } = state;
  if (from !== to) {
    return false;
  }
  const resPos = state.doc.resolve(from);
  const startOfBlock = resPos.nodeBefore === null && resPos.textOffset === 0;
  if (startOfBlock && resPos.depth === 3 && resPos.node(2).type === schema.nodes.list_item) {
    // Checks whether the current selection points to start of list_item in which case try to unwrap the paragraph
    const startPos = tr.doc.resolve(from - 1);
    const range = startPos.blockRange(tr.doc.resolve(startPos.pos + resPos.parent.nodeSize));
    const targetDepth = range && liftTarget(range);
    // Check with typeof since with prosemirror-transform pre 1.6.0 targetDepth is undefined
    if (range && typeof targetDepth === 'number') {
      tr.lift(range, targetDepth);
      syncOrderedLists(range.start - 1, range.end + 1, tr)(state);
      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  } else if (startOfBlock) {
    // Checks whether selection is start of a paragraph that can be joined to a list_item above instead of the default
    // funky wrapping of it in a new list
    const posBefore = resPos.before(1);
    const before = state.doc.resolve(posBefore);
    const { nodeAfter, nodeBefore } = before;
    if (
      nodeAfter?.type === schema.nodes.paragraph &&
      (nodeBefore?.type === schema.nodes.ordered_list || nodeBefore?.type === schema.nodes.bullet_list)
    ) {
      // -4 is silly but it's basically how many nodes have to be cut through -> <ol><li><p>1.|</p></li></ol><p>|2.</p>
      tr.replaceWith(from - 4, from, Fragment.empty);
      syncOrderedLists(from - 5, from + 1, tr)(state);
      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  }
  return false;
};
