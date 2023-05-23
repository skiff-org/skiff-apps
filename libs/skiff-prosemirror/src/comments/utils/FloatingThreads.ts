import EventEmitter from 'eventemitter3';
import first from 'lodash/first';
import { TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { assertExists } from 'skiff-utils';

import { COMMENT_MARK_CLASS } from '../../comments/CommentMarkSpec';
import { CommentWithPos } from '../comment.types';
import { RefAndPos } from '../components/FloatingThreads';

import { getCommentCoords } from './comment';

const COMMENTS_SPACING = 10;
export const EDITOR_TOP_OFFSET = 60;

export const getScrolledEditor = () => {
  const editorContainer = first(document.getElementsByClassName('skiff-editor-frame-body'));
  if (!editorContainer) return null;
  return editorContainer;
};

export const getScrollOffset = () => {
  const editorContainer = getScrolledEditor();
  if (!editorContainer) return 0;
  return editorContainer.scrollTop;
};

const getEditorTop = (view: EditorView) => {
  // sometimes s when the editor top is not visible coordsAtPos throws an error
  // in that case return null that will abort the update
  try {
    const { top } = view.coordsAtPos(0);
    return top;
  } catch (err) {
    return null;
  }
};

type CommentsPositionEvent = 'position-comments' | 'scroll-to-comment-anchor';

export const CommentsPositionEmitter = new EventEmitter<CommentsPositionEvent>();

/**
 * position the floating comments around the focused comment,
 * align the focused comment with its corresponding node and scroll him into view
 * @param commentsRefs
 * @param comments
 * @param view
 * @param anchorCommentIndex
 */
export const positionComments = (
  commentsRefs: { [key: string]: RefAndPos },
  comments: CommentWithPos[],
  view: EditorView,
  anchorCommentIndex: number // the index of the focused comment
) => {
  // make a list of refs in the same order of the comments in the document and filter assert they exist and connected
  const refsList = comments
    .map((comment) => commentsRefs[comment.comment.id]?.ref)
    .filter((ref) => !!ref && ref.isConnected); // somtimes on cmd-z the ref is not conneted

  if (refsList.length !== comments.length) {
    //console.error('Ref & comment list not synced', comments, commentsRefs);
    return;
  }

  const isActive = anchorCommentIndex !== -1;
  if (anchorCommentIndex === -1) anchorCommentIndex = 0;
  const commentsAfterAnchor = comments.slice(anchorCommentIndex);
  const commentsBeforeAnchor = comments.slice(0, anchorCommentIndex);

  const commentsRefsAfterAnchor = refsList.slice(anchorCommentIndex);
  const commentsRefsBeforeAnchor = refsList.slice(0, anchorCommentIndex);

  // position comments after anchor
  const bottomBorder = positionCommentsAscending(commentsRefsAfterAnchor, commentsAfterAnchor, view, isActive);

  // position comments before anchor
  positionCommentsDescending(
    commentsRefsBeforeAnchor.reverse(),
    commentsBeforeAnchor.reverse(),
    view,
    bottomBorder || Infinity
  );
};

/**
 * position the comments after the focused comment
 * @param commentsDOM
 * @param comments
 * @param view
 * @returns
 */
export const positionCommentsAscending = (
  commentsDOM: HTMLElement[],
  comments: CommentWithPos[],
  view: EditorView,
  isActive: boolean
) => {
  const editorScrollOffset = getScrollOffset();
  const editorTop = getEditorTop(view);
  if (!commentsDOM.length || !editorTop) return;

  let topBorder = editorTop - EDITOR_TOP_OFFSET - COMMENTS_SPACING;

  commentsDOM.forEach((comment, index) => {
    const { height: commentHeight } = comment.getBoundingClientRect();
    if (!comments[index] || view.state.doc.nodeSize < comments[index].pos) return;
    const desiredPos = calcDesiredPos(view, comments[index], editorScrollOffset);

    if (topBorder > desiredPos) {
      comment.style.top = `${topBorder}px`;
      topBorder = topBorder + commentHeight + COMMENTS_SPACING;
    } else {
      // make sure all the active comment is inside the view
      if (index === 0 && isActive) {
        assertExists(window.visualViewport);
        const screenBottom = window.visualViewport.height + editorScrollOffset;
        const desiredPosInView = Math.min(desiredPos, screenBottom - commentHeight - COMMENTS_SPACING - 130);
        comment.style.top = `${desiredPosInView}px`;
        topBorder = desiredPosInView + commentHeight + COMMENTS_SPACING;
      } else {
        comment.style.top = `${desiredPos}px`;
        topBorder = desiredPos + commentHeight + COMMENTS_SPACING;
      }
    }

    if (index === 0 && isActive) {
      comment.style.right = `30px`;
    } else {
      comment.style.right = `20px`;
    }
  });

  return Number(commentsDOM[0].style.top.replace('px', ''));
};

/**
 * position the comments before the focused comment
 * @param commentsDOM
 * @param comments
 * @param view
 * @returns
 */
export const positionCommentsDescending = (
  commentsDOM: HTMLElement[],
  comments: CommentWithPos[],
  view: EditorView,
  bottomBorder: number
) => {
  if (!commentsDOM.length) return;
  const editorScrollOffset = getScrollOffset();

  commentsDOM.forEach((comment, index) => {
    const { height: commentHeight } = comment.getBoundingClientRect();
    if (!comments[index] || view.state.doc.nodeSize < comments[index].pos) return;
    const desiredPos = calcDesiredPos(view, comments[index], editorScrollOffset);

    if (desiredPos + commentHeight > bottomBorder) {
      bottomBorder = bottomBorder - commentHeight - COMMENTS_SPACING;
      comment.style.top = `${bottomBorder}px`;
    } else {
      comment.style.top = `${desiredPos}px`;
      bottomBorder = desiredPos;
    }

    comment.style.right = `20px`;
  });
};

const calcDesiredPos = (view: EditorView, comment: CommentWithPos, editorScrollOffset: number) => {
  // If comment is in a codeblock get its pos from dom
  const commentCoords = getCommentCoords(view, comment);
  return commentCoords.top - EDITOR_TOP_OFFSET + editorScrollOffset;
};

const EDITOR_TOP_PADDING = 120;

export const scrollToCommentAnchor = (view: EditorView, pos: number, tr: Transaction, threadId: string) => {
  const editorScrollEl = getScrolledEditor();
  if (!editorScrollEl || view.state.doc.nodeSize < pos) return;

  const markElem = document.querySelector(`[id="${threadId}"].${COMMENT_MARK_CLASS}`) as HTMLSpanElement;
  const markTop = markElem.getBoundingClientRect().top;
  const commentAnchorTop = markTop + editorScrollEl.scrollTop;

  if (markTop > EDITOR_TOP_PADDING && markTop < window.innerHeight - EDITOR_TOP_PADDING) return;
  const scrollProps: ScrollToOptions = {
    top: commentAnchorTop - EDITOR_TOP_PADDING,
    behavior: 'smooth'
  };
  editorScrollEl.scrollTo(scrollProps);

  tr.setSelection(TextSelection.create(tr.doc, pos));
};

/**
 * return comments that should be rendered - not resolved, and mark is not hidden (hidden rows in tables)
 * @param comments
 * @param commentsRefs
 * @returns
 */
export const getVisibleComments = (comments: CommentWithPos[] | undefined) => {
  if (!comments) return [];

  let visibleComments: CommentWithPos[];

  // remove resolved Comments - wont have refs
  visibleComments = comments.filter((commentWithPos) => !commentWithPos.comment.resolved);

  // remove hidden comments - need to handle both comments and comments refs
  visibleComments = visibleComments.filter((commentWithPos) => {
    const commentMark = document.getElementById(commentWithPos.comment.id);
    // check if the mark is visible - if not remove him and his ref
    if (commentMark && !commentMark.offsetParent) {
      return false;
    }
    return true;
  });
  return visibleComments;
};

/**
 * Get the coords of the selection from the window
 * @returns DOMRect of the selection coords and false if failed
 */
export const getSelectionCoordsFromWindow = (): false | DOMRect => {
  const windowSelection = window.getSelection();
  if (!windowSelection) return false;
  if (!windowSelection.rangeCount) return false;
  const range = windowSelection.getRangeAt(0);
  const selectionRect = range.getClientRects()[0];
  if (!selectionRect) return false;
  return selectionRect;
};
