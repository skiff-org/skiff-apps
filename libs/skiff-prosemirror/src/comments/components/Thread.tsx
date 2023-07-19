import '../../ui/comments.css';
import '../../ui/emoji-mart-styles.css';

import { Icon, Icons, Typography, useOnClickOutside } from '@skiff-org/skiff-ui';
import cx from 'classnames';
import { MarkType } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { getCustomState } from '../../skiffEditorCustomStatePlugin';
import { CommentAttr, ProsemirrorDocJson, ThreadAttrs } from '../../Types';
import { scrollToBottomOfElement } from '../../utils/scrollController';
import { EditorNodeViews } from '../comment.types';
import useDraft from '../hooks/useDraft';
import { addCommentById, toggleCommentReactionByIds, updateCommentByIds } from '../utils/comment';
import { CommentsPositionEmitter } from '../utils/FloatingThreads';
import { commentMenuActions, threadMenuActions } from '../utils/menuActions';
import {
  checkIfThreadUnreadByAttrs,
  clearCommentDraft,
  createThreadWithComment,
  toggleResolvedById,
  updateLastReadThreadById
} from '../utils/thread';

import Comment from './Comment';
import CommentMenu, { COMMENT_REACTIONS_CLASS_NAME } from './CommentMenu';
import { ThreadInput } from './ThreadInput';

interface ThreadProps {
  active: boolean;
  comments?: ThreadAttrs;
  nodeRefText?: string;
  commentMarkType: MarkType;
  view: EditorView;
  noBorder?: boolean;
  className?: string;
  fold?: boolean;
  enableScroll?: boolean;
  comentEditorNodeViews: EditorNodeViews;
}

const CLOSE_COMMENT_INTERVAL = 1000 * 60; // 1 minute
const SCROLL_TO_BOTTOM_OFFSET = 50;

