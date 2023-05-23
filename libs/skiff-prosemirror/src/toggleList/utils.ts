import { Node as ProsemirrorNode, Slice } from 'prosemirror-model';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';
import { StorageTypes } from 'skiff-utils';

import isListNode from '../isListNode';
import { PARAGRAPH, TOGGLE_ITEM_CONTENT, TOGGLE_ITEM_TITLE, TOGGLE_LIST, TOGGLE_LIST_ITEM } from '../NodeNames';
import uuid from '../ui/uuid';
import { getDocId, getDocNodeItem, setDocNodeItem } from '../utils/storageUtils';

/**
 * inserts the given node to the a toggle item without content
 * @param view
 * @param node
 * @param pos
 */
export const insertFirstToggleContent = (view: EditorView, node: ProsemirrorNode, pos: number) => {
  const { tr } = view.state;
  const newPos = pos + node.nodeSize - 1;
  tr.insert(newPos, view.state.schema.nodes[TOGGLE_ITEM_CONTENT].createAndFill({}));
  tr.setSelection(TextSelection.create(tr.doc, newPos + 2));
  view.dispatch(tr);
  view.focus();
};

/**
 *
 * @param schema
 * @param text
 * @returns toggle item with the given text or without text if not passed
 */
export const createToggleItemWithText = (schema: Schema, text?: string) => {
  const paragraph = schema.nodes[PARAGRAPH].createAndFill({}, text ? schema.text(text) : undefined);
  if (!paragraph) return null;

  const title = schema.nodes[TOGGLE_ITEM_TITLE].createAndFill({}, paragraph);
  if (!title) return null;

  const item = schema.nodes[TOGGLE_LIST_ITEM].createAndFill({ id: uuid() }, title);
  return item;
};

/**
 *
 * @param schema
 * @param paragraph
 * @returns toggle item with the passed paragraph as the title
 */
export const createToggleItemFromParagraph = (schema: Schema, paragraph: ProsemirrorNode<Schema>) => {
  if (!paragraph) return null;

  const title = schema.nodes[TOGGLE_ITEM_TITLE].createAndFill({}, paragraph);
  if (!title) return null;

  const item = schema.nodes[TOGGLE_LIST_ITEM].createAndFill({ id: uuid() }, title);
  return item;
};

/**
 *
 * @param originalList
 * @param schema
 * @returns parsing a list into toggle list, and return it as Slice
 */
export const parseListToToggleList = (originalList: ProsemirrorNode, schema: Schema): Slice | undefined => {
  const toggleItems: ProsemirrorNode[] = [];
  originalList.content.forEach((listItem: ProsemirrorNode) => {
    const newToggleItem = createToggleItemWithText(schema, listItem.textContent);
    if (newToggleItem) toggleItems.push(newToggleItem);
  });

  const newList = schema.nodes[TOGGLE_LIST].createAndFill({}, toggleItems);
  return newList?.slice(0);
};

/**
 *
 * @returns true if closed, false if open
 */
export const getToggleOpenState = (state: EditorState, nodeId: string): boolean => {
  const docID = getDocId(state);
  if (!docID) return true;

  return getDocNodeItem(docID, StorageTypes.TOGGLE_ITEM, nodeId, true);
};

export const setToggleItemOpenState = (state: EditorState, nodeId: string, forceAction?: 'open' | 'close') => {
  const docID = getDocId(state);
  if (!docID) return true;

  if (!forceAction) return setDocNodeItem(docID, StorageTypes.TOGGLE_ITEM, nodeId, !getToggleOpenState(state, nodeId));
  return setDocNodeItem(docID, StorageTypes.TOGGLE_ITEM, nodeId, forceAction === 'close' ? true : false);
};

/**
 * update toggle item localStorage state, can pass forceAction to decide the action, otherwise will just toggle the state
 * @param view
 * @param itemId
 * @param pos
 * @param forceAction
 */
export const openOrCloseToggleItem = (
  view: EditorView,
  itemId: string,
  pos: number,
  forceAction?: 'open' | 'close'
) => {
  const itemCoords = view.coordsAtPos(pos);
  const itemDOM = document.elementFromPoint(itemCoords.left, itemCoords.top)?.closest('.toggle-item');

  if (forceAction) {
    itemDOM?.classList.toggle('toggled', forceAction === 'close' ? true : false);
  } else {
    itemDOM?.classList.toggle('toggled', !getToggleOpenState(view.state, itemId));
  }
  setToggleItemOpenState(view.state, itemId);
};

interface IndexAndPos {
  index: number;
  pos: number;
}

/**
 *
 * @param state
 * @param itemId
 * @param pos
 * @returns toggle item index in the list and his position in the document
 */
export const getItemIndexAndPos = (state: EditorState, itemId: ProsemirrorNode, pos: number): IndexAndPos | null => {
  const toggleList = findParentNodeOfTypeClosestToPos(state.doc.resolve(pos), state.schema.nodes[TOGGLE_LIST]);
  if (!toggleList) return null;

  let result: IndexAndPos | null = null;

  toggleList.node.content.forEach((listItem, offset, index) => {
    if (listItem.attrs.id === itemId) {
      result = {
        pos: offset + toggleList.start,
        index
      };
    }
  });

  return result;
};

export const shouldDeleteContentOnShiftTab = (itemContent: ProsemirrorNode): boolean => {
  // have more than one child
  if (itemContent.childCount > 1) return false;

  if (!itemContent.firstChild) return false;

  // have list child with more than one list items
  if (isListNode(itemContent.firstChild) && itemContent.firstChild.childCount > 1) return false;

  return true;
};
