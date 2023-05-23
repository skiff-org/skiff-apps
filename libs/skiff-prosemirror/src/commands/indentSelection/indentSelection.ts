import { Node as PMNode, Schema } from 'prosemirror-model';
import { TextSelection, Transaction } from 'prosemirror-state';
import { Mapping } from 'prosemirror-transform';

import { syncOrderedLists } from '../syncOrderedLists';
import { Command } from '../types';

import { clampIndent } from './clampIndent';
import { indentListContent, createListNode } from './createListNode';

const INDENTABLE_NODES = ['paragraph', 'heading', 'blockquote'];

interface FoundListNode {
  pos: number;
  node: PMNode;
}

function setNodeIndentMarkup(pos: number, node: PMNode, delta: number, tr: Transaction) {
  const indent = (node.attrs.indent as number) || 0;
  const newIndent = clampIndent(indent + delta);
  if (newIndent !== indent) {
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: newIndent }, node.marks);
  }
}

/**
 * Indents nodes & list rows within a selection & updates the start values of list nodes adjacent
 * to the indented list node.
 *
 * All lists are normalized based on "list islands" which prevents nested lists which (allegedly)
 * makes things easier to manage: https://github.com/ProseMirror/prosemirror/issues/92)
 * Although, to be honest, normalizing the lists IMO makes it actually harder since you A. have to
 * write silly logic like this and B. it makes it _very_ difficult to maintain text selections.
 *
 * Using nested lists the logic would be just wrapping & unwrapping lists (or changing their indent)
 * and setting the start counters correctly. Having to normalize the lists, since you can't tell for
 * sure how the wrappings will happen, you either recreate the whole list based on the new indentations
 * OR write some manual magic to unwrap & wrap each node depending on their new indentation. I went with
 * the first approach. Second would be better for maintaining text selections but harder to make.
 * But they both are immensely more complicated than just wrapping the selection in a list and calling
 * it a day like in https://prosemirror.net or with TipTap ordered list
 *
 * With list islands three ordered lists that by default are ordered as:
 * ```
 *   --------
 *   1. AAA
 *   2. BBB
 *   --------
 *     a. CCC
 *     d. DDD
 *   --------
 *   1. EEE
 *   2. FFF
 *   --------
 * ```
 * Are transformed into:
 * ```
 *   --------
 *   1. AAA
 *   2. BBB
 *   --------
 *     a. CCC
 *     d. DDD
 *   --------
 *   3. EEE
 *   4. FFF
 *   --------
 * ```
 * @param delta
 * @returns
 */
export const indentSelection =
  (delta: number): Command =>
  (state, dispatch) => {
    const {
      tr,
      selection: { from, to }
    } = state;
    const schema = state.schema as Schema;
    const foundListNodes: FoundListNode[] = [];
    // First find all list nodes for processing and indent all regular block nodes that can be indented
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (
        node.type === schema.nodes.bullet_list ||
        node.type === schema.nodes.ordered_list ||
        node.type === schema.nodes.todo_list
      ) {
        foundListNodes.push({
          node,
          pos
        });
        return false;
      } else if (INDENTABLE_NODES.some((val) => node.type.name === val)) {
        setNodeIndentMarkup(pos, node, delta, tr);
        return false;
      }
    });
    const mapping = new Mapping();
    foundListNodes.forEach((rootListNode) => {
      const { pos: rawPos, node } = rootListNode;
      const pos = mapping.map(rawPos);
      // Indent list rows within the selection
      const created = indentListContent(pos, node, mapping.map(from), mapping.map(to), delta, schema, tr.doc);
      // Create new list nodes based on the indentation and replace the old node
      const newNodes = createListNode(created, node);
      tr.replaceWith(pos, pos + node.nodeSize, newNodes);
      mapping.appendMap(tr.steps[tr.steps.length - 1].getMap());
    });
    // Find the ordered_list node adjacent to the replaced list node and update the start counters
    // at that depth if needed
    syncOrderedLists(from - 1, to + 1, tr)(state);
    if (tr.docChanged) {
      // Since we are not offseting the from & to of the new text selection properly, we must ensure
      // we are not at least trying to set the head outside the document (and causing an error)
      const newSel = TextSelection.create(tr.doc, from, Math.min(to, tr.doc.nodeSize - 2));
      tr.setSelection(newSel);
      if (dispatch) dispatch(tr);
      return true;
    }
    return false;
  };
