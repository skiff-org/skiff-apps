import { CellSelection } from '@skiff-org/prosemirror-tables';
import { NodeType, Schema } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

import compareNumber from './compareNumber';
import isInsideListItem from './isInsideListItem';
import isListNode from './isListNode';
import {
  BLOCKQUOTE,
  BULLET_LIST,
  HEADING,
  LIST_ITEM,
  ORDERED_LIST,
  PARAGRAPH,
  TODO_LIST,
  TOGGLE_LIST
} from './NodeNames';
import { unwrapNodesFromList } from './toggleList';

export default function toggleHeading(tr: Transaction, schema: Schema, level?: number | null): Transaction {
  const { nodes } = schema;
  const { selection, doc } = tr;
  const blockquote = nodes[BLOCKQUOTE];
  const heading = nodes[HEADING];
  const listItem = nodes[LIST_ITEM];
  const paragraph = nodes[PARAGRAPH];

  if (!selection || !doc || !heading || !paragraph || !listItem || !blockquote) {
    return tr;
  }

  const { from, to } = tr.selection;
  let startWithHeadingBlock = false;
  const poses: number[] = [];
  const toggleListsPoses: number[] = [];

  if (tr.selection instanceof CellSelection) {
    tr.selection.forEachCell((cell, cellPos) => {
      cell.descendants((node, pos, parentNode) => {
        const nodeType: NodeType = node.type;
        const parentNodeType: NodeType = parentNode.type;

        if (!startWithHeadingBlock) {
          startWithHeadingBlock = nodeType === heading && node.attrs.level === level;
        }

        if (parentNodeType !== listItem) {
          poses.push(cellPos + pos);
        }

        return !isListNode(node);
      });
    });
  } else {
    doc.nodesBetween(from, to, (node, pos, parentNode) => {
      const nodeType = node.type;
      const parentNodeType = parentNode.type;
      const isItListNode = isListNode(node);
      if (startWithHeadingBlock === null) {
        startWithHeadingBlock = nodeType === heading && node.attrs.level === level;
      }
      if (parentNodeType !== listItem && (node.isTextblock || isItListNode)) {
        if (nodeType.name === TOGGLE_LIST) {
          // Toggle lists are at higher priority since they
          // must become heading before its children
          toggleListsPoses.push(pos);
        } else {
          poses.push(pos);
        }
      }

      if (node.type.name === TOGGLE_LIST) {
        return true;
      }

      return !isItListNode;
    });
  }

  // Update from the bottom to avoid disruptive changes in pos.
  poses.sort(compareNumber).reverse();
  poses.unshift(...toggleListsPoses.sort(compareNumber).reverse()); // Add toggle list to start of poses
  poses.forEach((pos) => {
    tr = setHeadingNode(tr, schema, pos, startWithHeadingBlock ? null : level);
  });
  return tr;
}

function setHeadingNode(tr: Transaction, schema: Schema, pos: number, level?: number | null): Transaction {
  const { nodes } = schema;
  const heading = nodes[HEADING];
  const paragraph = nodes[PARAGRAPH];
  const blockquote = nodes[BLOCKQUOTE];
  const ul = nodes[BULLET_LIST];
  const ol = nodes[ORDERED_LIST];
  const todo = nodes[TODO_LIST];
  const toggle = nodes[TOGGLE_LIST];

  if (pos >= tr.doc.content.size) {
    // Workaround to handle the edge case that pos was shifted caused by `toggleList`.
    return tr;
  }

  const node = tr.doc.nodeAt(pos);
  if (!node || !heading || !paragraph || !blockquote || !ul || !ol || !todo) {
    return tr;
  }
  const nodeType = node.type;
  if (isInsideListItem(tr.doc, pos)) {
    return tr;
  }

  if (isListNode(node)) {
    // Toggle list
    if (heading && level !== null) {
      tr = unwrapNodesFromList(tr, schema, pos, (paragraphNode) => {
        const { content, marks, attrs } = paragraphNode;
        const headingAttrs = {
          ...attrs,
          level
        };
        return heading.create(headingAttrs, content, marks);
      });
    } else if (level === null && (nodeType === ol || nodeType === ul || nodeType === todo || nodeType === toggle)) {
      tr = unwrapNodesFromList(tr, schema, pos, (listNode) => {
        const { content, marks, attrs } = listNode;
        const parAttrs = {
          ...attrs
        };
        return paragraph.create(parAttrs, content, marks);
      });
    }
  } else if (nodeType === heading) {
    // Toggle heading
    if (level === null) {
      tr = tr.setNodeMarkup(pos, paragraph, node.attrs, node.marks);
    } else {
      tr = tr.setNodeMarkup(
        pos,
        heading,
        {
          ...node.attrs,
          level
        },
        node.marks
      );
    }
  } else if ((level && nodeType === paragraph) || nodeType === blockquote) {
    tr = tr.setNodeMarkup(
      pos,
      heading,
      {
        ...node.attrs,
        level
      },
      node.marks
    );
  }

  return tr;
}
