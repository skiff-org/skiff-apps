import { MarkType } from 'prosemirror-model';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { findChildrenByMark } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';
import { assertExists } from 'skiff-utils';

import { getCodeblockCommentRect, getMarkFromNode, isInCodeblock } from '../../codeblock/utils';
import { MARK_COMMENT } from '../../MarkNames';
import { MENTION } from '../../NodeNames';
import { getCustomState } from '../../skiffEditorCustomStatePlugin';
import { ProsemirrorDocJson, ThreadAttrs } from '../../Types';
import CustomEditorView from '../../ui/CustomEditorView';
import uuid from '../../ui/uuid';
import { activeThreadKey, closeEmptyThreadPopupKey, CommentWithPos, updateDraftKey } from '../comment.types';

import { EDITOR_TOP_OFFSET, getScrolledEditor, scrollToCommentAnchor } from './FloatingThreads';
import { attrsFromNode, updateMark } from './helpers';

/**
 * Returns all the comment nodes in the document with the same ID
 * @param doc Prosemirror Document
 * @param commentMarkType
 * @param commentId
 */
export const findThreadNodes = (doc: ProsemirrorNode<any>, commentMarkType: MarkType, threadId: string) => {
  const nodes = findChildrenByMark(doc, commentMarkType);
  return nodes.filter((nodeWithPos) =>
    nodeWithPos.node.marks.some((mark) => mark.type === commentMarkType && mark.attrs.comments.id === threadId)
  );
};

/**
 * returns the text content of the commented nodes (the selection content)
 */
export const getThreadNodeTextFromId = (view: EditorView, threadId: string, commentMarkType: MarkType): string => {
  const threadNodes = findThreadNodes(view.state.doc, commentMarkType, threadId);

  return threadNodes.reduce((threadNodeText, { node, pos }, index, allNodes) => {
    if (index !== 0) {
      const lastEnding = allNodes[index - 1].pos + allNodes[index - 1].node.nodeSize;
      if (lastEnding !== pos) {
        view.state.doc.nodesBetween(lastEnding, pos, (insideNode) => {
          threadNodeText += insideNode.type.name === MENTION ? insideNode.attrs.name : '';
          return true;
        });
      }
    }
    return (threadNodeText += node.type.name === MENTION ? node.attrs.name : node.text || '');
  }, '');
};

/**
 * returns a threads attrs from the document
 *
 * @param doc Prosemirror document
 * @param commentMarkType
 * @param threadId
 * @returns the thread attrs
 */
export const getThreadAttrsById = (
  doc: ProsemirrorNode<any>,
  commentMarkType: MarkType,
  threadId: string
): ThreadAttrs | undefined => {
  const threadNodes = findThreadNodes(doc, commentMarkType, threadId);
  if (!threadNodes || threadNodes.length === 0) return undefined;
  return attrsFromNode(threadNodes[0].node, threadId, commentMarkType);
};

/**
 * dispatches a transaction to update the draft state in the plugin
 * @param content the comment doc as a json
 * @param threadId
 * @param commentId if new comment -> undefined
 */
export const updateCommentDraft = (
  view: EditorView,
  content: ProsemirrorDocJson,
  threadId: string,
  commentId?: string
) => {
  const { tr } = view.state;
  tr.setMeta(updateDraftKey, {
    threadId,
    commentId,
    content
  });
  view.dispatch(tr);
};

/**
 * dispatches a transaction to clear the draft state in the plugin
 */
export const clearCommentDraft = (view: EditorView) => {
  const { tr } = view.state;
  tr.setMeta(updateDraftKey, null);
  view.dispatch(tr);
};

/**
 * returns all the users that commented in the thread
 *
 * @param doc Prosemirror document
 * @param commentMarkType
 * @param threadId
 * @returns an array userIds
 */
export const getThreadUsersIds = (doc: ProsemirrorNode<any>, commentMarkType: MarkType, threadId: string): string[] =>
  (getThreadAttrsById(doc, commentMarkType, threadId)?.thread || [])
    .map((comment) => comment.userID)
    .filter<string>((id): id is string => typeof id === 'string')
    .filter((id, index, allIds) => allIds.indexOf(id) === index);

/**
 * check if the thread is unread by the current user
 *
 * @returns true if unread
 */
export const checkIfThreadUnreadByAttrs = (state: EditorState, attrs: ThreadAttrs) => {
  try {
    const { currentUser } = getCustomState(state);
    // if logged from unidentified user - mark as read
    if (!currentUser || !currentUser.userID) return false;
    return attrs.thread[attrs.thread.length - 1].time > (attrs.lastOpened[currentUser.userID] || 0);
  } catch (err) {
    return false;
  }
};

/**
 * checks if the thread is resolved
 *
 * @returns true if resolved
 */
export const checkIfResolved = (view: EditorView, threadId: string, commentMarkType: MarkType): boolean => {
  const attrs = getThreadAttrsById(view.state.doc, commentMarkType, threadId);
  if (!attrs) return false; // cant find thread
  return !!attrs.resolved;
};

