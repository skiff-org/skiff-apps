import { Icon, Icons, Typography, useOnClickOutside } from '@skiff-org/skiff-ui';
import clone from 'lodash/clone';
import { EditorView } from 'prosemirror-view';
import React, { FC, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { MARK_COMMENT } from '../../MarkNames';
import { MENTIONS_MENU_CLASS } from '../../mentionsMenu/EditorMentionsMenu';
import { getCustomState } from '../../skiffEditorCustomStatePlugin';
import {
  activeThreadKey,
  closeEmptyThreadPopupKey,
  CommentPluginState,
  CommentWithPos,
  EditorNodeViews
} from '../comment.types';
import { getCommentCoords } from '../utils/comment';
import {
  CommentsPositionEmitter,
  getVisibleComments,
  positionComments,
  scrollToCommentAnchor
} from '../utils/FloatingThreads';
import { ScreenSizes, useScreenSize } from '../utils/ScreenSizes';
import { checkIfThreadUnreadById, getThreadNodeTextFromId } from '../utils/thread';

import { COMMENT_MENU_CLASS_NAME, COMMENT_REACTIONS_CLASS_NAME } from './CommentMenu';
import Thread from './Thread';

interface FloatingThreadIconProps {
  commentCount: number;
  unread: boolean;
}

const FloatingThreadCounter: FC<FloatingThreadIconProps> = ({ commentCount, unread }) => {
  // Don't show the counter if there are no comments or if device is mobile
  if (commentCount === 0 || isMobile) return null;

  return (
    <div className='comments-floating-icon'>
      <Icons icon={Icon.Comment} color={unread ? 'orange' : 'secondary'} />
      <Typography mono uppercase color={unread ? 'orange' : 'secondary'}>
        {commentCount}
      </Typography>
    </div>
  );
};

type FloatingThreadProps = CommentWithPos & {
  view: EditorView;
  onClick: MouseEventHandler;
  active: boolean;
  setCommentRef: (commentId: string, pos: number, commentDOM: HTMLElement | null) => void;
  comentEditorNodeViews: EditorNodeViews;
};

const FloatingThread: FC<FloatingThreadProps> = ({
  pos,
  comment,
  view,
  onClick,
  active,
  setCommentRef,
  comentEditorNodeViews
}) => {
  const ref = useRef(null);
  const commentMarkType = view.state.schema.marks[MARK_COMMENT];

  // handle Refs sets
  useEffect(() => {
    if (ref.current) setCommentRef(comment.id, pos, ref.current);
    return () => {
      setCommentRef(comment.id, pos, null);
    };
  }, [comment.id, pos, setCommentRef]);

  const clickOutsideHandler = () => {
    if (!active) return;
    const tr = view.state.tr.setMeta(closeEmptyThreadPopupKey, true);
    tr.setMeta(activeThreadKey, null);
    view.dispatch(tr);
    CommentsPositionEmitter.emit('position-comments');
  };

  useOnClickOutside(ref, clickOutsideHandler, [
    COMMENT_MENU_CLASS_NAME,
    COMMENT_REACTIONS_CLASS_NAME,
    MENTIONS_MENU_CLASS
  ]);

  if (pos > view.state.doc.content.size) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      ref={ref}
      className='floating-comment'
      style={{
        position: 'absolute',
        right: 20,
        transition: 'top 0.4s ease-out, right 0.2s ease-out'
      }}
    >
      <Thread
        active={active}
        commentMarkType={commentMarkType}
        comments={comment}
        nodeRefText={getThreadNodeTextFromId(view, comment.id, commentMarkType)}
        view={view}
        className='floating-thread'
        comentEditorNodeViews={comentEditorNodeViews}
      />
    </div>
  );
};

type FloatingCommentsProps = {
  state: CommentPluginState;
  view: EditorView;
  comentEditorNodeViews: EditorNodeViews;
};

export interface RefAndPos {
  ref: HTMLElement;
  pos: number;
}

