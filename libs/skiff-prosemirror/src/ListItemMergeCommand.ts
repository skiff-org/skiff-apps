import nullthrows from 'nullthrows';
import { Fragment, ResolvedPos, Schema } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { ReplaceAroundStep } from 'prosemirror-transform';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import nodeAt from './nodeAt';
import {
  BULLET_LIST,
  HEADING,
  LIST_ITEM,
  LIST_TASK_ITEM,
  ORDERED_LIST,
  PARAGRAPH,
  TOGGLE_ITEM_TITLE,
  TOGGLE_LIST_ITEM
} from './NodeNames';
import splitListItem from './splitListItem';
import UICommand from './ui/UICommand';

export function findCutBefore($pos: ResolvedPos) {
  // parent is non-isolating, so we can look across this boundary
  if (!$pos.parent.type.spec.isolating) {
    // search up the tree from the pos's *parent*
    for (let i = $pos.depth - 1; i >= 0; i--) {
      // starting from the inner most node's parent, find out
      // if we're not its first child
      if ($pos.index(i) > 0) {
        return $pos.doc.resolve($pos.before(i + 1));
      }
      if ($pos.node(i).type.spec.isolating) {
        break;
      }
    }
  }
  return null;
}

function mergeListItemUp(tr: Transaction, schema: Schema): Transaction {
  // This merge a list item to is previous list item of the selection is at the
  // beginning of the list item.
  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const liNodeType = schema.nodes[LIST_ITEM];
  const taskNodeType = schema.nodes[LIST_TASK_ITEM];
  const toggleTitleNodeType = schema.nodes[TOGGLE_ITEM_TITLE];
  const toggleListNodeType = schema.nodes[TOGGLE_LIST_ITEM];
  const paragraphNodeType = schema.nodes[PARAGRAPH];
  const bulletListNodeType = schema.nodes[BULLET_LIST];
  const orderListNodeType = schema.nodes[ORDERED_LIST];

  if (!liNodeType && !taskNodeType) {
    return tr;
  }

  const { from, empty } = selection;

  if (!empty) {
    // Selection is collapsed.
    return tr;
  }

  const liParent = findParentNodeOfType(liNodeType)(selection);
  const result =
    liParent || findParentNodeOfType(taskNodeType)(selection) || findParentNodeOfType(toggleTitleNodeType)(selection);

  const $cut = findCutBefore(selection.$from);

  if (
    selection.$anchor.parentOffset === 0 && // only in case selection is on the start of the node
    $cut &&
    $cut.nodeBefore &&
    $cut.nodeAfter &&
    [bulletListNodeType, orderListNodeType].includes($cut.nodeBefore.type)
  ) {
    // find the nearest paragraph that precedes this node
    let $lastNode = $cut.doc.resolve($cut.pos - 1);

    while ($lastNode.parent.type !== paragraphNodeType) {
      $lastNode = tr.doc.resolve($lastNode.pos - 1);
    }

    // take the text content of the paragraph and insert after the paragraph up until before the the cut
    tr = tr.step(
      new ReplaceAroundStep(
        $lastNode.pos,
        $cut.pos + $cut.nodeAfter.nodeSize,
        $cut.pos + 1,
        $cut.pos + $cut.nodeAfter.nodeSize - 1,
        tr.doc.slice($lastNode.pos, $cut.pos),
        0,
        true
      )
    );

    // find out if there's now another list following and join them
    // as in, [list, p, list] => [list with p, list], and we want [joined list]
    const $postCut = tr.doc.resolve(tr.mapping.map($cut.pos + $cut.nodeAfter.nodeSize));

    if (
      $postCut.nodeBefore &&
      $postCut.nodeAfter &&
      $postCut.nodeBefore.type === $postCut.nodeAfter.type &&
      [bulletListNodeType, orderListNodeType].indexOf($postCut.nodeBefore.type) > -1 &&
      // Only merge if both lists are at the same indent
      $postCut.nodeAfter.attrs?.indent === $postCut.nodeBefore.attrs?.indent
    ) {
      tr = tr.join($postCut.pos);
    }
    return tr;
  }
  if (!result) {
    return tr;
  }

  const nodeType = result.node.type;

  const { pos, node } = result;

  if (liParent && !liParent.node.textContent.length && !liParent.node.nodeAt(0)?.content.size) {
    // In case list item is empty split the list
    const nodeAfter = tr.doc.nodeAt(pos + liParent.node.nodeSize);
    if (nodeAfter && nodeAfter.type.name === 'list_item') {
      tr = splitListItem(tr, schema);
    } else {
      // In case this is the last bullet remove it
      tr = tr.delete(pos - 1, pos + node.nodeSize + 1);
    }
    return tr;
  }

  if (from !== pos + 2) {
    // Selection is not at the begining of the list item.
    return tr;
  }

  if (nodeType === toggleTitleNodeType) {
    const toggleItemPos = findParentNodeOfType(toggleListNodeType)(selection)?.pos;
    if (!toggleItemPos) return tr;

    const $togglePos = tr.doc.resolve(toggleItemPos);
    const prevToggleItemNode = $togglePos.nodeBefore;
    if (!prevToggleItemNode || prevToggleItemNode.type !== toggleListNodeType) {
      return tr;
    }
    // If inside an empty toggle title, just delete the toggle
    if (nodeType === toggleTitleNodeType && node.content.firstChild?.content.size === 0) {
      tr = tr.delete(pos - 2, pos + node.nodeSize);
      tr = tr.setSelection(TextSelection.create(tr.doc, pos - 4, pos - 4));
      return tr;
    }
  }

  const $pos = tr.doc.resolve(pos);
  const prevNode = $pos.nodeBefore;

  if (!prevNode || prevNode.type !== nodeType) {
    return tr;
  }

  if (node.childCount !== 1) {
    // list item should only have one child (paragraph).
    return tr;
  }

  const paragraphNode = node.firstChild;

  const textNode = schema.text(' ');
  // Delete the list item
  tr = tr.delete(pos - 2, pos + node.nodeSize);
  // Append extra space character to its previous list item.
  tr = tr.insert(pos - 2, Fragment.from(textNode));
  // Move the content to its previous list item.
  tr = tr.insert(pos - 1, Fragment.from(paragraphNode?.content));
  tr = tr.setSelection(TextSelection.create(tr.doc, pos - 1, pos - 1));
  return tr;
}