/**
 * checks if the thread contains only one comment
 *
 * @returns true if only one
 */
export const checkIfOnlySingleComment = (view: EditorView, threadId: string, commentMarkType: MarkType): boolean => {
  const attrs = getThreadAttrsById(view.state.doc, commentMarkType, threadId);
  if (!attrs) return false; // cant find thread
  return attrs.thread.length === 1;
};

/**
 * check if the thread is unread by the current user
 *
 * @returns true if unread
 */
export const checkIfThreadUnreadById = (view: EditorView, threadId: string, commentMarkType: MarkType): boolean => {
  const attrs = getThreadAttrsById(view.state.doc, commentMarkType, threadId);
  if (!attrs) return false; // cant find thread

  return checkIfThreadUnreadByAttrs(view.state, attrs);
};
/**
 * dispatches a transaction that sets the thread as unread for the current user
 *
 * removes the current user time from the lastOpened object
 *
 * closes the popup if open and makes no thread active
 */
export const markThreadUnreadById = (view: EditorView, threadId: string, commentMarkType: MarkType): void => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  const { currentUser } = getCustomState(view.state);
  if (!currentUser || !currentUser.userID) return;

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs) return;
    const newLastOpened = { ...attrs.lastOpened };
    delete newLastOpened[currentUser.userID];
    const newAttrs = { ...attrs, lastOpened: newLastOpened };
    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });

  tr.setMeta(closeEmptyThreadPopupKey, true);
  tr.setMeta(activeThreadKey, null);
  view.dispatch(tr);
};

/**
 * dispatches a transaction that sets the lastOpen of the current user to now
 */
export const updateLastReadThreadById = (view: EditorView, threadId: string, commentMarkType: MarkType): void => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  const { currentUser } = getCustomState(view.state);
  if (!currentUser || !currentUser.userID) return;

  const lastOpened = { [currentUser.userID]: Date.now() };

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs) return;
    const newAttrs = { ...attrs, lastOpened: { ...attrs.lastOpened, ...lastOpened } };
    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });
  view.dispatch(tr);
};

/**
 * dispatches a transaction that removes a thread by id
 *
 * removes the thread by id
 *
 * closes the popup if open and makes no thread active
 */
export const removeThreadById = (view: EditorView, threadId: string, commentMarkType: MarkType): void => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  threadNodes.forEach((nodeWithPos) => {
    const { pos, node } = nodeWithPos;
    updateMark(tr, pos, node, threadId, null, commentMarkType);
  });
  tr.setMeta(closeEmptyThreadPopupKey, true);
  tr.setMeta(activeThreadKey, null);
  view.dispatch(tr);
};

/**
 * DONT USE! use `removeThreadById` instead
 *
 * this will remove all the thread marks on the given nodes, even id there is some thread on this node.
 *
 * we use this only to clean the - "threads without id" BUG
 *
 * @param comments the nodes containing the comments
 */
export const removeThreadByNodes = (comments: CommentWithPos[], tr: Transaction, commentMarkType: MarkType) => {
  comments.forEach((comment) => {
    const { pos, node } = comment;
    tr = tr.removeMark(pos, pos + node.nodeSize, commentMarkType);
  });
  tr.setMeta(closeEmptyThreadPopupKey, true);
  tr.setMeta(activeThreadKey, null);
};

/**
 * creates a new thread on the current selection with `comment` as the first thread comment.
 *
 * dispatches the transaction and sets the thread active
 *
 * sends a notification to all document editors
 *
 * @param comment first comment content
 */
export const createThreadWithComment = (
  view: EditorView,
  comment: ProsemirrorDocJson,
  textContent: string,
  commentMarkType: MarkType
): string | null => {
  const { onComment, currentUser } = getCustomState(view.state);

  const creationTime = Date.now();

  const attrs: { comments: ThreadAttrs } = {
    comments: {
      id: uuid(),
      thread: [
        {
          index: 0,
          comment: textContent,
          content: comment,
          name: currentUser.name,
          userID: currentUser?.userID || null,
          time: creationTime,
          resolved: false,
          id: uuid(),
          edited: false
        }
      ],
      lastOpened: currentUser.userID ? { [currentUser.userID]: creationTime } : {}
    }
  };

  // Send notification
  onComment(undefined, attrs.comments.id);

  let tr = view.state.tr;
  const { from, to } = tr.selection;
  tr = tr.addMark(from, to, commentMarkType.create(attrs));
  tr.setMeta(activeThreadKey, {
    from: tr.selection.from,
    to: tr.selection.to,
    id: [attrs.comments.id]
  });
  tr.setMeta(closeEmptyThreadPopupKey, true);
  view.dispatch(tr);

  // when adding new comment its first positioned at the top of the document so the autoFocus scrolls the editor to the top
  // we set timeout to scroll down back to the comment
  setTimeout(() => {
    const editorScrollEl = getScrolledEditor();
    if (!editorScrollEl || view.state.doc.nodeSize < tr.selection.from) return;

    let commentAnchorTop: number | undefined;
    // When in codeblock, get pos from its id (because prosemirror cannot give accurate pos for codemirror nodes)
    if (isInCodeblock(view.state, tr.selection.from)) {
      const commentDOM = getCodeblockCommentRect(attrs.comments.id);
      commentAnchorTop = commentDOM?.top;
    }
    // If not in codeblock, or unable to get top in codeblock, get pos from prosemirror
    if (!commentAnchorTop) commentAnchorTop = view.coordsAtPos(tr.selection.from).top;

    assertExists(window.visualViewport);
    if (commentAnchorTop < EDITOR_TOP_OFFSET || commentAnchorTop > window.visualViewport.height) {
      const scrollProps: ScrollToOptions = {
        top: commentAnchorTop,
        behavior: 'auto'
      };
      editorScrollEl.scrollTo(scrollProps);
    }
  }, 0);

  return attrs.comments.id;
};

