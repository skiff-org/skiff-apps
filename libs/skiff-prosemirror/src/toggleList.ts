/* eslint-disable @typescript-eslint/no-unused-expressions */
import nullthrows from 'nullthrows';
import { Fragment, Node, NodeType, Schema } from 'prosemirror-model';
import { TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeOfType, NodeWithPos } from 'prosemirror-utils';

import compareNumber from './compareNumber';
import consolidateListNodes from './consolidateListNodes';
import isListNode from './isListNode';
import { parseTodoList, parseToggleLIst } from './listsParser';
import {
  HEADING,
  LIST_ITEM,
  LIST_TASK_ITEM,
  PARAGRAPH,
  TABLE,
  TODO_LIST,
  TOGGLE_ITEM_TITLE,
  TOGGLE_LIST,
  TOGGLE_LIST_ITEM
} from './NodeNames';
import { createToggleItemWithText } from './toggleList/utils';
import type { SelectionMemo } from './transformAndPreserveTextSelection';
import transformAndPreserveTextSelection from './transformAndPreserveTextSelection';

const shouldUnToggleList = (listType: NodeType, selection: TextSelection, schema: Schema) => {
  if (listType.name === TOGGLE_LIST) {
    return findParentNodeOfType(schema.nodes[TOGGLE_ITEM_TITLE])(selection);
  }

  const inList = findParentNodeOfType(listType)(selection);
  return inList;
};

const TOGGLE_LIST_TO_TOGGLE_CONTENT_DEPTH_DIFF = 3;

export const keepDrillingInToggleList = (
  nodeType: NodeType,
  selection: TextSelection,
  schema: Schema,
  doc: Node,
  pos: number
) => {
  const nodeDepth = doc.resolve(pos).depth;

  const maybeToggleTitle = findParentNodeOfType(schema.nodes[TOGGLE_ITEM_TITLE])(selection);
  if (!maybeToggleTitle) return nodeType.name === TOGGLE_LIST;

  return nodeDepth < maybeToggleTitle?.depth - TOGGLE_LIST_TO_TOGGLE_CONTENT_DEPTH_DIFF;
};

export default function toggleList(tr: Transaction, schema: Schema, listNodeType: NodeType): Transaction {
  const { selection, doc } = tr;

  if (!selection || !doc) {
    return tr;
  }

  // [FS][04-AUG-2020][IRAD-955]
  // Fix Unable to apply list using Ctrl+A selection
  let { from, to } = selection;
  let newselection: TextSelection | null = null;
  if (from === 0) {
    from = 1;
    newselection = TextSelection.create(doc, from, to);
    tr = tr.setSelection(newselection);
  }

  const fromSelection = TextSelection.create(doc, from, from);
  const paragraphNodeType = schema.nodes[PARAGRAPH];
  const headingNodeType = schema.nodes[HEADING];
  const tableNodeType = schema.nodes[TABLE];
  const inParagraph = findParentNodeOfType(paragraphNodeType)(fromSelection);
  const inHeading = findParentNodeOfType(headingNodeType)(fromSelection);
  const inTable = findParentNodeOfType(tableNodeType)(fromSelection);

  const inList = findParentNodeOfType(listNodeType)(fromSelection);

  const unToggleList = shouldUnToggleList(listNodeType, fromSelection, schema);

  const nodeBefore = inTable ? doc.resolve(inTable.pos).nodeBefore : null;
  // first we check if we need to wrap the selection in a list or unwrap
  if (unToggleList && inList) {
    tr = unwrapNodesFromList(tr, schema, inList.pos);
  } else if ((paragraphNodeType && inParagraph) || (headingNodeType && inHeading)) {
    if (inHeading) {
      to -= 1;
      tr = tr.setSelection(TextSelection.create(doc, from, to));
    }
    tr = wrapNodesWithList(tr, schema, listNodeType, newselection);
  }
  // Then we check if we need to change the selection
  if (headingNodeType && inHeading && !inTable && inList) {
    // if the command is executed in a heading the newselection variable would place the cursor on the very end of the inserted list node, causing a bug
    // in this case we need to place the selection 3 positions behind, which will be the in the textNode of a list item
    tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(from) + 3, tr.mapping.map(to) - 3));
  } else if (tableNodeType && inTable && nodeBefore?.type.name === headingNodeType.name && !inHeading) {
    // similarly to the part before, if the list command is triggered in a table that is directly after a heading,
    // the cursor placement would be off and it would cause a bug, jumping the cursor to the start of the doc
    tr.setSelection(TextSelection.create(doc, tr.mapping.map(from) - 1, tr.mapping.map(to) - 1));
  } else if (tableNodeType && inTable && nodeBefore?.type.name !== headingNodeType.name) {
    // similarly to the part before, if the list command is triggered in a table that doesnt have a heading before it,
    // the cursor placement would be off and it would cause a bug, jumping the cursor to the start of the doc
    tr.setSelection(TextSelection.create(doc, tr.mapping.map(from) - 3, tr.mapping.map(to) - 3));
  }
  return tr;
}

