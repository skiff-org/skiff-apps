import { CellSelection, mergeCells } from '@skiff-org/prosemirror-tables';
import { Node, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import { PARAGRAPH, TABLE_CELL, TEXT } from './NodeNames';
import UICommand from './ui/UICommand';

function isBlankParagraphNode(node?: Node | null): boolean {
  if (!node) {
    return false;
  }

  if (node.type.name !== PARAGRAPH) {
    return false;
  }

  const { firstChild, lastChild } = node;

  if (!firstChild) {
    return true;
  }

  if (firstChild !== lastChild) {
    return false;
  }

  return firstChild.type.name === TEXT && firstChild.text === ' ';
}

function purgeConsecutiveBlankParagraphNodes(tr: Transaction, schema: Schema): Transaction {
  const paragraph = schema.nodes[PARAGRAPH];
  const cell = schema.nodes[TABLE_CELL];

  if (!paragraph || !cell) {
    return tr;
  }

  const { doc, selection } = tr;

  if (!(selection instanceof CellSelection)) {
    return tr;
  }

  const { from, to } = selection;
  const paragraphPoses: number[] = [];
  doc.nodesBetween(from, to, (node, pos, parentNode) => {
    if (node.type === paragraph && parentNode.type === cell) {
      if (isBlankParagraphNode(node)) {
        const $pos = tr.doc.resolve(pos);

        if (isBlankParagraphNode($pos.nodeBefore)) {
          paragraphPoses.push(pos);
        }
      }

      return false;
    }
    return true;
  });
  paragraphPoses.reverse().forEach((pos) => {
    const cell = tr.doc.nodeAt(pos);
    if (cell?.nodeSize) {
      tr = tr.delete(pos, pos + cell.nodeSize);
    }
  });
  return tr;
}

class TableMergeCellsCommand extends UICommand {
  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { tr, schema, selection } = state;
    let endTr = tr;

    if (selection instanceof CellSelection) {
      mergeCells(state, (nextTr) => {
        endTr = nextTr;
      });
      // Also merge onsecutive blank paragraphs into one.
      endTr = purgeConsecutiveBlankParagraphNodes(endTr, schema);
    }

    const changed = endTr.docChanged || endTr !== tr;
    if (changed) dispatch?.(endTr);
    return changed;
  };
}

export default TableMergeCellsCommand;