export const FloatingComments: React.FunctionComponent<FloatingCommentsProps> = ({
  view,
  state,
  comentEditorNodeViews
}) => {
  const commentMarkType = view.state.schema.marks[MARK_COMMENT];
  const { isPublicDocument } = getCustomState(view.state);

  const [commentsRefs, setCommentsRefs] = useState<{ [key: string]: RefAndPos }>({}); // all comments DOMs, used to calc positions
  const screenSize = useScreenSize();

  const comments = state?.comments;
  const visibleComments = useMemo(() => getVisibleComments(comments), [comments, commentsRefs]);

  const aggregateComments = useCallback(() => {
    if (!visibleComments.length) return [];
    // filter resolved thread shouldnt show as floating
    let aggregated: CommentWithPos[][] = [[comments[0]]];
    let currentIndex = 0;
    visibleComments.slice(1).forEach((currentComment) => {
      const lastComment = aggregated[currentIndex][0];
      try {
        const lastTop = getCommentCoords(view, lastComment).top;
        const currentTop = getCommentCoords(view, currentComment).top;
        if (Math.abs(lastTop - currentTop) < 1) {
          aggregated[currentIndex].unshift(currentComment);
        } else {
          aggregated = [...aggregated, [currentComment]];
          currentIndex += 1;
        }
      } catch (error) {
        //positions problem
      }
    });
    return aggregated;
  }, [comments, view, visibleComments]);

  const aggregatedComments = useMemo(() => aggregateComments(), [aggregateComments]);

  const updateCommentsPosition = useCallback(
    (forcedActiveThreadIndex?: number) => {
      // filter resolved thread shouldnt show as floating
      if (screenSize === ScreenSizes.Small) {
        const flatAgg = aggregatedComments.map((commentsArr) => commentsArr[0]);
        const activeThreadIndex = aggregatedComments.findIndex((comments) =>
          comments.some((comment) => state.activeThread?.id.includes(comment.comment.id))
        );

        const focusedCommentIndex = forcedActiveThreadIndex || activeThreadIndex;
        positionComments(commentsRefs, flatAgg, view, focusedCommentIndex);
      } else {
        const activeThreadIndex = visibleComments.findIndex((comment) =>
          state.activeThread?.id.includes(comment.comment.id)
        );
        const focusedCommentIndex = forcedActiveThreadIndex || activeThreadIndex;
        positionComments(commentsRefs, visibleComments, view, focusedCommentIndex);
      }
    },
    [aggregatedComments, commentsRefs, screenSize, state.activeThread?.id, view, visibleComments]
  );

  // clear previous listeners
  CommentsPositionEmitter.removeAllListeners();

  // handle force update form emitter
  CommentsPositionEmitter.on('position-comments', (forcedActiveThreadIndex?: number) => {
    setTimeout(() => updateCommentsPosition(forcedActiveThreadIndex), 0);
  });

  // set comments refs by their orders in the document
  const commentsRefsSetter = useCallback(
    (commentId: string, pos: number, ref: HTMLElement | null) => {
      // update ref only if the his position has changed
      setCommentsRefs((oldRefs) => {
        if (
          oldRefs[commentId]?.pos === pos && // same position in the document
          oldRefs[commentId].ref.isConnected // connected to the DOM
        )
          return oldRefs;

        const newRefs = clone(oldRefs);
        if (!ref) {
          delete newRefs[commentId];
        } else {
          newRefs[commentId] = { ref, pos };
        }

        // clean unused refs
        Object.keys(newRefs).forEach((id) => {
          if (!comments.find((comment) => comment.comment.id === id)) {
            delete newRefs[id];
          }
        });

        return newRefs;
      });
    },
    [comments]
  );

  // update comments position - should be triggered when the refs changes
  useEffect(() => {
    updateCommentsPosition();
  }, [commentsRefs, updateCommentsPosition]);

  const onAggregatedClick = useCallback(
    (commentsWithPos: CommentWithPos[]) => {
      const { tr } = view.state;
      tr.setMeta(activeThreadKey, {
        from: commentsWithPos[0].pos,
        to: commentsWithPos[0].pos + commentsWithPos[0].node.nodeSize - 1,
        id: commentsWithPos.map(({ comment }) => comment.id)
      });
      view.dispatch(tr);
      // scroll to node
      scrollToCommentAnchor(view, commentsWithPos[0].pos, tr, commentsWithPos[0].comment.id);
      setTimeout(() => CommentsPositionEmitter.emit('position-comments'));
    },
    [view]
  );

  const onFloatingThreadClick = useCallback(
    (commentID) => {
      const focusedCommentIndex = comments.findIndex((comment) => commentID === comment.comment.id);
      if (focusedCommentIndex === -1) return;
      const { tr } = view.state;
      tr.setMeta(activeThreadKey, {
        from: comments[focusedCommentIndex].pos,
        to: comments[focusedCommentIndex].pos + comments[focusedCommentIndex].node.nodeSize - 1,
        id: [commentID]
      });
      view.dispatch(tr);
      // // scroll to node
      scrollToCommentAnchor(view, comments[focusedCommentIndex].pos, tr, comments[focusedCommentIndex].comment.id);
      setTimeout(() => CommentsPositionEmitter.emit('position-comments', focusedCommentIndex));
    },
    [comments, view]
  );

  return (
    // TODO: change comment.comment
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 10
      }}
    >
      {screenSize === ScreenSizes.Large && !isPublicDocument
        ? visibleComments.map(
            (comment: CommentWithPos) =>
              !comment.comment.resolved && (
                <FloatingThread
                  active={state.activeThread?.id[0] === comment.comment.id}
                  {...comment}
                  key={comment.comment.id}
                  onClick={() => onFloatingThreadClick(comment.comment.id)}
                  setCommentRef={commentsRefsSetter}
                  view={view}
                  comentEditorNodeViews={comentEditorNodeViews}
                />
              )
          )
        : aggregatedComments.map((commentsWithPos: CommentWithPos[]) => (
            <div
              key={commentsWithPos[0] && commentsWithPos[0].comment.id}
              ref={(ref) => {
                commentsRefsSetter(commentsWithPos[0].comment.id, commentsWithPos[0].pos, ref);
              }}
              style={{
                position: 'absolute',
                right: 20,
                zIndex: 9,
                transition: 'top 0.4s ease-out, right 0.2s ease-out'
              }}
              onClick={() => {
                if (commentsWithPos.length === 1) onFloatingThreadClick(commentsWithPos[0].comment.id);
                else onAggregatedClick(commentsWithPos);
              }}
            >
              <FloatingThreadCounter
                commentCount={commentsWithPos.reduce(
                  (sum, comment) => (sum += !comment.comment.resolved ? comment.comment.thread.length : 0),
                  0
                )}
                unread={commentsWithPos.some((comment) =>
                  checkIfThreadUnreadById(view, comment.comment.id, commentMarkType)
                )}
              />
            </div>
          ))}
    </div>
  );
};
