import { Node as PMNode, NodeType } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { canJoin, Mapping } from 'prosemirror-transform';

import { MAX_INDENT_LEVEL, MIN_INDENT_LEVEL } from '../indentSelection/clampIndent';

/**
 * Recurses all list nodes between start and end in order to set their start counters properly
 * @param start
 * @param end
 * @param listNodeType
 * @param listItemType
 * @param tr
 */
export function recurseAdjacentListNodes(
  start: number,
  end: number,
  listNodeType: NodeType,
  listItemType: NodeType,
  tr: Transaction
) {
  const levels: { [key: number]: number } = {};
  const mapping = new Mapping();
  let prevList: { node: PMNode; pos: number } | undefined;
  tr.doc.nodesBetween(start, end, (node, rawPos) => {
    const pos = mapping.map(rawPos);
    const nodeIndent = (node.attrs.indent as number) || 0;
    if (!prevList && node.type === listNodeType) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, start: 1 }, node.marks);
      prevList = { node, pos };
    } else if (prevList && node.type === listNodeType) {
      const { node: prevNode, pos: prevPos } = prevList;
      const prevIndent = (prevNode.attrs.indent as number) || 0;
      prevList = { node, pos };
      // Current node starts where the previous list node ends
      const adjacent = pos === mapping.map(prevPos + prevNode.nodeSize);
      if (adjacent && prevIndent === nodeIndent && canJoin(tr.doc, pos)) {
        // Adjacent lists with the same indentation -> unwrap the list to join with the list above
        // if canJoin = false -> attempting to join list nodes of different type (I think)
        tr.join(pos);
        mapping.appendMap(tr.steps[tr.steps.length - 1].getMap());
      } else if (adjacent && nodeIndent < prevIndent) {
        // This list was indented lower -> use old start if exists, start from 1 otherwise
        // 1. ul li (indent 0)
        //   1. ul li (indent 1) = prevNode
        // 2. ul li (indent 0) = node
        if (levels[nodeIndent] === undefined) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, start: 1 }, node.marks);
        } else {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, start: levels[nodeIndent] }, node.marks);
        }
      } else if (adjacent && nodeIndent > prevIndent) {
        // Indented higher -> reset start counters between indentations
        //   1. ul li (indent 1)
        // 3. ul li (indent 0) = prevNode
        //   1. ul li (indent 1) = node
        // -> set starting levels from 1 to 1 as 1
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, start: 1 }, node.marks);
        for (let i: number = prevIndent + 1; i <= nodeIndent; i += 1) {
          levels[i] = 1;
        }
      }
    } else if (node.type === listItemType) {
      const indent = (prevList?.node.attrs.indent as number) || 0;
      if (levels[indent] === undefined) {
        levels[indent] = 2;
      } else {
        levels[indent] += 1;
      }
      return false;
    } else {
      // Not a list or list_item node -> reset counters
      for (let i = MIN_INDENT_LEVEL; i <= MAX_INDENT_LEVEL; i += 1) {
        levels[i] = 1;
      }
      prevList = undefined;
    }
  });
}
