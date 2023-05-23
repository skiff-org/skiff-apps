import { EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeOfType, findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import isListNode from '../isListNode';
import nodeAt from '../nodeAt';
import { PARAGRAPH, TOGGLE_ITEM_CONTENT, TOGGLE_ITEM_TITLE, TOGGLE_LIST, TOGGLE_LIST_ITEM } from '../NodeNames';
import UICommand from '../ui/UICommand';

import {
  getItemIndexAndPos,
  getToggleOpenState,
  openOrCloseToggleItem,
  parseListToToggleList,
  setToggleItemOpenState,
  shouldDeleteContentOnShiftTab
} from './utils';

export const splitToggleItemOrEnterContent =
  (forceEnterContent: boolean) =>
  (
    state: EditorState,
    dispatch: ((tr: Transaction<any>) => void) | undefined,
    view: EditorView | undefined | null
  ): boolean => {
    const parentToggleListTitle = findParentNodeOfType(state.schema.nodes[TOGGLE_ITEM_TITLE])(state.selection);
    const parentToggleListItem = findParentNodeOfType(state.schema.nodes[TOGGLE_LIST_ITEM])(state.selection);

    if (!parentToggleListTitle || !parentToggleListItem || !dispatch || !view) return false;

    const itemCoords = view.coordsAtPos(parentToggleListItem.pos);
    const itemDOM = document.elementFromPoint(itemCoords.left, itemCoords.top)?.closest('.toggle-item');

    const { $from, from } = state.selection;
    const splitTitle = $from.parentOffset !== parentToggleListTitle.node.nodeSize - 4;
    const cutText = splitTitle
      ? parentToggleListTitle.node.slice($from.parentOffset + 1).content.firstChild?.textContent
      : undefined;

    const toggleNodeId = parentToggleListItem.node.attrs.id;

    let itemClosed = getToggleOpenState(state, toggleNodeId);

    // if the item is closed - open it
    if (forceEnterContent && itemClosed) {
      itemDOM?.classList.toggle('toggled', false);
      setToggleItemOpenState(state, toggleNodeId);
      itemClosed = false;
    }

    // If closed (default) add new toggle item
    if (itemClosed) {
      const newPos = parentToggleListItem.pos + parentToggleListItem.node.nodeSize;
      const { tr } = state;
      if (splitTitle) {
        const cutTextSize = cutText ? cutText.length : 0;
        tr.delete(from, from + cutTextSize);
        tr.insert(
          newPos - cutTextSize,
          state.schema.nodes[TOGGLE_LIST_ITEM].createAndFill(
            {},
            state.schema.nodes[TOGGLE_ITEM_TITLE].createAndFill(
              {},
              state.schema.nodes[PARAGRAPH].createAndFill({}, state.schema.text(cutText))
            )
          )
        );
        tr.setSelection(Selection.near(tr.doc.resolve(newPos - cutTextSize)));
      } else {
        tr.insert(newPos, state.schema.nodes[TOGGLE_LIST_ITEM].createAndFill({}));
        tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
      }

      dispatch(tr);
    } else {
      const { tr } = state;
      let insertPos, newNode;

      if (parentToggleListItem.node.childCount > 1) {
        insertPos = parentToggleListTitle.pos + parentToggleListTitle.node.nodeSize + 1;
        newNode = state.schema.nodes[PARAGRAPH].createAndFill({}, splitTitle ? state.schema.text(cutText) : undefined);
      } else {
        insertPos = parentToggleListTitle.pos + parentToggleListTitle.node.nodeSize;
        newNode = state.schema.nodes[TOGGLE_ITEM_CONTENT].createAndFill(
          {},
          splitTitle ? state.schema.nodes[PARAGRAPH].createAndFill({}, state.schema.text(cutText)) : undefined
        );
      }

      if (splitTitle) {
        const cutTextSize = cutText ? cutText.length : 0;
        tr.delete(from, from + cutTextSize);
        tr.insert(insertPos - cutTextSize, newNode);
        tr.setSelection(Selection.near(tr.doc.resolve(insertPos - cutTextSize)));
      } else {
        tr.insert(insertPos, newNode);
        tr.setSelection(Selection.near(tr.doc.resolve(insertPos)));
      }

      dispatch(tr);
    }
    return true;
  };

const getListItemAndTitle = (state: EditorState) => {
  const toggleTitle = findParentNodeOfType(state.schema.nodes[TOGGLE_ITEM_TITLE])(state.selection);
  const toggleItem = findParentNodeOfType(state.schema.nodes[TOGGLE_LIST_ITEM])(state.selection);
  const toggleList = findParentNodeOfType(state.schema.nodes[TOGGLE_LIST])(state.selection);

  return { toggleTitle, toggleItem, toggleList };
};

export const liftToggleItemDown = (
  state: EditorState,
  dispatch: ((tr: Transaction<any>) => void) | undefined,
  view: EditorView | undefined | null
) => {
  const { toggleTitle, toggleItem, toggleList } = getListItemAndTitle(state);
  if (!toggleItem || !toggleTitle || !toggleList || !view) return false;

  const { $from } = state.selection;
  const atEndOfTitle = $from.parentOffset === toggleTitle.node.nodeSize - 4;
  const isLastItemInList =
    toggleList.start + toggleList.node.nodeSize === toggleItem.pos + toggleItem.node.nodeSize + 2;

  if (!atEndOfTitle) return false;

  const itemClosed = getToggleOpenState(state, toggleItem.node.attrs.id);

  let nextNodePos, nextNode;

  if (itemClosed || toggleItem.node.childCount === 1) {
    nextNodePos = toggleItem.start + toggleItem.node.nodeSize + (isLastItemInList ? 0 : -1);
    nextNode = nodeAt(state.doc, nextNodePos);
  } else {
    nextNodePos = toggleTitle.pos + toggleTitle.node.nodeSize;
    nextNode = toggleItem.node.maybeChild(1)?.firstChild;
  }
  if (!nextNode) return false;

  const { tr } = state;

  // next node is text block -  dont matters if closed or open
  if (nextNode.isTextblock) {
    tr.delete(nextNodePos, nextNodePos + nextNode.nodeSize);
    tr.insertText(nextNode.textContent, state.selection.to);
  } else if (isLastItemInList && itemClosed) {
    // closed and last
    if (isListNode(nextNode) && nextNode.type.name !== TOGGLE_LIST) {
      // next item is of list type
      const parsedListItems = parseListToToggleList(nextNode, state.schema);
      if (!parsedListItems) return false;
      tr.delete(nextNodePos, nextNodePos + nextNode.nodeSize);
      tr.replace(nextNodePos - 1, undefined, parsedListItems);
    } else {
      return false; // last item && closed && nextNode is not textBlock && nextNode is not list
    }
  }
  if (dispatch) dispatch(tr);

  return true;
};

const indentTextBlock = (
  state: EditorState,
  dispatch: ((tr: Transaction<any>) => void) | undefined,
  view: EditorView | undefined | null
): boolean => {
  const { from, $from } = state.selection;
  const parentNode = $from.parent;

  const prevNodePos = from - $from.parentOffset - 2;

  const aboveToggleList = findParentNodeOfTypeClosestToPos(
    state.doc.resolve(prevNodePos - 1),
    state.schema.nodes[TOGGLE_LIST]
  );

  const lastToggleItem = findParentNodeOfTypeClosestToPos(
    state.doc.resolve(prevNodePos - 1),
    state.schema.nodes[TOGGLE_LIST_ITEM]
  );

  if (!parentNode.isTextblock || !lastToggleItem || !view || aboveToggleList?.depth !== $from.depth) return false;

  const { tr } = state;
  tr.delete(prevNodePos + 1, prevNodePos + 1 + parentNode.nodeSize);

  let insertNode = parentNode;
  let insertPos = lastToggleItem.pos + lastToggleItem.node.nodeSize - 2;

  // toggle item dont have content
  if (lastToggleItem.node.childCount === 1) {
    insertNode = state.schema.nodes[TOGGLE_ITEM_CONTENT].createAndFill({}, parentNode);
    insertPos = lastToggleItem.pos + lastToggleItem.node.nodeSize - 1;
  }

  tr.insert(insertPos, insertNode);
  tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
  openOrCloseToggleItem(view, lastToggleItem.node.attrs.id, lastToggleItem.pos, 'open');

  if (dispatch) dispatch(tr);
  return true;
};

const indentToggleItemMore = (
  state: EditorState,
  dispatch: ((tr: Transaction<any>) => void) | undefined,
  view: EditorView | undefined | null
): boolean => {
  const { toggleTitle, toggleItem, toggleList } = getListItemAndTitle(state);

  if (!toggleList || !toggleItem || !toggleTitle || !view) return indentTextBlock(state, dispatch, view);

  let insertToPrevList = false;

  // if its the first item in the list it cant be indented, so look for another toggle list above him
  if (toggleItem.node.attrs.id === toggleList.node.firstChild?.attrs.id) {
    // if first child look for ul above at the same depth
    const prevToggleList = findParentNodeOfTypeClosestToPos(
      state.doc.resolve(toggleItem.pos - 3),
      state.schema.nodes[TOGGLE_LIST]
    );
    // if didn't find a list above to indent in - don't do anything
    if (!prevToggleList || prevToggleList.depth !== toggleList.depth) return true;

    insertToPrevList = true;
  }

  const { tr } = state;
  const prevItem = findParentNodeOfTypeClosestToPos(
    tr.doc.resolve(toggleItem.pos - (insertToPrevList ? 5 : 2)),
    state.schema.nodes[TOGGLE_LIST_ITEM]
  );
  if (!prevItem) return false;

  // remove the old item
  if (toggleList.node.childCount === 1) {
    tr.delete(toggleList.pos, toggleList.start + toggleList.node.nodeSize);
  } else {
    tr.delete(toggleItem.pos, toggleItem.start + toggleItem.node.nodeSize);
  }

  let insertPos, insertNode;
  // add content to prevItem if needed
  if (prevItem.node.childCount === 1) {
    insertPos = prevItem.pos + prevItem.node.nodeSize - 1;
    insertNode = state.schema.nodes[TOGGLE_ITEM_CONTENT].createAndFill(
      {},
      state.schema.nodes[TOGGLE_LIST].createAndFill({}, toggleItem.node)
    );
  } else {
    insertPos = prevItem.pos + prevItem.node.nodeSize - 2;
    insertNode = state.schema.nodes[TOGGLE_LIST].createAndFill({}, toggleItem.node);
  }

  tr.insert(insertPos, insertNode);
  tr.setSelection(TextSelection.create(tr.doc, insertPos + 4));
  openOrCloseToggleItem(view, prevItem.node.attrs.id, prevItem.pos, 'open');
  if (dispatch) dispatch(tr);
  return true;
};

const indentToggleItemLess = (
  state: EditorState,
  dispatch: ((tr: Transaction<any>) => void) | undefined,
  view: EditorView | undefined | null
): boolean => {
  const { toggleTitle, toggleItem, toggleList } = getListItemAndTitle(state);
  const paragraphItem = findParentNodeOfType(state.schema.nodes[PARAGRAPH])(state.selection);
  if (!((toggleList && toggleItem && toggleTitle) || paragraphItem) || !view) return false;

  const surroundingToggleContent = findParentNodeOfType(state.schema.nodes[TOGGLE_ITEM_CONTENT])(state.selection);
  // check if the item is nested inside different toggle item
  if (!surroundingToggleContent) return false;

  const surroundingToggleItem = findParentNodeOfTypeClosestToPos(
    state.doc.resolve(surroundingToggleContent.pos),
    state.schema.nodes[TOGGLE_LIST_ITEM]
  );

  if (!surroundingToggleItem) {
    return false;
  }

  const surroundingItemIndexAndPos = getItemIndexAndPos(
    state,
    surroundingToggleItem.node.attrs.id,
    surroundingToggleItem.pos
  );
  if (!surroundingItemIndexAndPos) return false;

  const { tr } = state;

  if (!(toggleItem && toggleList && toggleTitle)) {
    if (!paragraphItem) return false;

    // paragraph inside content
    const insertLocation = surroundingItemIndexAndPos.pos + surroundingToggleItem.node.nodeSize;
    const surroundingToggleList = findParentNodeOfType(state.schema.nodes[TOGGLE_LIST])(state.selection);
    if (!surroundingToggleList) return false;

    const parentListEnding = surroundingToggleList.pos + surroundingToggleList.node.nodeSize;
    if (insertLocation === parentListEnding - 1) tr.insert(insertLocation + 1, paragraphItem.node);
    else tr.insert(insertLocation, paragraphItem.node);

    if (shouldDeleteContentOnShiftTab(surroundingToggleContent.node)) {
      tr.delete(surroundingToggleContent.pos, surroundingToggleContent.start + surroundingToggleContent.node.nodeSize);
      openOrCloseToggleItem(view, surroundingToggleItem.node.attrs.id, surroundingToggleItem.pos, 'close');
    } else tr.delete(paragraphItem.pos, paragraphItem.start + paragraphItem.node.nodeSize);

    if (dispatch) dispatch(tr);
    return true;
  }

  tr.insert(surroundingItemIndexAndPos.pos + surroundingToggleItem.node.nodeSize, toggleItem.node);

  // if the indented item is single child delete the whole content
  if (shouldDeleteContentOnShiftTab(surroundingToggleContent.node)) {
    tr.delete(surroundingToggleContent.pos, surroundingToggleContent.start + surroundingToggleContent.node.nodeSize);
    openOrCloseToggleItem(view, surroundingToggleItem.node.attrs.id, surroundingToggleItem.pos, 'close');
  } else {
    // remove the old item
    if (toggleList.node.childCount === 1) {
      tr.delete(toggleList.pos, toggleList.start + toggleList.node.nodeSize);
    } else {
      tr.delete(toggleItem.pos, toggleItem.start + toggleItem.node.nodeSize);
    }
  }

  if (dispatch) dispatch(tr);
  return true;
};
class ToggleItemLiftCommand extends UICommand {
  _direction: 'up' | 'down';

  constructor(direction: 'up' | 'down') {
    super();
    this._direction = direction;
  }

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    if (this._direction === 'down') {
      return liftToggleItemDown(state, dispatch, view);
    }

    return false;
  };
}

export class IndentToggleItem extends UICommand {
  _direction: 'left' | 'right';

  constructor(direction: 'left' | 'right') {
    super();
    this._direction = direction;
  }

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    if (this._direction === 'right') {
      return indentToggleItemMore(state, dispatch, view);
    } else {
      return indentToggleItemLess(state, dispatch, view);
    }
  };
}

export default ToggleItemLiftCommand;
