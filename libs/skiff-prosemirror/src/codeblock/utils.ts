// From prosemirror guide
import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { setBlockType } from 'prosemirror-commands';
import { Node } from 'prosemirror-model';
import { EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { findChildrenByMark, hasParentNodeOfType } from 'prosemirror-utils';
import { EditorView as PMEditorView } from 'prosemirror-view';

import { handleCommentMarkClick } from '../comments/utils/comment';
import { MARK_COMMENT } from '../MarkNames';
import { CODE_BLOCK } from '../NodeNames';

import { CodeBlockSettings } from './types';

export function computeChange(oldVal: string, newVal: string) {
  if (oldVal === newVal) return null;
  let start = 0;
  let oldEnd = oldVal.length;
  let newEnd = newVal.length;
  while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) start += 1;
  while (oldEnd > start && newEnd > start && oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
    oldEnd -= 1;
    newEnd -= 1;
  }
  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
}

export const asProseMirrorSelection = (pmDoc: Node, cmView: EditorView, getPos: (() => number) | boolean) => {
  const offset = (typeof getPos === 'function' ? getPos() || 0 : 0) + 1;
  const anchor = cmView.state.selection.main.from + offset;
  const head = cmView.state.selection.main.to + offset;
  return TextSelection.create(pmDoc, anchor, head);
};

export const forwardSelection = (cmView: EditorView, pmView: PMEditorView, getPos: (() => number) | boolean) => {
  if (!cmView.hasFocus) return;
  const selection = asProseMirrorSelection(pmView.state.doc, cmView, getPos);
  if (!selection.eq(pmView.state.selection)) pmView.dispatch(pmView.state.tr.setSelection(selection));
};

export const valueChanged = (textUpdate: string, node: Node, getPos: (() => number) | boolean, view: PMEditorView) => {
  const change = computeChange(node.textContent, textUpdate);
  if (change && typeof getPos === 'function') {
    const start = getPos() + 1;

    const pmTr = view.state.tr.replaceWith(
      start + change.from,
      start + change.to,
      change.text ? view.state.schema.text(change.text) : null
    );
    view.dispatch(pmTr);
  }
};

export const maybeEscape = (
  unit: 'char' | 'line',
  dir: -1 | 1,
  cm: EditorView,
  view: PMEditorView,
  getPos: boolean | (() => number)
) => {
  const sel = cm.state.selection.main;
  const line = cm.state.doc.lineAt(sel.from);
  const lastLine = cm.state.doc.lines;
  if (
    sel.to !== sel.from ||
    line.number !== (dir < 0 ? 1 : lastLine) ||
    (unit === 'char' && sel.from !== (dir < 0 ? 0 : line.to)) ||
    typeof getPos !== 'function'
  )
    return false;
  view.focus();
  const node = view.state.doc.nodeAt(getPos());
  if (!node) return false;
  const targetPos = getPos() + (dir < 0 ? 0 : node.nodeSize);
  const selection = Selection.near(view.state.doc.resolve(targetPos), dir);
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  view.focus();
  return true;
};

export const backspaceHandler = (pmView: PMEditorView, view: EditorView) => {
  const { selection } = view.state;
  if (selection.main.empty && selection.main.from === 0) {
    setBlockType(pmView.state.schema.nodes.paragraph)(pmView.state, pmView.dispatch);
    setTimeout(() => pmView.focus(), 20);
    return true;
  }
  return false;
};

export const setMode = async (
  lang: string,
  cmView: EditorView,
  settings: CodeBlockSettings,
  languageConf: Compartment
) => {
  const support = await settings.languageLoaders?.[lang]?.();
  if (support)
    cmView.dispatch({
      effects: languageConf.reconfigure(support)
    });
};

const arrowHandler =
  (dir: 'left' | 'right' | 'up' | 'down') =>
  (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined, view?: PMEditorView) => {
    if (state.selection.empty && view?.endOfTextblock(dir)) {
      const side = dir === 'left' || dir === 'up' ? -1 : 1;
      const { $head } = state.selection;
      // Selection head points to root node -> no after or before positions (throws error)
      if ($head.depth === 0) {
        return false;
      }
      const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
      if (nextPos.$head && nextPos.$head.parent.type.name === 'code_block') {
        dispatch?.(state.tr.setSelection(nextPos));
        return true;
      }
    }
    return false;
  };

export const codeBlockArrowHandlers = {
  ArrowLeft: arrowHandler('left'),
  ArrowRight: arrowHandler('right'),
  ArrowUp: arrowHandler('up'),
  ArrowDown: arrowHandler('down')
};

export const isInCodeblock = (state: EditorState, pos: number) => {
  try {
    return hasParentNodeOfType(state.schema.nodes[CODE_BLOCK])(TextSelection.create(state.doc, pos));
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getMarkFromNode = (node: Node, markName: string) => {
  return node.marks.find((mark) => mark.type.name === markName);
};

export const getCodeblockCommentRect = (id: string) => {
  const commentDOM = document.querySelector(`.comment-mark[id="${id}"]`);
  return commentDOM && commentDOM.getBoundingClientRect();
};

export const resetCodemirrorSelection = (view: EditorView) => {
  view.dispatch({
    selection: { anchor: 0 }
  });
};

export const handleCodemirrorClick = (
  event: MouseEvent | TouchEvent,
  pmView: PMEditorView,
  cmView: EditorView,
  node: Node<any>,
  getPos: boolean | (() => number)
) => {
  // Click event on CodeMirror dom ( not fired on prosemirror dom) so we
  // detect which node was clicked on and if a comment line was clicked activate it and position the comment
  // Taken from comment.plugin.ts with some changes to make it work with codeblock and codemirror
  console.log(cmView.state.selection.ranges[0]);
  if (
    !(event.target instanceof HTMLElement) ||
    event.target.classList.contains('cm-line') ||
    typeof getPos !== 'function'
  ) {
    // When click is not on mark element
    return false;
  }
  const nodePos = getPos(); // Position of code_block relative to doc
  const range = cmView.state.selection.ranges[0];
  if (!range || !range.from) return false;
  const pos = range.from; // Position of selection
  const childrenWithCommentMarks = findChildrenByMark(node, pmView.state.schema.marks[MARK_COMMENT]);
  const nodeWithMark = childrenWithCommentMarks.find((child) => {
    return child.pos <= pos && child.pos + child.node.nodeSize >= pos;
  });
  if (!nodeWithMark) return false;

  return handleCommentMarkClick(pmView, nodeWithMark, nodePos, pmView.state.tr);
};