export function unwrapNodesFromList(
  tr: Transaction,
  schema: Schema,
  listNodePos: number,
  unwrapParagraphNode?: (arg0: Node) => Node
): Transaction {
  return transformAndPreserveTextSelection(tr, schema, (memo) =>
    consolidateListNodes(unwrapNodesFromListInternal(memo, listNodePos, unwrapParagraphNode))
  );
}

export function wrapNodesWithList(
  tr: Transaction,
  schema: Schema,
  listNodeType: NodeType,
  newselection: TextSelection | null = null
): Transaction {
  return transformAndPreserveTextSelection(tr, schema, (memo) =>
    // [FS][04-AUG-2020][IRAD-955]
    // Fix Unable to apply list using Ctrl+A selection
    consolidateListNodes(wrapNodesWithListInternal(memo, listNodeType, newselection))
  );
}

function wrapNodesWithListInternal(
  memo: SelectionMemo,
  listNodeType: NodeType,
  newselection: TextSelection | null = null
): Transaction {
  const { schema } = memo;
  let { tr } = memo;
  const { doc, selection } = tr;
  let { from, to } = selection;

  if (!tr || !selection) {
    return tr;
  }

  if (newselection) {
    from = newselection.from;
    to = newselection.to;
  }

  const paragraph = schema.nodes[PARAGRAPH];
  const heading = schema.nodes[HEADING];

  let items: NodeWithPos[] = [];
  let lists: NodeWithPos[][] = [];

  const singleNodeHandler = (node: Node, pos: number) => {
    const nodeType = node.type;
    const nodeName = nodeType.name;

    if (isListNode(node)) {
      // if the node is toggle list drill down to its content and dont try to replace it
      if (keepDrillingInToggleList(nodeType, selection, schema, memo.tr.doc, pos)) return true;

      if (node.type !== listNodeType) {
        const listNodeAttrs = {
          ...node.attrs,
          listNodeType: null
        };

        // replace from/to toggle list
        if (nodeName === TOGGLE_LIST || listNodeType.name === TOGGLE_LIST) {
          parseToggleLIst(tr, listNodeType, pos, node);
          return false;
        }

        // replace from/to todo list
        if (nodeName === TODO_LIST || listNodeType.name === TODO_LIST) {
          parseTodoList(tr, listNodeType, pos, node);
          return false;
        }

        tr = tr.setNodeMarkup(pos, listNodeType, listNodeAttrs, node.marks);
      }

      items.length && lists.push(items);
      items = [];
      return false;
    }

    if (/table/.test(nodeName)) {
      items.length && lists.push(items);
      items = [];
      return true;
    }

    if (nodeType === heading || nodeType === paragraph) {
      items.push({
        node,
        pos
      });
    } else {
      items?.length && lists.push(items);
      items = [];
    }
    return true;
  };

  doc.nodesBetween(from, to, singleNodeHandler);

  if (items.length) lists.push(items);

  lists = lists.filter((items) => items.length > 0);

  if (!lists.length) {
    return tr;
  }

  lists = lists.sort((a, b) => {
    const pa = nullthrows(a[0]).pos;
    const pb = nullthrows(b[0]).pos;
    return pa >= pb ? 1 : -1;
  });

  lists.reverse();
  lists.forEach((items) => {
    tr = wrapItemsWithListInternal(tr, schema, listNodeType, items);
  });
  return tr;
}

