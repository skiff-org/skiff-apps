import { CellSelection, isInTable, selectedRect } from '@skiff-org/prosemirror-tables';
import {
  addBottomRow,
  addRightColumn,
  changeCellsBackgroundColor,
  deleteLastCol,
  deleteLastRow,
  getDeleteCommand,
  isCellColorActive,
  toggleTableHeaders
} from '@skiff-org/prosemirror-tables';
import crelt from 'crelt';
import { Icon } from '@skiff-org/skiff-ui';
import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';
import { HIGHLIGHT_COLORS } from 'skiff-front-utils';

import { getToolbarType } from '../utils';

import AnimatedDropdown from './customMenu/AnimatedDropdown';
import SkiffMenuItem from './customMenu/SkiffMenuItem';
import { itemsMap, ToolbarItemsIds } from './itemsMap';
import { addDeleteHoverClass, createElementWithClassAndIcon, removeDeleteHoverClass } from './utils';

const removeCol = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE_COLUMNS);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.HorizontalRule, tooltip: 'Remove column' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    deleteLastCol(state, dispatch);
  },
  id: ToolbarItemsIds.TABLE_COLUMNS // TODO: nede to figure out what to do with mobile
});

const colsCount = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE_COLUMNS);
  },
  render: () => {
    const text = crelt('span', { class: `menu-item columns-count-text` });
    const container = crelt('div', { class: `menu-item columns-count` }, text);

    return container;
  },
  enable: () => false,
  updateDOM: (dom: HTMLElement, state: EditorState) => {
    if (!isInTable(state) || !dom.firstChild) return;
    (dom.firstChild as HTMLElement).innerText = `${selectedRect(state as any).table.firstChild?.childCount}` || '0';
  },
  run: () => {},
  id: ToolbarItemsIds.TABLE_COLUMNS
});

const addCol = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE_COLUMNS);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.Plus, tooltip: 'Add column' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    addRightColumn(state, dispatch, state.selection.from);
  },
  id: ToolbarItemsIds.TABLE_COLUMNS
});

export const columnsControlItems = [removeCol, colsCount, addCol];

const removeRow = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE_ROWS);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.HorizontalRule, tooltip: 'Remove row' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    deleteLastRow(state, dispatch);
  },
  id: ToolbarItemsIds.TABLE_ROWS
});

const rowsCount = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE_ROWS);
  },
  render: () => {
    const text = crelt('span', { class: `menu-item rows-count-text` });
    const container = crelt('div', { class: `menu-item rows-count` }, text);

    return container;
  },
  enable: () => false,
  updateDOM: (dom: HTMLElement, state: EditorState) => {
    if (!isInTable(state) || !dom.firstChild) return;
    (dom.firstChild as HTMLElement).innerText = `${selectedRect(state as any).table.childCount}` || '0';
  },
  run: () => {},
  id: ToolbarItemsIds.TABLE_ROWS
});

const addRow = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE_ROWS);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.Plus, tooltip: 'Add row' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    addBottomRow(state, dispatch, state.selection.from);
  },
  id: ToolbarItemsIds.TABLE_ROWS
});

export const rowsControlItems = [removeRow, rowsCount, addRow];

const createCellColorIcon = (color: string, labelContent: string) => {
  const icon = crelt('span', {
    class: `cell-background-color-item-icon`,
    style: `background: ${HIGHLIGHT_COLORS[color]}`
  });
  const container = crelt(
    'div',
    {
      class: `cell-background-color-item`,
      'data-test': 'cell-background-color-button'
    },
    icon
  );

  return container;
};

export const getCellsBackgroundColorItems = () =>
  Object.keys(HIGHLIGHT_COLORS).map(
    (color) =>
      new SkiffMenuItem({
        select: (state: EditorState) => {
          const toolbarType = getToolbarType(state);
          return itemsMap[toolbarType].includes(ToolbarItemsIds.CELL_BACKGROUND);
        },
        active: (state: EditorState) => isCellColorActive(state, HIGHLIGHT_COLORS[color]),
        render: () => createCellColorIcon(color, color),
        run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
          changeCellsBackgroundColor(state, dispatch, HIGHLIGHT_COLORS[color]);
        },
        id: ToolbarItemsIds.CELL_BACKGROUND
      })
  );

export const cellsBackgroundColorsItemDropdown = new AnimatedDropdown(getCellsBackgroundColorItems(), {
  label: '',
  class: 'cell-background-color-dropdown',
  dataTest: 'cell-background-color-dropdown'
});

export const toggleHeadersItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TOGGLE_TABLE_HEADERS);
  },
  active: (state: EditorState) => {
    const focusedTable = findParentNodeOfType(state.schema.nodes.table)(state.selection);
    return focusedTable?.node.attrs.headers;
  },
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.ToggleHeader,
      dataTest: 'toggle-headers',
      tooltip: 'Toggle header'
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    toggleTableHeaders(state, dispatch, view);
  },
  id: ToolbarItemsIds.TOGGLE_TABLE_HEADERS
});

export const deleteCellsItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const { selection: sel } = state;
    const toolbarType = getToolbarType(state);
    return (
      itemsMap[toolbarType].includes(ToolbarItemsIds.DELETE_CELLS) &&
      sel instanceof CellSelection &&
      (sel.isRowSelection() || sel.isColSelection())
    );
  },
  render: () => {
    const dom = createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Trash,
      dataTest: 'table-delete',
      tooltip: 'Delete'
    });
    dom.addEventListener('mouseenter', addDeleteHoverClass);
    dom.addEventListener('mouseleave', removeDeleteHoverClass);

    return dom;
  },
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    const command = getDeleteCommand(state);
    command(state, dispatch);
  },
  id: ToolbarItemsIds.DELETE_CELLS
});
