// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js
import { NodeSelection, Transaction } from 'prosemirror-state';
import { canJoin, joinPoint } from 'prosemirror-transform';
// Join the selected block, or the closest ancestor of the selection
// that can be joined, with the sibling after it.

export default function joinDown(tr: Transaction): Transaction {
  const sel = tr.selection;
  let point;

  if (sel instanceof NodeSelection) {
    if (sel.node.isTextblock || !canJoin(tr.doc, sel.to)) {
      return tr;
    }

    point = sel.to;
  } else {
    point = joinPoint(tr.doc, sel.to, 1);

    if (point === null || point === undefined) {
      return tr;
    }
  }

  tr = tr.join(point);
  return tr;
}