function wrapItemsWithListInternal(
  tr: Transaction,
  schema: Schema,
  listNodeType: NodeType,
  items: Array<{
    node: Node;
    pos: number;
  }>
): Transaction {
  const initialTr = tr;
  const paragraph = schema.nodes[PARAGRAPH];
  let listItem: NodeType;
  switch (listNodeType.name) {
    case TODO_LIST:
      listItem = schema.nodes[LIST_TASK_ITEM];
      break;
    case TOGGLE_LIST:
      listItem = schema.nodes[TOGGLE_LIST_ITEM];
      break;
    default:
      listItem = schema.nodes[LIST_ITEM];
      break;
  }

  if (!paragraph || !listItem) {
    return tr;
  }

  const paragraphNodes: Node[] = [];
  items.forEach((item) => {
    const { node, pos } = item;

    // Temporarily annotate each node with an unique ID.
    const uniqueID = {};
    const nodeAttrs = {
      ...node.attrs,
      id: uniqueID
    };

    // Replace the original node with the node annotated by the uniqueID.
    tr.setNodeMarkup(pos, paragraph, nodeAttrs, node.marks);
    const targetNode = tr.doc.nodeAt(pos);
    if (targetNode) paragraphNodes.push(targetNode);
  });

  const firstNode = paragraphNodes[0];
  const lastNode = paragraphNodes[paragraphNodes.length - 1];

  if (!firstNode || !lastNode) {
    return initialTr;
  }

  const firstNodeID = firstNode.attrs.id;
  const lastNodeID = lastNode.attrs.id;

  if (!firstNodeID || !lastNodeID) {
    return initialTr;
  }

  let fromPos: number | null = null;
  let toPos: number | null = null;
  tr.doc.descendants((node, pos) => {
    const nodeID = node.attrs.id;

    if (nodeID === firstNodeID) {
      fromPos = pos;
    }

    if (nodeID === lastNodeID) {
      toPos = pos + node.nodeSize;
    }

    return fromPos === null || toPos === null;
  });

  if (fromPos === null || toPos === null) {
    return initialTr;
  }

  const listItemNodes: Node[] = [];
  items.forEach((item) => {
    const { node } = item;

    if (listItem.name === TOGGLE_LIST_ITEM) {
      tr.setMeta('preventPreserveSelection', true);
      const listItemNode = createToggleItemWithText(schema, node.textContent);
      if (listItemNode) listItemNodes.push(listItemNode);
    } else {
      // Restore the annotated nodes with the copy of the original ones.
      const paragraphNode = paragraph.create(node.attrs, node.content, node.marks);
      const listItemNode = listItem.create(node.attrs, Fragment.from(paragraphNode));
      listItemNodes.push(listItemNode);
    }
  });
  const listNodeAttrs = {
    indent: 0,
    start: 1
  };
  const $fromPos = tr.doc.resolve(fromPos);
  const $toPos = tr.doc.resolve(toPos);
  const hasSameListNodeBefore =
    $fromPos.nodeBefore && $fromPos.nodeBefore.type === listNodeType && $fromPos.nodeBefore.attrs.indent === 0;
  const hasSameListNodeAfter =
    $toPos.nodeAfter && $toPos.nodeAfter.type === listNodeType && $toPos.nodeAfter.attrs.indent === 0;

  if (hasSameListNodeBefore) {
    tr = tr.delete(fromPos, toPos);
    tr = tr.insert(fromPos - 1, Fragment.from(listItemNodes));

    if (hasSameListNodeAfter) {
      tr = tr.delete(toPos + 1, toPos + 3);
    }
  } else if (hasSameListNodeAfter) {
    tr = tr.delete(fromPos, toPos);
    tr = tr.insert(fromPos + 1, Fragment.from(listItemNodes));
  } else {
    const listNode = listNodeType.create(listNodeAttrs, Fragment.from(listItemNodes));
    tr.replaceRangeWith(fromPos, toPos, listNode);
    tr.setSelection(TextSelection.create(tr.doc, fromPos + listNode.content.size - 2)); // fall-back selection in case transformAndPreserveTextSelection is not executed
  }

  return tr;
}