const Thread: FC<ThreadProps> = ({
  comments,
  active,
  nodeRefText,
  view,
  commentMarkType,
  noBorder = false,
  className = '',
  fold = true,
  enableScroll = true,
  comentEditorNodeViews
}) => {
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [folded, setFolded] = useState(true);

  const { currentUser, theme, setConfirmState } = getCustomState(view.state);

  const { draft, updateDraft, clearDraft } = useDraft(view);

  const [editing, setEditing] = useState<string | null>(
    draft?.threadId === comments?.id && draft?.commentId ? draft.commentId : null
  );

  useOnClickOutside(
    threadContainerRef,
    () => {
      setEditing(null);
    },
    [COMMENT_REACTIONS_CLASS_NAME],
    undefined,
    undefined,
    isMobile
  );

  const onAddComment = useCallback(
    (commentInput: ProsemirrorDocJson, textContent: string) => {
      if (!commentInput) return null;
      clearDraft();

      let threadID;
      if (comments && comments.thread.length) {
        threadID = addCommentById(view, commentInput, textContent, comments.id, commentMarkType);
      } else {
        threadID = createThreadWithComment(view, commentInput, textContent, commentMarkType);
      }
      //Timeout so it will scroll only after comment added to dom
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);

      return threadID;
    },
    [clearDraft, commentMarkType, comments, view]
  );

  const getMergeType = useCallback((thread: CommentAttr[], index: number) => {
    if (index === 0) return [false, false];
    return [
      thread[index].userID === thread[index - 1].userID,
      thread[index].time - thread[index - 1].time < CLOSE_COMMENT_INTERVAL
    ];
  }, []);

  const unRead = useMemo(() => {
    if (!comments || !comments.id) return false;
    return checkIfThreadUnreadByAttrs(view.state, comments);
  }, [comments, view]);

  useEffect(() => {
    if (!active || !comments || !comments.id || !unRead) return;
    updateLastReadThreadById(view, comments.id, commentMarkType);
  }, [active, commentMarkType, comments, currentUser.userID, view, unRead]);

  const threadClassName = cx(
    'comments-thread',
    !noBorder && unRead ? 'unread' : undefined,
    noBorder ? 'no-border' : undefined,
    active ? 'active' : undefined,
    comments ? undefined : 'empty',
    enableScroll ? undefined : 'no-scroll',
    className
  );

  useEffect(() => {
    CommentsPositionEmitter.emit('position-comments');
  }, [folded]);

  const commentsToDisplay = (comments && comments.thread) || [];
  useEffect(() => {
    if (!scrollRef.current) return;
    // if the user is scrolled at the end of the thread scroll to the bottom of the thread
    if (
      scrollRef.current.scrollTop >=
        scrollRef.current.scrollHeight - scrollRef.current.offsetHeight - SCROLL_TO_BOTTOM_OFFSET &&
      !editing // make sure not to scroll while editing
    ) {
      setTimeout(() => scrollToBottomOfElement(scrollRef.current));
    }
  }, [commentsToDisplay.length, editing]);

  const { triggerToast, useDocumentCollabDisplayNames, docID, isPublicDocument } = getCustomState(view.state);
  const { collabsDisplayName } = useDocumentCollabDisplayNames(docID!);

  useEffect(() => {
    const customState = getCustomState(view.state);
    if (!customState.collabsDisplayNamesMap && collabsDisplayName) {
      customState.collabsDisplayNamesMap = collabsDisplayName;
      // not initialize display names yet - trigger an empty tr once ready
      const { dispatch } = view;
      dispatch(view.state.tr);
    }
  }, [collabsDisplayName, view]);

  useEffect(() => {
    if (!fold) {
      setFolded(false);
      return;
    }

    setFolded(!folded && active ? false : commentsToDisplay.length > 5);
  }, [active, comments?.thread, commentsToDisplay.length, fold, folded]);

  const [isInputFocus, setIsInputFocus] = useState(false);
  const onFocus = useCallback(() => {
    setIsInputFocus(true);
  }, []);
  const onBlur = useCallback(() => {
    setIsInputFocus(false);
  }, []);
  // When the input is focused we can infer that the mobile keyboard is open
  const mobileAndKeyboardOpen = isInputFocus && isMobile;
  const commentsScrollClass = cx(
    'comments-scroll',
    mobileAndKeyboardOpen ? 'comments-scroll-mobile-keyboard' : undefined
  );

  return (
    <div className={threadClassName} ref={threadContainerRef}>
      {comments && (
        <>
          <div className='thread-header'>
            {nodeRefText && (
              <span className='comment-node-ref'>
                <Icons icon={Icon.ChevronRight} color='orange' />
                <Typography mono uppercase>
                  {nodeRefText}
                </Typography>
              </span>
            )}
            <CommentMenu
              actions={threadMenuActions(
                view,
                commentMarkType,
                comments.id,
                triggerToast,
                setConfirmState,
                !currentUser.userID
              )}
              onResolved={
                !comments.resolved && currentUser.userID
                  ? () => {
                      threadContainerRef.current?.classList.add('resolved');
                      setTimeout(() => {
                        //Wait for animation
                        CommentsPositionEmitter.emit('position-comments');
                        toggleResolvedById(view, comments.id, commentMarkType, true);
                      }, 200);
                    }
                  : undefined
              }
              onlyOnHover={false}
              theme={theme}
              badge={
                comments.resolved
                  ? { text: 'Resolved', color: 'var(--cta-primary-disabled)' }
                  : unRead && noBorder
                  ? { text: 'New', color: 'var(--comments-accent)' }
                  : undefined
              }
            />
          </div>

          <div className={commentsScrollClass} ref={scrollRef}>
            {commentsToDisplay &&
              commentsToDisplay.map((comment, index) => {
                const firstComment = index === 0;
                const afterFolding = index === commentsToDisplay.length - 3 && folded;
                if (folded && !firstComment && index < commentsToDisplay.length - 3) return;
                const [sameUser, closeToLastCommentTime] = getMergeType(comments.thread, index);
                return (
                  <Fragment key={comment.id}>
                    <Comment
                      disabled={comments.resolved}
                      collabsDisplayNamesMap={collabsDisplayName}
                      theme={theme}
                      actions={commentMenuActions(
                        view,
                        commentMarkType,
                        comments.id,
                        comment.id || '',
                        () => {
                          setEditing(comment.id || '');
                        },
                        triggerToast,
                        setConfirmState,
                        !currentUser.userID
                      )}
                      comment={comment}
                      editElement={
                        editing === comment.id ? (
                          <ThreadInput
                            onChange={(content) => {
                              if (!content) {
                                return clearDraft();
                              }
                              updateDraft({ content, threadId: comments.id, commentId: comment.id });
                            }}
                            theme={theme}
                            onAddComment={(newComment) => {
                              updateCommentByIds(view, comments.id, comment.id || '', newComment, commentMarkType);
                              // clearCommentDraft dispatches a transaction with old state not the state after updateComment have finished.
                              // This should not be possible, this should be all serialized execution, further investigation needed
                              setTimeout(() => clearCommentDraft(view), 0);
                              setEditing(null);
                              return comments.id;
                            }}
                            startingValue={
                              draft?.threadId === comments.id && draft.commentId === comment.id
                                ? draft.content
                                : comment.content
                            }
                            active={active}
                            state={view.state}
                            comentEditorNodeViews={comentEditorNodeViews}
                            onFocus={onFocus}
                            onBlur={onBlur}
                          />
                        ) : undefined
                      }
                      hideHeader={!afterFolding && sameUser && closeToLastCommentTime && !firstComment}
                      showAvatar={afterFolding || !sameUser || firstComment}
                      onReaction={(id) => {
                        toggleCommentReactionByIds(view, comments.id, comment.id || '', id, commentMarkType);
                      }}
                      currentUser={currentUser.userID}
                      name={comment.name}
                    />
                    {folded && firstComment && (
                      <div
                        onClick={() => {
                          setFolded(false);
                        }}
                        className='comment-fold'
                      >
                        <Typography mono uppercase color='link'>
                          {commentsToDisplay.length - 4} replies
                        </Typography>
                      </div>
                    )}
                  </Fragment>
                );
              })}
          </div>
        </>
      )}
      {active && !editing && view.editable && !comments?.resolved && (
        <ThreadInput
          onChange={(content) => {
            if (content === null) return clearDraft();
            if (comments?.id) updateDraft({ content, threadId: comments.id });
          }}
          onAddComment={onAddComment}
          active={active}
          firstComment={comments?.thread.length === 0 || !comments?.thread}
          theme={theme}
          state={view.state}
          startingValue={draft && draft.threadId === comments?.id && !draft.commentId ? draft.content : undefined}
          comentEditorNodeViews={comentEditorNodeViews}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
    </div>
  );
};

// TODO: maybe its possible to move the memo up the tree, should wrap the first component that can be fully functional without the editorView
export default React.memo(Thread);
