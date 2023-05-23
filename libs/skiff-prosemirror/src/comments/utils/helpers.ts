import { Mark, MarkType, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';

import { MARK_COMMENT } from '../../MarkNames';
import { ThreadAttrs } from '../../Types';
import { CommentWithPos } from '../comment.types';

/**
 * returns the attrs of the thread from a given node
 *
 * @param node node containing a comment mark
 * @param threadId the wanted thread id (each node can have more then one)
 * @param commentMarkType
 * @returns the thread attrs
 */
export const attrsFromNode = (node: ProsemirrorNode, threadId: string, commentMarkType: MarkType): ThreadAttrs =>
  node.marks.find((mark: Mark) => mark.type === commentMarkType && mark.attrs.comments.id === threadId)?.attrs
    .comments as ThreadAttrs;

/**
 * updates the mark related to the correct thread
 * on a given node
 *
 * @param tr
 * @param pos node pos
 * @param node
 * @param threadId the wanted thread to update
 * @param attrs the complete new attrs
 * @param commentMarkType
 */
export const updateMark = (
  tr: Transaction,
  pos: number,
  node: ProsemirrorNode,
  threadId: string,
  attrs: ThreadAttrs | null,
  commentMarkType: MarkType
) => {
  const markToRemove = node.marks.find(
    (mark) => mark.type.name === MARK_COMMENT && mark.attrs.comments?.id === threadId
  );
  if (!markToRemove) return;
  tr.removeMark(pos, node.nodeSize + pos, markToRemove);
  if (attrs) tr.addMark(pos, pos + node.nodeSize, commentMarkType.create({ comments: attrs }));
};

export const getCommentWithPosFromNodeWithPos = (
  commentsList: CommentWithPos[],
  nodeWithPos: NodeWithPos
): CommentWithPos[] => {
  const commentMarks = nodeWithPos.node.marks.filter((mark) => mark.type.name === MARK_COMMENT);

  commentMarks.forEach((commentMark) => {
    commentsList.push({
      pos: nodeWithPos.pos,
      node: nodeWithPos.node,
      comment: commentMark?.attrs.comments
    });
  });

  return commentsList;
};

export const getCommentsInDocument = (state: EditorState): [CommentWithPos[], CommentWithPos[]] => {
  const threadsWithoutId: CommentWithPos[] = [];
  const nodesWithPos = findChildrenByMark(state.doc, state.schema.marks[MARK_COMMENT]);
  const commentsMarks = nodesWithPos.reduce(getCommentWithPosFromNodeWithPos, []);
  const CommentMap = new Set();
  const comments = commentsMarks.filter((commentWithPos) => {
    if (!commentWithPos.comment.id) {
      threadsWithoutId.push(commentWithPos);
      return false;
    }
    if (CommentMap.has(commentWithPos.comment.id)) {
      return false;
    }
    CommentMap.add(commentWithPos.comment.id);
    return true;
  });

  return [comments, threadsWithoutId];
};
