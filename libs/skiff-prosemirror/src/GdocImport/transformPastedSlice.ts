import { TableMap } from '@skiff-org/prosemirror-tables';
import { Fragment } from 'prosemirror-model';
import { Node as ProsemirrorNode, Slice } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import { HARD_BREAK, TABLE, TABLE_CELL } from '../NodeNames';

/**
 * google docs fills empty cells with hard breaks -
 * that causing prosemirror create the paragraphs inside the cells with 2 <br>s
 * we should remove the hard breaks and let prosemirror add them if needed
 *
 * @param cell
 * @returns cells without hark breaks
 */
const clearCellsFromHardBreaks = (cell: ProsemirrorNode): ProsemirrorNode => {
  let cellFragment = cell.content;
  cellFragment.forEach((child: ProsemirrorNode, blockOffset: number, blockIndex: number) => {
    if (child.type.isTextblock) {
      let blockFragment = child.content;
      blockFragment.forEach((textChild: ProsemirrorNode) => {
        if (textChild.type.name === HARD_BREAK) {
          // remove hard_break - should be only child
          blockFragment = blockFragment.cut(1);
        }
      });
      cellFragment = cellFragment.replaceChild(
        blockIndex,
        child.type.createAndFill(child.attrs, blockFragment, child.marks) || child
      );
    }
  });
  const nonEmptyNodes: ProsemirrorNode[] = [];

  cellFragment.forEach((child) => {
    if (child.content.size > 0 || cell.attrs.type !== 'text') nonEmptyNodes.push(child);
  });

  return cell.type.createAndFill(cell.attrs, Fragment.fromArray(nonEmptyNodes), cell.marks) || cell;
};

const handleTablesMergedCellsPaste = (slice: Slice): Slice => {
  let fragment = slice.content;

  // in case we find a problem and cant fix it, we should abort the paste to prevent from the doc to be destroyed
  let abortPaste = false;

  // normalize tables
  fragment.forEach((maybeTable: ProsemirrorNode, offset: number, tableIndex: number) => {
    if (maybeTable.type.name === TABLE) {
      let tableFragment = maybeTable.content;
      const tableMap = TableMap.get(maybeTable as any); // TODO: resolve version conflict with @skiff-org/prosemirror-tables
      const { width: tableWidth } = tableMap;

      maybeTable.content.forEach((row: ProsemirrorNode, rowOffset: number, rowIndex: number) => {
        let newRow;
        // table with merged cells - fill with empty cells at the end
        if (row.childCount !== tableWidth) {
          newRow = row.type.createAndFill({}, [
            ...(row.content as any).content.map((cell: ProsemirrorNode) => {
              cell.attrs.colspan = 1;
              cell.attrs.rowspan = 1;
              return clearCellsFromHardBreaks(cell);
            }),
            ...new Array(tableWidth - row.childCount)
              .fill(null)
              .map(() => row.type.schema.nodes[TABLE_CELL].createAndFill())
          ]);
        } else {
          newRow = row.type.createAndFill(
            {},
            (row.content as any).content.map((cell: ProsemirrorNode) => {
              cell.attrs.rowspan = 1;
              return clearCellsFromHardBreaks(cell);
            })
          );
        }

        if (newRow) {
          tableFragment = tableFragment.replaceChild(rowIndex, newRow);
        } else {
          // merged cells are not supported at the moment so we must abort the paste
          abortPaste = true;
        }
      });

      const newTable = maybeTable.type.createAndFill(maybeTable.attrs, tableFragment);
      if (newTable) fragment = fragment.replaceChild(tableIndex, newTable);
    }
  });

  if (abortPaste) {
    return Slice.empty;
  }
  return new Slice(fragment, slice.openStart, slice.openEnd);
};

const transformPastedSlice = () =>
  new Plugin({
    props: {
      transformPasted(slice: Slice) {
        slice = handleTablesMergedCellsPaste(slice);
        return slice;
      }
    }
  });

export default transformPastedSlice;
