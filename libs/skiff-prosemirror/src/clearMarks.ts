import { CellSelection } from '@skiff-org/prosemirror-tables';
import { Mark, Node, Schema } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

import * as MarkNames from './MarkNames';
import { setTextAlign } from './TextAlignCommand';

const {
  MARK_EM,
  MARK_FONT_SIZE,
  MARK_FONT_TYPE,
  MARK_STRIKE,
  MARK_STRONG,
  MARK_TEXT_COLOR,
  MARK_TEXT_HIGHLIGHT,
  MARK_UNDERLINE
} = MarkNames;
const FORMAT_MARK_NAMES = [
  MARK_EM,
  MARK_FONT_SIZE,
  MARK_FONT_TYPE,
  MARK_STRIKE,
  MARK_STRONG,
  MARK_TEXT_COLOR,
  MARK_TEXT_HIGHLIGHT,
  MARK_UNDERLINE
];
export default function clearMarks(tr: Transaction, schema: Schema): Transaction {
  const { doc, selection } = tr;

  if (!selection || !doc) {
    return tr;
  }

  const { from, to, empty } = selection;

  if (empty) {
    return tr;
  }

  const markTypesToRemove = new Set(FORMAT_MARK_NAMES.map((n) => schema.marks[n]).filter(Boolean));

  if (!markTypesToRemove.size) {
    return tr;
  }

  const tasks: Array<{ node: Node; pos: number; mark: Mark }> = [];

  if (selection instanceof CellSelection) {
    selection.forEachCell((cell: any, cellPos: any) => {
      doc.nodesBetween(cellPos, cell.nodeSize + cellPos, (node: any, pos: any) => {
        if (node.marks?.length) {
          node.marks.some((cellMark: any) => {
            if (markTypesToRemove.has(cellMark.type)) {
              tasks.push({
                node,
                pos,
                mark: cellMark
              });
            }
          });
          return true;
        }
        return true;
      });
    });
  } else {
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.marks?.length) {
        node.marks.some((mark) => {
          if (markTypesToRemove.has(mark.type)) {
            tasks.push({
              node,
              pos,
              mark
            });
          }
        });
        return true;
      }

      return true;
    });
  }

  if (!tasks.length) {
    return tr;
  }

  tasks.forEach((job) => {
    const { node, mark, pos } = job;
    tr = tr.removeMark(pos, pos + node.nodeSize, mark.type);
  });
  // It should also clear text alignment.
  tr = setTextAlign(tr, schema, null);
  return tr;
}
