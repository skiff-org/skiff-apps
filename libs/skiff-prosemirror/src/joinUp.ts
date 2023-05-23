// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js
import { NodeSelection, Transaction } from 'prosemirror-state';
import { canJoin, joinPoint } from 'prosemirror-transform';
// Join the selected block or, if there is a text selection, the
// closest ancestor block of the selection that can be joined, with
// the sibling above it.

export default function joinUp(tr: Transaction): Transaction {
  const sel = tr.selection;
  const nodeSel = sel instanceof NodeSelection;
  let point;

  if (sel instanceof NodeSelection && nodeSel) {
    if (sel.node.isTextblock || !canJoin(tr.doc, sel.from)) {
      return tr;
    }

    point = sel.from;
  } else {
    point = joinPoint(tr.doc, sel.from, -1);

    if (point === null || point === undefined) {
      return tr;
    }
  }

  tr = tr.join(point);

  if (nodeSel) {
    tr = tr.setSelection(NodeSelection.create(tr.doc, point - (tr.doc.resolve(point).nodeBefore?.nodeSize || 0)));
  }

  return tr;
}
