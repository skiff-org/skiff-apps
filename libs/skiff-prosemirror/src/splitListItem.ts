import { Fragment, Mark, Schema } from 'prosemirror-model';
import { NodeSelection, TextSelection, Transaction } from 'prosemirror-state';
import { canSplit } from 'prosemirror-transform';
import { findParentNodeOfType } from 'prosemirror-utils';

import applyMark from './applyMark';
import { MARK_CODE, MARK_COMMENT, MARK_LINK } from './MarkNames'; // Splits a list item by the current cursor's position.
import { BULLET_LIST, LIST_ITEM, LIST_TASK_ITEM, ORDERED_LIST, PARAGRAPH, TODO_LIST } from './NodeNames';
import { ATTRIBUTE_CHECKED } from './TaskItemNodeSpec';
import uuid from './ui/uuid';
// Some examples:
//
// - split before item's text:
//   - before:
//     1. <cursor>AA
//     2. BB
//     3. CC
//   - after:
//     1. <cursor>
//     2. AA
//     3. BB
//     4. CC
//
// - split between item's text:
//   - before:
//     1. AA
//     2. B<cursor>B
//     3. CC
//   - after:
//     1. AA
//     2. B
//     3. B
//     4. CC
//
// - split after item's text:
//   - before:
//     1. AA
//     2. BB<cursor>
//     3. CC
//   - after:
//     1. AA
//     2. BB
//     3. <cursor>
//     4. CC
//
// - split at item with empty content:
//   - before:
//     1. AA
//     2. <cursor>
//     3. CC
//   - after:
//     1. AA
//     <cursor>
//     2. BB
//     3. CC
//

// the marks we dont want to pass the next list item
const unwantedListMarks = [MARK_CODE];

export default function splitListItem(tr: Transaction, schema: Schema): Transaction {
  const list = tr.doc.resolve(tr.selection.from).node(-2);
  const listType = list ? list.type.name : null;

  const nodeType = listType === TODO_LIST ? schema.nodes[LIST_TASK_ITEM] : schema.nodes[LIST_ITEM];

  if (!nodeType) {
    return tr;
  }

  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const { $from, $to } = selection;
  const node = selection instanceof NodeSelection ? selection.node : undefined;

  if (node?.isBlock || $from.depth < 2 || !$from.sameParent($to)) {
    return tr;
  }

  const grandParent = $from.node(-1);

  if (grandParent.type !== nodeType) {
    return tr;
  }

  if ($from.parent.content.size === 0) {
    // In an empty list item.
    return splitEmptyListItem(tr, schema);
  }

  const paragraphNode = grandParent.lastChild;
  let contentMarks: Mark[] = [];

  if (paragraphNode) {
    const textContent = paragraphNode.lastChild;

    if (textContent) {
      contentMarks = textContent.marks.filter((mark) => !unwantedListMarks.includes(mark.type.name));
    }
  }

  const nextType = $to.pos === $from.end() ? grandParent.contentMatchAt($from.indexAfter(-1)).defaultType : null;
  tr = tr.delete($from.pos, $to.pos);
  const types = nextType
    ? [
        undefined,
        {
          type: nextType
        }
      ]
    : undefined;
  if (!canSplit(tr.doc, $from.pos, 2, types)) {
    return tr;
  }

  // Incorrect pm type. Types element can be undefined
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  tr = tr.split($from.pos, 2, types);

  const STEPS_TO_NEW_TASK_ITEM = 2;

  if (listType === TODO_LIST) {
    tr.setNodeMarkup($from.pos + STEPS_TO_NEW_TASK_ITEM, undefined, {
      [ATTRIBUTE_CHECKED]: false
    });
  }

  if (contentMarks.length > 0) {
    contentMarks.forEach((mark) => {
      if (mark.type !== schema.marks[MARK_COMMENT] || mark.type !== schema.marks[MARK_LINK]) {
        tr = applyMark(tr, schema, mark.type, mark.attrs);
      }
    });
  }
  tr.removeStoredMark(schema.marks[MARK_COMMENT]).removeStoredMark(schema.marks[MARK_LINK]);
  return tr;
} // Splits an item with empty content:
//   - before:
//     1. AA
//     2. <cursor>
//     3. CC
//   - after:
//     1. AA
//     <cursor>
//     2. BB
//     3. CC

function splitEmptyListItem(tr: Transaction, schema: Schema): Transaction {
  const listItemType = schema.nodes[LIST_ITEM];
  const orderedListType = schema.nodes[ORDERED_LIST];
  const bulletListType = schema.nodes[BULLET_LIST];
  const paragraphType = schema.nodes[PARAGRAPH];

  if (!listItemType || !paragraphType) {
    // Schema does not support the nodes expected.
    return tr;
  }

  const listItemFound = findParentNodeOfType(listItemType)(tr.selection);

  if (!listItemFound || listItemFound.node.textContent !== '') {
    // Cursor is not inside an empty list item.
    return tr;
  }

  const listFound =
    (orderedListType && findParentNodeOfType(orderedListType)(tr.selection)) ||
    (bulletListType && findParentNodeOfType(bulletListType)(tr.selection));

  if (!listFound) {
    // Cursor isn't inside an list.
    return tr;
  }

  const $listItemPos = tr.doc.resolve(listItemFound.pos);
  const listItemIndex = $listItemPos.index($listItemPos.depth);
  const listFoundNode = listFound.node;

  if (listFoundNode.childCount < 3 || listItemIndex < 1 || listItemIndex >= listFoundNode.childCount - 1) {
    // - The list must have at least three list items
    // - The cursor must be after the first list item and before the last list
    //   item.
    // If both conditions don't match, bails out, which will remove the empty
    // item.
    return tr;
  }

  // Find the name of the current list to split. If the name isn't available,
  // assigns a new name.
  let { name } = listFoundNode.attrs;

  if (!name) {
    name = uuid();
    tr = tr.setNodeMarkup(
      listFound.pos,
      listFoundNode.type,
      {
        ...listFoundNode.attrs,
        name
      },
      listFoundNode.marks
    );
  }

  // We'll split the list into two lists.
  // the first list contains the items before the cursor, and the second
  // list contains the items after the cursor and the second list will "follow"
  // the first list by sharing the same counter variable.
  const sliceFrom = listItemFound.pos + listItemFound.node.nodeSize;
  const sliceTo = listFound.pos + listFound.node.nodeSize - 1;
  const slicedItems = tr.doc.slice(sliceFrom, sliceTo);
  const deleteFrom = listItemFound.pos;
  const deleteTo = listFound.pos + listFound.node.nodeSize;
  tr = tr.delete(deleteFrom, deleteTo);
  const sourceListNode = listFound.node;
  const listAttrs = { ...sourceListNode.attrs };

  if (orderedListType === sourceListNode.type) {
    listAttrs.counterReset = 'none';
    listAttrs.following = name;
  }

  const insertFrom = deleteFrom + 1;
  const listNode = sourceListNode.type.create(listAttrs, slicedItems.content);
  tr = tr.insert(insertFrom, listNode);
  const paragraph = paragraphType.create({}, Fragment.empty);
  tr = tr.insert(insertFrom, paragraph);
  // add 1 again to put the selection at the new text node as opposed to old bullet
  tr = tr.setSelection(TextSelection.create(tr.doc, insertFrom + 1));
  return tr;
}
