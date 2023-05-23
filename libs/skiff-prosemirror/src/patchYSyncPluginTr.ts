import { CellSelection } from '@skiff-org/prosemirror-tables';
import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';

import TableNodesSpecs from './TableNodesSpecs';

const patchSelection = (oldState: EditorState, tr: Transaction): Transaction => {
  if (oldState.selection instanceof NodeSelection) {
    const $from = tr.doc.resolve(tr.selection.from);
    // Make sure the new selection is still valid as a NodeSelection, else leave as TextSelection.
    if ($from.nodeAfter) {
      tr.setSelection(new NodeSelection($from));
    }
  } else if (oldState.selection instanceof CellSelection) {
    const anchorCell = tr.selection.$anchor.node();
    const headCell = tr.selection.$head.node();
    // Make sure the new selection is still valid as a CellSelection, else leave as TextSelection.
    if (anchorCell.type.spec === TableNodesSpecs.table_cell && headCell.type.spec === TableNodesSpecs.table_cell) {
      tr.setSelection(CellSelection.create(tr.doc, tr.selection.$anchor.before(), tr.selection.$head.before()));
    }
  }
  // Select-all appears to work properly (even w/ concurrent editors) already, so no AllSelection case.
  return tr;
};

/**
 * Given a transaction dispatched by y-prosemirror's ySyncPlugin, updates the tr
 * to patch any ySyncPlugin issues we are aware of.
 *
 * Current patches:
 * - patchSelection: Changes the restored selection to have the same type as the original,
 * see https://linear.app/skiff/issue/ENG-3327/non-text-selections-break-on-next-edit-misc-selection-bugs
 *
 * @return tr
 */
export const patchYSyncPluginTr = (oldState: EditorState, tr: Transaction): Transaction => {
  return patchSelection(oldState, tr);
};
