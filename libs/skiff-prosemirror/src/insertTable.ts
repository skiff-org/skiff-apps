import { Fragment, Schema } from 'prosemirror-model';
import { TextSelection, Transaction } from 'prosemirror-state';

import { PARAGRAPH, TABLE, TABLE_CELL, TABLE_ROW } from './NodeNames';

export default function insertTable(tr: Transaction, schema: Schema, rows: number, cols: number): Transaction {
  if (!tr.selection || !tr.doc) {
    return tr;
  }

  const { from, to } = tr.selection;

  if (from !== to) {
    return tr;
  }

  const { nodes } = schema;
  const cell = nodes[TABLE_CELL];
  const paragraph = nodes[PARAGRAPH];
  const row = nodes[TABLE_ROW];
  const table = nodes[TABLE];

  if (!(cell && paragraph && row && table)) {
    return tr;
  }

  const rowNodes = [];

  for (let rr = 0; rr < rows; rr += 1) {
    const cellNodes = [];

    for (let cc = 0; cc < cols; cc += 1) {
      const paragraphNode = paragraph.create();
      const cellNode = cell.create({}, Fragment.from(paragraphNode));
      cellNodes.push(cellNode);
    }

    const rowNode = row.create({}, Fragment.from(cellNodes));
    rowNodes.push(rowNode);
  }

  const tableNode = table.create({}, Fragment.from(rowNodes));
  tr = tr.insert(from, Fragment.from(tableNode));
  // We inserted a table node with row and cell nodes, the first row is the header cells which we want to skip,
  // to put the cursor into the first cell, we need to move the selection forward 14 positions
  const selection = TextSelection.create(tr.doc, from + 14, from + 14);
  tr = tr.setSelection(selection);
  return tr;
}