// [FS] IRAD-966 2020-05-20
// Fix: Toggling issue for Multi-level list.
function unwrapNodesFromSelection(
  tr: Transaction,
  listNodePos: number,
  nodes: typeof Schema.prototype.nodes,
  listType?: string,
  unwrapParagraphNode?: (arg0: Node) => Node,
  from?: number,
  to?: number
): Transaction {
  const contentBlocksBefore: {
    node: Node;
    pos: number;
    parentNode: Node;
    index: number;
  }[] = [];
  const contentBlocksSelected: {
    node: Node;
    pos: number;
    parentNode: Node;
    index: number;
  }[] = [];
  const contentBlocksAfter: {
    node: Node;
    pos: number;
    parentNode: Node;
    index: number;
  }[] = [];
  const paragraph = nodes[PARAGRAPH];
  let listItem: NodeType;
  switch (listType) {
    case TODO_LIST:
      listItem = nodes[LIST_TASK_ITEM];
      break;
    case TOGGLE_LIST:
      listItem = nodes[TOGGLE_LIST_ITEM];
      break;
    default:
      listItem = nodes[LIST_ITEM];
      break;
  }
  const listNode = tr.doc.nodeAt(listNodePos);
  if (!(listNode instanceof Node)) {
    return tr;
  }

  tr.doc.nodesBetween(listNodePos, listNodePos + listNode.nodeSize, (node, pos, parentNode, index) => {
    if (node.type !== paragraph) {
      return true;
    }

    const block = {
      node,
      pos,
      parentNode,
      index
    };

    if (from && pos + node.nodeSize <= from) {
      contentBlocksBefore.push(block);
    } else if (to && pos > to) {
      contentBlocksAfter.push(block);
    } else {
      contentBlocksSelected.push(block);
    }

    return false;
  });

  if (!contentBlocksSelected.length) {
    return tr;
  }

  tr = tr.delete(listNodePos, listNodePos + listNode.nodeSize);
  const listNodeType = listNode.type;
  const attrs = {
    indent: listNode.attrs.indent,
    start: 1
  };

  if (contentBlocksAfter.length) {
    const nodes = contentBlocksAfter.map((block) => listItem.create({}, Fragment.from(block.node)));
    const frag = Fragment.from(listNodeType.create(attrs, Fragment.from(nodes)));
    tr = tr.insert(listNodePos, frag);
  }

  if (contentBlocksSelected.length) {
    const nodes = contentBlocksSelected.map((block) => {
      if (unwrapParagraphNode) {
        return unwrapParagraphNode(block.node);
      }
      return block.node;
    });
    const frag = Fragment.from(nodes);
    tr = tr.insert(listNodePos, frag);
  }

  if (contentBlocksBefore.length) {
    const nodes = contentBlocksBefore.map((block) => listItem.create({}, Fragment.from(block.node)));
    const frag = Fragment.from(listNodeType.create(attrs, Fragment.from(nodes)));
    tr = tr.insert(listNodePos, frag);
  }

  return tr;
}

function unwrapNodesFromListInternal(
  memo: SelectionMemo,
  listNodePos: number,
  unwrapParagraphNode?: (arg0: Node) => Node
): Transaction {
  const { schema } = memo;
  let { tr } = memo;

  if (!tr.doc || !tr.selection) {
    return tr;
  }

  const { nodes } = schema;
  const paragraph = nodes[PARAGRAPH];
  const listItem = nodes[LIST_ITEM];

  if (!listItem || !paragraph) {
    return tr;
  }

  const listNode = tr.doc.nodeAt(listNodePos);

  if (listNode instanceof Node && !isListNode(listNode)) {
    return tr;
  }

  const initialSelection = tr.selection;
  const { from, to } = initialSelection;
  const listNodePoses: number[] = [];
  // keep all list type nodes starting position
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (isListNode(node)) {
      if (keepDrillingInToggleList(node.type, initialSelection, schema, tr.doc, pos)) return true;

      listNodePoses.push(pos);
      return false;
    }
    return true;
  });

  if (from === to && from < 1) {
    return tr;
  }

  // Unwraps all selected list
  listNodePoses
    .sort(compareNumber)
    .reverse()
    .forEach((pos) => {
      tr = unwrapNodesFromSelection(tr, pos, nodes, listNode?.type.name, unwrapParagraphNode, from, to);
    });
  return tr;
}
