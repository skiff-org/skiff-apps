import { MarkType } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { NodeWithPos } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { getCodeblockCommentRect, isInCodeblock } from '../../codeblock/utils';
import { MARK_COMMENT } from '../../MarkNames';
import { getCustomState } from '../../skiffEditorCustomStatePlugin';
import { CommentAttr, CommentReactions, ProsemirrorDocJson, ThreadAttrs } from '../../Types';
import CustomEditorView from '../../ui/CustomEditorView';
import uuid from '../../ui/uuid';
import { commentPluginKey, CommentWithPos } from '../comment.types';

import { CommentsPositionEmitter } from './FloatingThreads';
import { attrsFromNode, updateMark } from './helpers';
import { findThreadNodes, getThreadAttrsById, getThreadUsersIds, setActiveThread } from './thread';

/**
 * util function to toggle a reaction on a reactions object.
 *
 * if no reactions create new object,
 * if already reacted with that emoji removes the reaction
 *
 * @param reactions the reactions object
 * @param reactionId emoji unique id
 * @param userId reacting user
 * @returns
 */
const toggleReaction = (reactions: CommentReactions | undefined, reactionId: string, userId: string) => {
  const newReactions = { ...reactions };
  if (!reactions) return { [reactionId]: [userId] };
  if (!reactions[reactionId]) newReactions[reactionId] = [userId];
  else {
    if (newReactions[reactionId].includes(userId)) {
      newReactions[reactionId] = newReactions[reactionId].filter((id) => id !== userId);
      if (newReactions[reactionId].length === 0) delete newReactions[reactionId];
    } else newReactions[reactionId] = [...newReactions[reactionId], userId];
  }
  return newReactions;
};

/**
 * check if the current user is the creator of the comment
 *
 * @returns true if its the creator
 */
export const checkIfUserIsCommentCreator = (
  view: EditorView,
  threadId: string,
  commentId: string,
  commentMarkType: MarkType
): boolean => {
  const attrs = getThreadAttrsById(view.state.doc, commentMarkType, threadId);
  if (!attrs) return false; // cant find thread

  const { currentUser } = getCustomState(view.state);
  if (!currentUser || !currentUser.userID) return false; // anonymous user

  const correctComment = attrs.thread.find((comment) => comment?.id === commentId);
  if (!correctComment) return false; // cant find comment

  return correctComment.userID === currentUser.userID;
};

/**
 * check if the comment created by anonymous user
 *
 * @returns true if its anonymous
 */
export const checkIfAnonymousComment = (
  view: EditorView,
  threadId: string,
  commentId: string,
  commentMarkType: MarkType
): boolean => {
  const attrs = getThreadAttrsById(view.state.doc, commentMarkType, threadId);
  if (!attrs) return false; // cant find thread

  const correctComment = attrs.thread.find((comment) => comment?.id === commentId);
  if (!correctComment) return false; // cant find comment

  return !correctComment.userID;
};

/**
 * dispatches a transaction that updates all the thread marks
 *
 * sets the newComment as the content of that comment
 *
 * sets the comment state to edited=true
 *
 * updated the lastOpened to current time
 */
export const updateCommentByIds = (
  view: EditorView,
  threadId: string,
  commentId: string,
  newComment: ProsemirrorDocJson,
  commentMarkType: MarkType
) => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);

  const { currentUser } = getCustomState(view.state);
  if (!currentUser || !currentUser.userID) return;

  const updateTime = { [currentUser.userID]: Date.now() };

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs) return;
    const newAttrs = { ...attrs, lastOpened: { ...attrs.lastOpened, ...updateTime } };
    newAttrs.thread = attrs.thread.map((comment: CommentAttr) => {
      if (comment.id !== commentId || comment.userID !== currentUser.userID) return comment;
      return {
        ...comment,
        content: newComment,
        edited: true
      };
    });
    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });
  view.dispatch(tr);
};

/**
 * dispatches a transaction that toggles a reaction by id
 *
 * toggles the reaction on the comment
 *
 * updated the lastOpened to current time
 */
export const toggleCommentReactionByIds = (
  view: EditorView,
  threadId: string,
  commentId: string,
  reactionId: string,
  commentMarkType: MarkType
): void => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  const { currentUser } = getCustomState(view.state);
  if (!currentUser || !currentUser.userID) return;

  const reactionTime = { [currentUser.userID]: Date.now() };

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs) return;
    const newAttrs = { ...attrs, lastOpened: { ...attrs.lastOpened, ...reactionTime } };
    newAttrs.thread = attrs.thread.map((comment: CommentAttr) => {
      if (comment.id !== commentId) return comment;
      return {
        ...comment,
        reactions: toggleReaction(comment.reactions, reactionId, currentUser.userID)
      };
    });
    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });
  view.dispatch(tr);
};