function mergeListItemDown(tr: Transaction, schema: Schema, view: EditorView): Transaction {
  // This merge a list item to is next list item of the selection is at the
  // end of the list item.
  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const liNodeType = schema.nodes[LIST_ITEM];
  const taskNodeType = schema.nodes[LIST_TASK_ITEM];
  const toggleTitleNodeType = schema.nodes[TOGGLE_ITEM_TITLE];

  if (!liNodeType && !taskNodeType && !toggleTitleNodeType) {
    return tr;
  }

  const { from, empty } = selection;

  if (!empty) {
    // Selection is collapsed.
    return tr;
  }

  const result = findParentNodeOfType(liNodeType)(selection) || findParentNodeOfType(taskNodeType)(selection);
  if (!result) {
    return tr;
  }

  const nodeType = result.node.type;
  const { pos, node } = result;

  if (from !== pos + node.content.size) {
    // Selection is not at the end of the list item.
    return tr;
  }

  const $pos = tr.doc.resolve(pos);
  const list = $pos.parent.type;
  const listResult = findParentNodeOfType(list)(selection);

  if (!listResult) {
    return tr;
  }

  const nextFrom = pos + node.nodeSize;
  let nextNode = nodeAt(tr.doc, nextFrom);
  let deleteFrom = nextFrom;

  if (listResult.start + listResult.node.content.size === nextFrom) {
    // It's at the end of the last list item. It shall bring the content of the
    // block after the list.
    nextNode = nodeAt(tr.doc, nextFrom + 1);
    deleteFrom += 1;
  }

  if (!nextNode) {
    return tr;
  }

  let nextContent;

  switch (nextNode.type) {
    case nodeType:
      // List item should only have one child (paragraph).
      const paragraphNode = nullthrows(nextNode.firstChild);
      nextContent = Fragment.from(paragraphNode.content);
      break;

    case schema.nodes[HEADING]:
    case schema.nodes[PARAGRAPH]:
      // Will bring in the content of the next block.
      nextContent = Fragment.from(nextNode.content);
      break;
  }

  if (!nextContent) {
    return tr;
  }

  const textNode = schema.text(' ');
  // Delete the next node.
  tr = tr.delete(deleteFrom, deleteFrom + nextNode.nodeSize);
  // Append extra space character to its previous list item.
  tr = tr.insert(nextFrom - 2, Fragment.from(textNode));
  // Move the content to the list item.
  tr = tr.insert(nextFrom - 2, nextContent);
  tr = tr.setSelection(TextSelection.create(tr.doc, nextFrom - 2, nextFrom - 2));
  return tr;
}

class ListItemMergeCommand extends UICommand {
  _direction = '';

  constructor(direction: string) {
    super();
    this._direction = direction;
  }

  isActive = (state: EditorState): boolean => false;

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { selection, schema } = state;
    let { tr } = state;
    const direction = this._direction;

    if (direction === 'down') {
      tr = mergeListItemDown(tr.setSelection(selection), schema, view as EditorView);
    } else if (direction === 'up') {
      tr = mergeListItemUp(tr.setSelection(selection), schema);
    }

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

export default ListItemMergeCommand;
