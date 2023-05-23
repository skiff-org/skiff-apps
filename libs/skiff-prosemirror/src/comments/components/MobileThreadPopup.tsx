import { Drawer, Icon, IconButton, useOnClickOutside } from 'nightwatch-ui';
import { EditorView } from 'prosemirror-view';
import React, { useMemo, useRef } from 'react';
import { useTheme } from 'skiff-front-utils';

import { MARK_COMMENT } from '../../MarkNames';
import { MENTIONS_MENU_CLASS } from '../../mentionsMenu/EditorMentionsMenu';
import {
  activeThreadKey,
  closeEmptyThreadPopupKey,
  CommentPluginState,
  CommentWithPos,
  EditorNodeViews
} from '../comment.types';
import { getThreadNodeTextFromId, setActiveThread } from '../utils/thread';

import { COMMENT_MENU_CLASS_NAME, COMMENT_REACTIONS_CLASS_NAME } from './CommentMenu';
import Thread from './Thread';

export type MobileThreadPopupProps = {
  state: CommentPluginState;
  view: EditorView;
  comentEditorNodeViews: EditorNodeViews;
};

export const MobileThreadPopup: React.FunctionComponent<MobileThreadPopupProps> = (props) => {
  const { view, state, comentEditorNodeViews } = props;
  const { theme } = useTheme();
  // Handle outside clicks
  const wrapperRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  // memoize selection as long as the document is not changing
  const { id: threadId } = useMemo(
    () => (!state.activeThread ? { id: null } : state.activeThread),
    [state.activeThread]
  );

  const commentMarkType = view.state.schema.marks[MARK_COMMENT];
  // Array of Unresolved Thread in the current document
  const allUnresolvedThreads = useMemo(
    () => state.comments.filter((thread) => !thread.comment.resolved),
    [state.comments]
  );

  const getThreadIndex = (threadId: string[] | string | null) => {
    if (!threadId) return -1;
    const id = Array.isArray(threadId) ? threadId[0] : threadId;
    return allUnresolvedThreads.findIndex((thread) => thread.comment.id === id);
  };

  const currentThreadIndex = useMemo(() => getThreadIndex(threadId), [threadId]);

  const currentThread = useMemo(
    () => (currentThreadIndex !== -1 ? allUnresolvedThreads[currentThreadIndex] : undefined),
    [allUnresolvedThreads, currentThreadIndex]
  );

  const clickOutsideHandler = () => {
    const tr = view.state.tr.setMeta(closeEmptyThreadPopupKey, true);
    tr.setMeta(activeThreadKey, null);
    view.dispatch(tr);
  };
  useOnClickOutside(wrapperRef, clickOutsideHandler, [
    COMMENT_MENU_CLASS_NAME,
    COMMENT_REACTIONS_CLASS_NAME,
    MENTIONS_MENU_CLASS
  ]);

  const scrollToThread = (targetThread: CommentWithPos) => {
    const from = targetThread.pos;
    const to = from + targetThread.node.nodeSize;
    view.dispatch(setActiveThread(from, to, targetThread.comment.id, view.state.tr, view));
  };

  const title = `Thread ${currentThreadIndex + 1} of ${allUnresolvedThreads.length}`;

  return (
    <Drawer hideDrawer={clickOutsideHandler} show={true} title={title} showClose forceTheme={theme}>
      <div className='mobile-avoiding-keyboard' ref={wrapperRef}>
        <div style={{ display: 'flex', position: 'absolute', right: 42, top: 25 }}>
          <IconButton
            floatRight
            icon={Icon.ChevronUp}
            disabled={currentThreadIndex <= 0}
            onClick={() => {
              scrollToThread(allUnresolvedThreads[currentThreadIndex - 1]);
            }}
          />
          <IconButton
            floatRight
            icon={Icon.ChevronDown}
            disabled={currentThreadIndex + 1 >= allUnresolvedThreads.length}
            onClick={() => {
              scrollToThread(allUnresolvedThreads[currentThreadIndex + 1]);
            }}
          />
        </div>

        <Thread
          noBorder
          nodeRefText={
            currentThread ? getThreadNodeTextFromId(view, currentThread.comment.id, commentMarkType) : undefined
          }
          active
          comments={currentThread?.comment}
          commentMarkType={commentMarkType}
          view={view}
          comentEditorNodeViews={comentEditorNodeViews}
          className={'comments-thread-mobile'}
        />
      </div>
    </Drawer>
  );
};
