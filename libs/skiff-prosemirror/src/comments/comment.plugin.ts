import isEqual from 'lodash/isEqual';
import { EditorState, Plugin } from 'prosemirror-state';
import { findChildrenByMark, NodeWithPos } from 'prosemirror-utils';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

import { MARK_COMMENT } from '../MarkNames';
import { getCustomState } from '../skiffEditorCustomStatePlugin';
import { CommentAttr } from '../Types';

import {
  activeThreadKey,
  closeEmptyThreadPopupKey,
  commentPluginKey,
  CommentPluginState,
  CommentWithPos,
  openEmptyThreadPopupKey,
  toggleShowResolvedKey,
  updateDraftKey
} from './comment.types';
import { COMMENT_MARK_ACTIVATED_CLASS, COMMENT_MARK_CLASS } from './CommentMarkSpec';
import { handleCommentMarkClick } from './utils/comment';
import { CommentsPositionEmitter } from './utils/FloatingThreads';
import { removeThreadByNodes } from './utils/thread';

const getCommentWithPosFromNodeWithPos = (
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

const getCommentsInDocument = (state: EditorState): [CommentWithPos[], CommentWithPos[]] => {
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
class UpdateCommentsPosition {
  update(view: EditorView, prevState: EditorState) {
    const [comments, commentsWithoutId] = getCommentsInDocument(view.state);

    if (commentsWithoutId.length) {
      // Because of very bad bug of missing id on thread what also cause an override of threads
      // We decided to remove all threads that dont have id and we are not sure where locate them
      // TODO: Remove on some point
      console.error('Found threads without id, remove them. ', commentsWithoutId);
      const { dispatch } = view;
      const { tr } = view.state;
      removeThreadByNodes(commentsWithoutId, tr, view.state.schema.marks[MARK_COMMENT]);
      dispatch(tr);
    }
    const prevComments = commentPluginKey.getState(prevState)?.comments;

    // update if comments has changed
    if (!isEqual(comments, prevComments)) {
      CommentsPositionEmitter.emit('position-comments');
    }
  }
}

export class CommentPopupPlugin extends Plugin<CommentPluginState> {
  constructor() {
    super({
      key: commentPluginKey,
      view: () => new UpdateCommentsPosition(),
      state: {
        init() {
          return {
            open: false,
            activeThread: null,
            comments: [],
            showResolved: false,
            draft: null
          };
        },
        apply(tr, { open, activeThread, showResolved, draft }, oldState, newState): CommentPluginState {
          const setActiveThread = tr.getMeta(activeThreadKey);
          const updateDraft = tr.getMeta(updateDraftKey);
          const openEmptyThreadPopup = tr.getMeta(openEmptyThreadPopupKey);
          const closeCommentDialog = tr.getMeta(closeEmptyThreadPopupKey);

          const commentMarkType = oldState.schema.marks[MARK_COMMENT];

          const newShowResolved =
            tr.getMeta(toggleShowResolvedKey) !== undefined ? tr.getMeta(toggleShowResolvedKey) : showResolved;

          open = (open || openEmptyThreadPopup) && !closeCommentDialog;

          if (updateDraft !== undefined) {
            draft = updateDraft;
          }

          if (setActiveThread !== undefined) {
            activeThread = setActiveThread;
          }

          if (openEmptyThreadPopup) {
            activeThread = null;
          }

          let [comments] = getCommentsInDocument(newState);
          const { collabsDisplayNamesMap } = getCustomState(oldState);

          comments = comments
            .map((commentWithPos) =>
              commentWithPos.node.marks
                .filter((mark) => mark.type === commentMarkType)
                .map((mark) => ({
                  ...commentWithPos,
                  comment: {
                    ...mark.attrs.comments,
                    thread: mark.attrs.comments.thread.map((comment: CommentAttr) => ({
                      ...comment,
                      name: comment.userID
                        ? (collabsDisplayNamesMap || {})[comment.userID] || comment.name
                        : comment.name // Override commentor name with displayName
                    }))
                  }
                }))
            )
            .flat()
            .filter(
              // Remove duplicates with the same id
              (commentWithPos, index, flatComments) =>
                flatComments.findIndex(({ comment }) => comment.id === commentWithPos.comment.id) === index
            );

          return {
            activeThread,
            open,
            comments,
            draft,
            showResolved: newShowResolved
          };
        }
      },
      props: {
        handleClickOn(view, pos, node, nodePos, domEvent) {
          const { tr } = view.state;
          if (!(domEvent?.target instanceof HTMLElement)) {
            // When click is not on mark element
            return false;
          }

          const childrenWithCommentMarks = findChildrenByMark(node, view.state.schema.marks[MARK_COMMENT]);
          const nodeWithMark = childrenWithCommentMarks.find((child) => {
            const childPos = nodePos + child.pos;
            return childPos <= pos && childPos + child.node.nodeSize >= pos;
          });
          if (!nodeWithMark) return false;

          return handleCommentMarkClick(view, nodeWithMark, nodePos, tr);
        },
        handleDrop() {
          // emit position after drop has finished
          setTimeout(() => CommentsPositionEmitter.emit('position-comments'), 0);
          return false;
        },
        decorations(state) {
          const { activeThread } = this.getState(state);

          const decoration = [];

          if (activeThread) {
            // active thread
            decoration.push(
              Decoration.inline(activeThread.from, activeThread.to + 1, { class: COMMENT_MARK_ACTIVATED_CLASS })
            );
          }

          if (state && this.getState(state) && this.getState(state).open) {
            //comment creation decoration
            decoration.push(
              Decoration.inline(state.selection.from, state.selection.to, {
                class: COMMENT_MARK_CLASS
              })
            );
          }

          return DecorationSet.create(state.doc, decoration);
        }
      }
    });
  }
}
