/* eslint-disable @typescript-eslint/no-unused-expressions */
import { NodeType, Schema } from 'prosemirror-model';
import { TextSelection, Transaction } from 'prosemirror-state';

import clearMarks from './clearMarks';
import compareNumber from './compareNumber';
import isListNode from './isListNode';
import { MARK_LINK } from './MarkNames';
import {
  BLOCKQUOTE,
  CODE_BLOCK,
  HEADING,
  PARAGRAPH,
  TOGGLE_ITEM_CONTENT,
  TOGGLE_ITEM_TITLE,
  TOGGLE_LIST_ITEM
} from './NodeNames';
import { keepDrillingInToggleList } from './toggleList';

export default function toggleCodeBlock(tr: Transaction, schema: Schema): Transaction {
  const { nodes } = schema;
  const { selection, doc } = tr;
  const codeBlock = nodes[CODE_BLOCK];
  const paragraph = nodes[PARAGRAPH];
  const heading = nodes[HEADING];
  const blockquote = nodes[BLOCKQUOTE];

  if (!selection || !doc || !codeBlock || !paragraph) {
    return tr;
  }

  const skipOnToggleItems = (nodeType: NodeType, pos: number) =>
    keepDrillingInToggleList(nodeType, selection, schema, doc, pos) ||
    nodeType.name === TOGGLE_ITEM_TITLE ||
    nodeType.name === TOGGLE_ITEM_CONTENT ||
    nodeType.name === TOGGLE_LIST_ITEM;

  const poses: number[] = [];
  const { from, to } = tr.selection;
  let allowed = true;
  let startWithCodeBlock: boolean | null = null;
  doc.nodesBetween(from, to, (node, pos) => {
    const { type, isBlock } = node;

    if (skipOnToggleItems(type, pos)) return true;

    if (startWithCodeBlock === null) {
      startWithCodeBlock = type === codeBlock;
    }

    if (isBlock) {
      allowed = allowed && (type === paragraph || type === codeBlock || type === heading || type === blockquote);
      allowed && poses.push(pos);
    }

    return isBlock;
  });

  // Update from the bottom to avoid disruptive changes in pos.
  allowed &&
    poses
      .sort(compareNumber)
      .reverse()
      .forEach((pos) => {
        tr = setCodeBlockNodeEnabled(tr, schema, pos, !startWithCodeBlock);
      });
  return tr;
}

function setCodeBlockNodeEnabled(tr: Transaction, schema: Schema, pos: number, enabled: boolean): Transaction {
  const { doc } = tr;

  if (!doc) {
    return tr;
  }

  const node = doc.nodeAt(pos);

  if (!node) {
    return tr;
  }

  if (isListNode(node)) {
    return tr;
  }

  const { nodes } = schema;
  const codeBlock = nodes[CODE_BLOCK];
  const paragraph = nodes[PARAGRAPH];

  if (codeBlock && !enabled && node.type === codeBlock) {
    tr = tr.setNodeMarkup(pos, paragraph, node.attrs, node.marks);
  } else if (enabled && node.type !== codeBlock) {
    const { selection } = tr;
    tr = tr.setSelection(TextSelection.create(tr.doc, pos, pos + node.nodeSize));
    tr = clearMarks(tr, schema);
    tr = tr.removeMark(pos, pos + node.nodeSize, schema.marks[MARK_LINK]);
    tr = tr.setSelection(selection);
    tr = tr.setNodeMarkup(pos, codeBlock, node.attrs, node.marks);
  }

  return tr;
}
