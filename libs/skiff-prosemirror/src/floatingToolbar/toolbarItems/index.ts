import { codeItem, deleteImageItem, horizontalLineItem, imageItem, mathItem, tableItem } from './nodesItems';
import {
  cellsBackgroundColorsItemDropdown,
  columnsControlItems,
  deleteCellsItem,
  rowsControlItems,
  toggleHeadersItem
} from './tableItems';
import {
  clearFormatItem,
  commentItem,
  indentationItems,
  italicItem,
  linkItem,
  strikeItem,
  strongItem,
  textColorsItemDropdown,
  textItemDropdown,
  underlineItem
} from './textItems';

// TODO-TB: check if there is need in function here
export const toolbarItems = [
  [textItemDropdown], // text blocks and lists
  [textColorsItemDropdown], // colors
  [...indentationItems],
  [cellsBackgroundColorsItemDropdown], // cells colors
  [strongItem, underlineItem, italicItem, strikeItem, clearFormatItem], // text marks
  [deleteCellsItem],
  [codeItem, mathItem, linkItem, tableItem, horizontalLineItem], //nodes
  [commentItem], // comment
  [...columnsControlItems], // table columns
  [...rowsControlItems], // table rows
  [toggleHeadersItem],
  [imageItem, deleteImageItem] // image
];
