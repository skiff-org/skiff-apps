import { CellSelection, Rect, TableMap } from '@skiff-org/prosemirror-tables';
import { Node } from 'prosemirror-model';
import { EditorState, Selection, TextSelection } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';

import { TABLE_CELL, TABLE_HEADER } from './NodeNames';

type Result = {
  node: Node;
  pos: number;
};

function findActionableCellFromSelection(selection: CellSelection): Result | null | { node: null; pos: never } {
  const { $anchorCell } = selection;
  const start = $anchorCell.start(-1);
  const table = $anchorCell.node(-1);
  const tableMap = TableMap.get(table);
  let topRightRect: Rect | undefined;
  let posFound: null | number = null;
  let nodeFound: null | Node = null;
  selection.forEachCell((cell, cellPos) => {
    const cellRect = tableMap.findCell(cellPos - start);

    if (!topRightRect || (cellRect.top >= topRightRect.top && cellRect.left > topRightRect.left)) {
      topRightRect = cellRect;
      posFound = cellPos;
      nodeFound = cell;
    }
  });
  return posFound === null
    ? null
    : {
        node: nodeFound,
        pos: posFound
      };
}

export default function findActionableCell(state: EditorState):
  | Result
  // TODO: This is NodeWithPos, but here we have a type guard issue with ts. Fix it if you touch it :) Not urgent.
  | { node: null; pos: never }
  | null {
  const { doc, selection, schema } = state;
  const tdType = schema.nodes[TABLE_CELL];
  const thType = schema.nodes[TABLE_HEADER];

  if (!tdType && !thType) {
    return null;
  }

  let userSelection: Selection | CellSelection = selection;

  if (userSelection instanceof TextSelection) {
    const { from, to } = selection;

    if (from !== to) {
      return null;
    }

    const result =
      (tdType && findParentNodeOfType(tdType)(selection)) || (thType && findParentNodeOfType(thType)(selection));

    if (!result) {
      return null;
    }

    userSelection = CellSelection.create(doc, result.pos);
  }

  if (userSelection instanceof CellSelection) {
    return findActionableCellFromSelection(userSelection);
  }

  return null;
}
