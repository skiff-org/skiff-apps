import { Fragment, Node, Schema } from 'prosemirror-model';
import { EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeOfType, findPositionOfNodeBefore } from 'prosemirror-utils';

import applyMark from './applyMark';
import { MARK_SPACER } from './MarkNames';
import nodeAt from './nodeAt';
import { CODE_BLOCK, HEADING, LIST_ITEM, LIST_TASK_ITEM, PARAGRAPH, TEXT, TOGGLE_ITEM_TITLE } from './NodeNames';
import { HAIR_SPACE_CHAR, SPACER_SIZE_TAB } from './SpacerMarkSpec';
import UICommand from './ui/UICommand';

/**
 * Function returns  true if the node has a spacer mark on it
 * @param node: Node The node that is being inspected
 * @returns boolean True if node has at least one spacer mark
 */
const isSpacer = (node: Node) => node.marks.map((mark) => mark.type.name === MARK_SPACER).includes(true);

/**
 * From an array of nodes it returns the index of the last one.
 * @param nodes node array we are inspecting
 * @returns number|undefined Index of the spacer in the array or undefined
 */
const spacerPosition = (nodes: Array<Node>) => {
  let pos;
  nodes.map((node, idx) => {
    if (isSpacer(node)) {
      pos = idx;
    }
  });
  return pos;
};

/**
 * Returns an array of nodes in which the last element is the node which marks we want to preserve after one or multiple tab presses
 * If the node that comes before is not a spacer, we return that node in an array
 * If there was already one or more spacer in the node array we return a nodes that came before the last spacer
 * If there were no nodes in the paragraph then we return an empty array, we dont need to preserve any marks
 *
 * @param tr Transaction
 * @param nodes Array<Node>
 */
const getContentNodes = (tr: Transaction, nodes: Array<Node>): Array<Node> => {
  const pos = spacerPosition(nodes);

  const previousNode = nodeAt(tr.doc, (findPositionOfNodeBefore(tr.selection) || 1) - 1);

  if (previousNode && !isSpacer(previousNode)) {
    return [previousNode];
  }

  if (pos) {
    return nodes.slice(0, pos);
  }

  return [];
};

const getNodeToApplyCommand = (schema: Schema, selection: Selection) => {
  const paragraph = schema.nodes[PARAGRAPH];
  const heading = schema.nodes[HEADING];
  const listItem = schema.nodes[LIST_ITEM];
  const taskItem = schema.nodes[LIST_TASK_ITEM];
  const codeBlock = schema.nodes[CODE_BLOCK];
  const found =
    (listItem && findParentNodeOfType(listItem)(selection)) ||
    (taskItem && findParentNodeOfType(taskItem)(selection)) ||
    (paragraph && findParentNodeOfType(paragraph)(selection)) ||
    (heading && findParentNodeOfType(heading)(selection)) ||
    (codeBlock && findParentNodeOfType(codeBlock)(selection));

  return found;
};

function insertTabSpace(tr: Transaction, schema: Schema): Transaction {
  const { selection } = tr;

  if (!selection.empty || !(selection instanceof TextSelection)) {
    return tr;
  }

  const markType = schema.marks[MARK_SPACER];

  if (!markType) {
    return tr;
  }

  const paragraph = schema.nodes[PARAGRAPH];
  const listItem = schema.nodes[LIST_ITEM];
  const taskItem = schema.nodes[LIST_TASK_ITEM];
  const codeBlock = schema.nodes[CODE_BLOCK];
  const found = getNodeToApplyCommand(schema, selection);

  if (!found) return tr;
  const { from, to } = selection;

  if ((found.node.type === listItem || found.node.type === taskItem) && found.pos === from - 2) {
    // Cursor is at te begin of the list-item, let the default indentation
    // behavior happen.
    return tr;
  }
  const attrs = {
    size: SPACER_SIZE_TAB
  };
  // In a code block there are only text nodes and text nodes cant be indented, in this case we insert a spacer
  // In case of the paragraph we also just want to add a spacer, we just want the first row to be indented not the whole paragraph
  if (found.node.type === codeBlock || found.node.type === paragraph) {
    const textNode = schema.text(HAIR_SPACE_CHAR);
    tr = tr.insert(from, Fragment.from(textNode));
    tr = tr.setSelection(TextSelection.create(tr.doc, to, to + 1));
    tr = applyMark(tr, schema, markType, attrs);
    tr = tr.setSelection(TextSelection.create(tr.doc, to + 1, to + 1));
    return tr;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const nodes: Node[] = found.node.content.content;
  const contentNodes = getContentNodes(tr, nodes);
  const textNode = schema.text(HAIR_SPACE_CHAR);
  tr = tr.insert(to, Fragment.from(textNode));
  tr = tr.setSelection(TextSelection.create(tr.doc, to, to + 1));
  tr = applyMark(tr, schema, markType, attrs);
  tr = tr.setSelection(TextSelection.create(tr.doc, to + 1, to + 1));
  // if we have existingMarks we set the stored marks to the marks of the last textNode in our paragraph before, the one that comes before one or multiple spacers (tabs)
  const node = nodeAt(tr.doc, selection.anchor - 1);

  if (node) {
    const existingMarks = contentNodes.slice(-1)[0].marks;

    // if contentNodes is empty array existingMarks will be undefined
    if (existingMarks) {
      tr.setStoredMarks(existingMarks);
    }
  }

  return tr;
}

function removeTabSpace(tr: Transaction, schema: Schema): Transaction {
  const { selection } = tr;

  if (!selection.empty || !(selection instanceof TextSelection)) {
    return tr;
  }

  const markType = schema.marks[MARK_SPACER];

  if (!markType) {
    return tr;
  }

  const text = schema.nodes[TEXT];
  const listItem = schema.nodes[LIST_ITEM];
  const taskItem = schema.nodes[LIST_TASK_ITEM];
  const found = getNodeToApplyCommand(schema, selection);
  if (!found) {
    return tr;
  }
  const { $from, from } = selection;

  if ((found.node.type === listItem || found.node.type === taskItem) && found.pos === from - 2) {
    // Cursor is at te begin of the list-item, let the default indentation
    // behavior happen.
    return tr;
  }
  const attrs = {
    size: SPACER_SIZE_TAB
  };

  // check if the text before the cursor is tab, if so - delete him
  const prevTextNode = $from.nodeBefore;
  if (prevTextNode && prevTextNode.hasMarkup(text, {}, [markType.create(attrs)])) {
    tr.delete(from - 1, from);
  }
  return tr;
}

class TextInsertTabSpaceCommand extends UICommand {
  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { schema, tr, selection } = state;

    const parentToggleTitle = findParentNodeOfType(schema.nodes[TOGGLE_ITEM_TITLE])(selection);
    if (parentToggleTitle) return false;

    const trNext = insertTabSpace(tr, schema);

    if (trNext.docChanged) {
      dispatch?.(trNext);
      return true;
    }

    return false;
  };
}

class TextRemoveTabSpaceCommand extends UICommand {
  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { schema, tr, selection } = state;

    const parentToggleTitle = findParentNodeOfType(schema.nodes[TOGGLE_ITEM_TITLE])(selection);
    if (parentToggleTitle) return false;

    const trNext = removeTabSpace(tr, schema);

    if (trNext.docChanged) {
      dispatch?.(trNext);
      return true;
    }

    return false;
  };
}

export { TextInsertTabSpaceCommand, TextRemoveTabSpaceCommand };
