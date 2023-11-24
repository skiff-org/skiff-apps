/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Icon } from 'nightwatch-ui';
import { EditorState, Transaction } from 'prosemirror-state';

import {
  CODE,
  HR,
  IMAGE_INSERT,
  MATH_INSERT,
  OL,
  TABLE_INSERT_TABLE,
  TO_DO,
  TOGGLE_LIST_INSERT,
  UL
} from '../../EditorCommands';
import { getToolbarType } from '../utils';

import SkiffMenuItem from './customMenu/SkiffMenuItem';
import { itemsMap, ToolbarItemsIds } from './itemsMap';
import { createElementWithClassAndIcon, getSelectedImageDOM } from './utils';

export const codeItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.CODE);
  },
  active: (state: EditorState) => CODE.isActive(state),
  render: () =>
    createElementWithClassAndIcon({ type: 'div', iconName: Icon.CodeBlock, tooltip: 'Code', defaultColor: true }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    CODE.execute(state, dispatch);
  },
  id: ToolbarItemsIds.CODE
});

export const mathItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.MATH);
  },
  render: () =>
    createElementWithClassAndIcon({ type: 'div', iconName: Icon.Equation, tooltip: 'Equation', defaultColor: true }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    MATH_INSERT.execute(state, dispatch);
  },
  id: ToolbarItemsIds.MATH
});

export const bulletListItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.BULLET_LIST);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.BulletList, label: 'Bulleted List' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    UL.execute(state, dispatch);
  },
  id: ToolbarItemsIds.BULLET_LIST
});

export const orderedListItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.ORDERED_LIST);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.NumberList, label: 'Numbered List' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    OL.execute(state, dispatch);
  },
  id: ToolbarItemsIds.ORDERED_LIST
});

export const todoListItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TO_DO_LIST);
  },
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.Todo, label: 'Todo list' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    TO_DO.execute(state, dispatch);
  },
  id: ToolbarItemsIds.TO_DO_LIST
});

export const toggleListItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TOGGLE_LIST);
  },
  active: (state: EditorState) => TOGGLE_LIST_INSERT.isActive(state),
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.ToggleList, label: 'Toggle List' }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    TOGGLE_LIST_INSERT.execute(state, dispatch);
  },
  id: ToolbarItemsIds.TOGGLE_LIST
});

export const tableItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.TABLE);
  },
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Table,
      dataTest: 'insert-table',
      tooltip: 'Table',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    TABLE_INSERT_TABLE.execute(state, dispatch);
  },
  id: ToolbarItemsIds.TABLE
});

export const horizontalLineItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.HORIZONTAL_LINE);
  },
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.HorizontalRule,
      tooltip: 'Divider',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    HR.execute(state, dispatch);
  },
  id: ToolbarItemsIds.HORIZONTAL_LINE
});

export const imageItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.IMAGE);
  },
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Image,
      tooltip: 'Insert image',
      id: 'image-insert',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    IMAGE_INSERT.execute(state, dispatch);
  },
  id: ToolbarItemsIds.IMAGE
});

export const deleteImageItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.DELETE_IMAGE);
  },
  render: () => {
    const dom = createElementWithClassAndIcon({ type: 'div', iconName: Icon.Trash });
    dom.addEventListener('mouseenter', () => getSelectedImageDOM()?.classList.add('delete-image-hover'));
    dom.addEventListener('mouseleave', () => getSelectedImageDOM()?.classList.remove('delete-image-hover'));
    return dom;
  },
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    dispatch(state.tr.deleteSelection());
    return true;
  },
  id: ToolbarItemsIds.DELETE_IMAGE
});
