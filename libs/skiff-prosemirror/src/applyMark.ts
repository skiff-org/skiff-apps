import { MarkType, Node, Schema } from 'prosemirror-model';
import { SelectionRange, Transaction } from 'prosemirror-state';

function markApplies(doc: Node, ranges: SelectionRange[], type: MarkType) {
  for (let i = 0; i < ranges.length; i += 1) {
    const { $from, $to } = ranges[i];
    let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
    doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (can) {
        return false;
      }

      can = node.inlineContent && node.type.allowsMarkType(type);
      return true;
    });

    if (can) {
      return true;
    }
  }

  return false;
} // https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js

export default function applyMark(
  tr: Transaction,
  _schema: Schema,
  markType: MarkType,
  attrs?: Record<string, any> | null,
  // set false, if you want to keep inside mark of the same type
  // -> te[xt[tex]tt]ext <- when false
  // -> te[xt tex tt]ext <- when true
  removeSameInsideMarks = true
): Transaction {
  if (!tr.selection || !tr.doc || !markType) {
    return tr;
  }

  const { empty, ranges } = tr.selection;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { $cursor } = tr.selection;

  if ((empty && !$cursor) || !markApplies(tr.doc, ranges, markType)) {
    return tr;
  }

  if ($cursor) {
    tr = tr.removeStoredMark(markType);
    return attrs ? tr.addStoredMark(markType.create(attrs)) : tr;
  }

  let has = false;

  for (let i = 0; !has && i < ranges.length; i += 1) {
    const { $from, $to } = ranges[i];
    has = tr.doc.rangeHasMark($from.pos, $to.pos, markType);
  }

  for (let i = 0; i < ranges.length; i += 1) {
    const { $from, $to } = ranges[i];

    if (has && removeSameInsideMarks) {
      tr = tr.removeMark($from.pos, $to.pos, markType);
    }

    if (attrs) {
      tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
    }
  }

  return tr;
}
