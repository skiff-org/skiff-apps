import { Fragment, Mark, Schema } from 'prosemirror-model';
import { TextSelection, Transaction } from 'prosemirror-state';

import applyMark from './applyMark';
import { MARK_TEXT_SELECTION } from './MarkNames';
import { PARAGRAPH, TEXT } from './NodeNames';
import uuid from './ui/uuid';

export type SelectionMemo = {
  schema: Schema;
  tr: Transaction;
};
// Text used to create temporary selection.
// This assumes that no user could enter such string manually.
const PLACEHOLDER_TEXT = `[\u200b\u2800PLACEHOLDER_TEXT_${uuid()}\u2800\u200b]`; // Perform the transform without losing the perceived text selection.
// The way it works is that this will annotate the current selection with
// temporary marks and restores the selection with those marks after performing
// the transform.

export default function transformAndPreserveTextSelection(
  tr: Transaction,
  schema: Schema,
  fn: (memo: SelectionMemo) => Transaction
): Transaction {
  if (tr.getMeta('dryrun')) {
    // There's no need to preserve the selection in dryrun mode.
    return fn({
      tr,
      schema
    });
  }

  const { selection, doc } = tr;
  const markType = schema.marks[MARK_TEXT_SELECTION];

  if (!markType || !selection || !doc) {
    return tr;
  }

  if (!(selection instanceof TextSelection)) {
    return tr;
  }

  const { from, to } = selection;
  // Mark current selection so that we could resume the selection later
  // after changing the whole list.
  let fromOffset = 0;
  let toOffset = 0;
  let placeholderTextNode;

  if (from === to) {
    if (from === 0) {
      return tr;
    }

    // Selection is collapsed, create a temporary selection that the marks can
    // be applied to.
    const currentNode = tr.doc.nodeAt(from);
    const prevNode = tr.doc.nodeAt(from - 1);
    const nextNode = tr.doc.nodeAt(from + 1);

    if (!currentNode && prevNode?.type.name === PARAGRAPH && !prevNode.firstChild) {
      // The selection is at a paragraph node which has no content.
      // Create a temporary text and move selection into that text.
      placeholderTextNode = schema.text(PLACEHOLDER_TEXT);
      tr = tr.insert(from, Fragment.from(placeholderTextNode));
      toOffset = 1;
    } else if (!currentNode && prevNode?.type.name === TEXT) {
      // The selection is at the end of the text node. Select the last
      // character instead.
      fromOffset = -1;
    } else if (prevNode && currentNode && currentNode.type === prevNode.type) {
      // Ensure that the mark is applied to the same type of node.
      fromOffset = -1;
    } else if (nextNode && currentNode && currentNode.type === nextNode.type) {
      toOffset = 1;
    } else if (nextNode) {
      // Could not find the same type of node, assume the next node is safe to use.
      toOffset = 1;
    } else if (prevNode) {
      // Could not find the same type of node, assume the next node is safe to use.
      fromOffset = -1;
    } else {
      // Selection can't be safely preserved.
      return tr;
    }

    tr = tr.setSelection(TextSelection.create(tr.doc, from + fromOffset, to + toOffset));
  }

  // This is an unique ID (by reference).
  const id = {};

  const findMark = (mark: Mark) => mark.attrs.id === id;

  const findMarkRange = () => {
    let markFrom = 0;
    let markTo = 0;
    tr.doc.descendants((node, pos) => {
      if (node.marks?.find(findMark)) {
        markFrom = markFrom === 0 ? pos : markFrom;
        markTo = pos + node.nodeSize;
      }

      return true;
    });
    return {
      from: markFrom,
      to: markTo
    };
  };

  // TODO: This has side-effect. It will cause `tr.docChanged` to be `true`.
  // No matter whether `fn({tr, schema})` did change the doc or not.
  tr = applyMark(tr, schema, markType, {
    id
  });
  tr = fn({
    tr,
    schema
  });
  const markRange = findMarkRange();
  const selectionRange = {
    from: Math.max(0, markRange.from - fromOffset),
    to: Math.max(0, markRange.to - toOffset)
  };
  selectionRange.to = Math.max(0, selectionRange.from, selectionRange.to);
  tr = tr.removeMark(markRange.from, markRange.to, markType);

  let placeholderPos = 0;

  if (placeholderTextNode) {
    tr.doc.descendants((node, pos) => {
      if (node.type.name === TEXT && node.text === PLACEHOLDER_TEXT) {
        tr = tr.delete(pos, pos + PLACEHOLDER_TEXT.length);
        placeholderTextNode = null;
        placeholderPos = pos;
        return false;
      }

      return true;
    });
  }

  // TODO: we should probably remove the use of this util (`transformAndPreserveTextSelection`), this is away to go around it for specific places
  if (tr.getMeta('preventPreserveSelection')) {
    if (!placeholderTextNode) return tr;
    tr = tr.setSelection(TextSelection.create(tr.doc, placeholderPos));
  } else {
    tr = tr.setSelection(TextSelection.create(tr.doc, selectionRange.from, selectionRange.to));
  }
  return tr;
}
