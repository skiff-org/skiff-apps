import { EditorState, Transaction } from 'prosemirror-state';

import { Command } from '../types';

import { findAdjacentNodeStart } from './findAdjacentNodeStart';
import { recurseAdjacentListNodes } from './recurseAdjacentListNodes';

export const syncOrderedLists =
  (from: number, to: number, tr: Transaction): Command =>
  (state: EditorState, dispatch) => {
    const { schema } = state;
    // Find the ordered_list node adjacent to the replaced list node and update the start counters
    // at that depth if needed
    const start = findAdjacentNodeStart(tr.doc.resolve(from).before(1), schema.nodes.ordered_list, tr.doc);
    const end = findAdjacentNodeStart(tr.doc.resolve(to).after(1), schema.nodes.ordered_list, tr.doc, false);
    recurseAdjacentListNodes(start, end, schema.nodes.ordered_list, schema.nodes.list_item, tr);
    if (dispatch) {
      dispatch(tr);
    }
    return tr.docChanged;
  };