/**
 * dispatches a transaction that toggles the resolved state for a thread
 *
 * sets the new resolved state (forced or !lastState) and updates the lastOpened to current time
 *
 * closes the popup if open and makes no thread active
 *
 * @param force leave empty for toggle behavior
 */
export const toggleResolvedById = (view: EditorView, threadId: string, commentMarkType: MarkType, force?: boolean) => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;
  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  const { currentUser } = getCustomState(view.state);
  if (!currentUser || !currentUser.userID) return;

  const resolvedTime = { [currentUser.userID]: Date.now() };

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs) return;

    const newAttrs = {
      ...attrs,
      resolved: force !== undefined ? force : !attrs.resolved,
      lastOpened: { ...attrs.lastOpened, ...resolvedTime }
    };

    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });
  tr.setMeta(closeEmptyThreadPopupKey, true);
  tr.setMeta(activeThreadKey, null);
  view.dispatch(tr);
};

/**
 * Sets active thread to given threads id
noamgolani marked this conversation as resolved.
Show resolved
 *
 * @param from the start of the thread
 * @param to the end of the thread
 * @param id the id of the thread
 * @param tr the transaction to use
 * @param view EditorView
 * @param scrollIntoView true by default, scrolls to the new active thread
 */
export const setActiveThread = (
  from: number,
  to: number,
  id: string,
  tr: Transaction,
  view: EditorView,
  scrollIntoView = true
) => {
  // Scroll into view
  if (scrollIntoView) scrollToCommentAnchor(view, from, view.state.tr, id);
  // Set Active
  tr.setMeta(activeThreadKey, {
    from,
    to,
    id: [id]
  });
  return tr;
};

export const getCommentThreadRect = (
  view: EditorView,
  from: number,
  to: number,
  editorScrollOffset: number,
  windowSelectionCoords: DOMRect | false,
  THREAD_IN_CODEBLOCK_TOP_OFFSET: number,
  THREAD_IN_CODEBLOCK_LEFT_OFFSET: number
) => {
  // When selecting in codeblock get selection from coords from window selection
  // Because prosemirror cant get coords on codemirror nodes
  const isInCodeBlock = isInCodeblock(view.state, from);
  const selectedNode = view.state.doc.nodeAt(from);
  const commentMark = selectedNode && getMarkFromNode(selectedNode, MARK_COMMENT); // the comment mark of the selected node

  // When selection is in codeblock
  if (isInCodeBlock && commentMark) {
    // If the node already has a comment mark, get its position from the mark
    const commentRect = getCodeblockCommentRect(commentMark.attrs.comments.id);
    if (commentRect) {
      return {
        top: commentRect.top + editorScrollOffset,
        bottom: commentRect.bottom + editorScrollOffset,
        left: commentRect.left,
        right: commentRect.right,
        height: commentRect.height,
        width: commentRect.width
      };
    }
  }
  if (isInCodeBlock && typeof windowSelectionCoords !== 'boolean') {
    // If not get its position from the window selection coords
    return {
      top: windowSelectionCoords.top + editorScrollOffset + THREAD_IN_CODEBLOCK_TOP_OFFSET,
      bottom: windowSelectionCoords.bottom + editorScrollOffset + THREAD_IN_CODEBLOCK_TOP_OFFSET,
      left: windowSelectionCoords.left + THREAD_IN_CODEBLOCK_LEFT_OFFSET,
      right: windowSelectionCoords.right + THREAD_IN_CODEBLOCK_LEFT_OFFSET,
      height: windowSelectionCoords.top - windowSelectionCoords.bottom
    };
  }
  // For all other cases get coords from prosemirror
  const fromCoords = view.coordsAtPos(from);
  const toCoords = view.coordsAtPos(to);
  return {
    top: fromCoords.top + editorScrollOffset,
    bottom: toCoords.bottom + editorScrollOffset,
    left: fromCoords.left,
    right: toCoords.right,
    height: toCoords.bottom - fromCoords.top,
    width: fromCoords.right - fromCoords.left
  };
};