/**
 * dispatches a transaction that removes a comment by its id, only if the current user is the comment writer
 *
 * removes the comment from the thread
 *
 * updated the lastOpened to current time
 */
export const removeCommentByIds = (
  view: EditorView,
  threadId: string,
  commentId: string,
  commentMarkType: MarkType
): void => {
  if (!(view instanceof CustomEditorView)) return;
  const {
    state: { tr }
  } = view;

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  const { currentUser } = getCustomState(view.state);

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs) return;
    const newAttrs = { ...attrs };
    newAttrs.thread = attrs.thread.filter(
      (comment: CommentAttr) => comment.id !== commentId || (comment.userID && comment.userID !== currentUser.userID)
    );
    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });
  view.dispatch(tr);
};

/**
 * Get coords of comment node
 * When comment is in code_block get rect from query selector
 * If not get coords from prosemirror
 */
export const getCommentCoords = (view: EditorView, comment: CommentWithPos) => {
  const isCommentInCodeBlock = isInCodeblock(view.state, comment.pos);
  if (isCommentInCodeBlock) {
    const commentRect = getCodeblockCommentRect(comment.comment.id);
    if (commentRect) {
      return commentRect;
    }
  }
  return view.coordsAtPos(comment.pos);
};

/**
 * adds a new comment to the thread
 *
 * dispatches the transaction and sets the thread active
 *
 * sends a notification to all the threads commenter
 *
 * @param comment first comment content
 */
export const addCommentById = (
  view: EditorView,
  newComment: ProsemirrorDocJson,
  textContent: string,
  threadId: string,
  commentMarkType: MarkType
): string | null => {
  // check for active editor and new comment string
  if (!newComment || !(view instanceof CustomEditorView)) return null;

  const {
    state: { tr }
  } = view;

  const { onComment, currentUser } = getCustomState(view.state);

  const threadNodes = findThreadNodes(tr.doc, commentMarkType, threadId);
  const creationTime = Date.now();
  const lastOpened = { [currentUser.userID]: creationTime };

  threadNodes.forEach(({ node, pos }) => {
    const attrs = attrsFromNode(node, threadId, commentMarkType);
    if (!attrs || attrs.resolved) return;

    const newAttrs: ThreadAttrs = {
      ...attrs,
      lastOpened: currentUser.userID ? { ...attrs.lastOpened, ...lastOpened } : { ...attrs.lastOpened },
      thread: [
        ...attrs.thread,
        {
          comment: textContent,
          content: newComment,
          name: currentUser.name,
          userID: currentUser.userID || null,
          time: creationTime,
          resolved: false,
          id: uuid()
        }
      ]
    };

    updateMark(tr, pos, node, threadId, newAttrs, commentMarkType);
  });

  // Send notification
  onComment(getThreadUsersIds(view.state.doc, commentMarkType, threadId), threadId);

  view.dispatch(tr);

  return threadId;
};

/**
 * Handle click on node with comment mark
 * @param view Editor view
 * @param nodeWithMark the comment node with mark
 * @param nodePos the nodes relative position
 * @param tr
 */
export const handleCommentMarkClick = (
  view: EditorView,
  nodeWithMark: NodeWithPos,
  nodePos: number,
  tr: Transaction<any>
) => {
  const showResolved = commentPluginKey.getState(view.state)?.showResolved;

  const commentMark = nodeWithMark.node.marks
    .filter((mark) => mark.type.name === MARK_COMMENT)
    .find((mark) => !mark.attrs.comments.resolved || showResolved);
  if (!commentMark) return false; // no thread

  const activeThread = commentPluginKey.getState(view.state)?.activeThread;

  if (activeThread?.id.includes(commentMark?.attrs.comments.id)) return false; // thread is already active

  setActiveThread(
    nodePos + nodeWithMark.pos + 1,
    nodePos + nodeWithMark.pos + nodeWithMark.node.nodeSize,
    commentMark.attrs.comments.id,
    tr,
    view,
    false
  );

  // fist handle the comments positions
  const activeThreadIndex = commentPluginKey
    .getState(view.state)
    ?.comments.findIndex((comment) => comment.comment.id === commentMark.attrs.comments.id);
  CommentsPositionEmitter.emit('position-comments', activeThreadIndex);

  // we set the timeout so this will be fired after the actual click event
  // should prevent useClickOutside hooks to deactivate the thread
  setTimeout(() => view.dispatch(tr), 0);
  return false;
};
