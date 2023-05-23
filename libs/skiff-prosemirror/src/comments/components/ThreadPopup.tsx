import { Divider, useOnClickOutside } from 'nightwatch-ui';
import { EditorView } from 'prosemirror-view';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { MARK_COMMENT } from '../../MarkNames';
import { MENTIONS_MENU_CLASS } from '../../mentionsMenu/EditorMentionsMenu';
import { getCustomState } from '../../skiffEditorCustomStatePlugin';
import { activeThreadKey, closeEmptyThreadPopupKey, CommentPluginState, EditorNodeViews } from '../comment.types';
import {
  CommentsPositionEmitter,
  getScrolledEditor,
  getScrollOffset,
  getSelectionCoordsFromWindow
} from '../utils/FloatingThreads';
import { ScreenSizes, useScreenSize } from '../utils/ScreenSizes';
import { getCommentThreadRect, getThreadNodeTextFromId } from '../utils/thread';

import { COMMENT_MENU_CLASS_NAME, COMMENT_REACTIONS_CLASS_NAME } from './CommentMenu';
import Thread from './Thread';

export type ThreadPopupProps = {
  state: CommentPluginState;
  view: EditorView;
  comentEditorNodeViews: EditorNodeViews;
};

const UPWARD_POPUP_OFFSET = 80; //px
const MAX_TOP_OFFSET = 100; //px
const THREAD_IN_CODEBLOCK_TOP_OFFSET = 60; //px
const THREAD_IN_CODEBLOCK_LEFT_OFFSET = 30; //px

export const ThreadPopup: React.FunctionComponent<ThreadPopupProps> = ({ view, state, comentEditorNodeViews }) => {
  const commentPopupRef = useRef<HTMLDivElement>(null);
  // Comment popup for texts that located close to the right/bottom edge of the screen should handle different
  const [deviateFromRight, setDeviateFromRight] = useState<boolean>(false);
  const [deviateFromBottom, setDeviateFromBottom] = useState<boolean>(false);
  const editorScrollOffset = getScrollOffset();
  const { isPublicDocument } = getCustomState(view.state);

  // memoize selection as long as the document is not changing
  const {
    from,
    to,
    windowSelectionCoords,
    id: threadId
  } = useMemo(() => {
    if (!state.activeThread)
      return {
        from: view.state.selection.$from.pos,
        to: view.state.selection.$to.pos,
        id: null,
        windowSelectionCoords: getSelectionCoordsFromWindow()
      };
    else return { ...state.activeThread, windowSelectionCoords: getSelectionCoordsFromWindow() };
  }, [state.activeThread, view.state.selection]);
  const [openThread, setOpenThread] = useState(0);

  const commentMarkType = view.state.schema.marks[MARK_COMMENT];

  const commentRect = useMemo(
    () =>
      getCommentThreadRect(
        view,
        from,
        to,
        editorScrollOffset,
        windowSelectionCoords,
        THREAD_IN_CODEBLOCK_TOP_OFFSET,
        THREAD_IN_CODEBLOCK_LEFT_OFFSET
      ),
    [to, from, view, editorScrollOffset]
  );

  const threads = useMemo(() => {
    if (!threadId) return;
    else return state.comments.filter(({ comment }) => threadId.includes(comment.id)).map(({ comment }) => comment);
  }, [state.comments, threadId]);
  const link = window.document.getElementsByClassName('skiff-link-tooltip-body')[0];
  const linkPopupOffset = link ? 44 : 0;
  const editorContainer = getScrolledEditor()?.getBoundingClientRect();
  const calculatedTop = commentRect.bottom - (editorContainer?.top || 0);
  // linkPopupOffset is needed when the commented text is commented and a link in which case the unlink popup will cover this popup
  const calculatedBottom =
    (getScrolledEditor()?.scrollHeight || 0) - (commentRect.top - UPWARD_POPUP_OFFSET - linkPopupOffset);

  const marginLeft = commentRect.left - (editorContainer?.left || 0);

  useEffect(() => {
    if (!commentPopupRef.current) return;
    const { width: popupWidth, height: popupHight } = commentPopupRef.current.getBoundingClientRect();
    const screenHeight = window.innerHeight;

    setDeviateFromRight(popupWidth + (editorContainer?.left || 0) + marginLeft > (editorContainer?.right || 0));
    setDeviateFromBottom(
      popupHight + calculatedTop - editorScrollOffset + 20 > screenHeight - (editorContainer?.top || 0)
    );
  }, [
    commentRect,
    commentPopupRef,
    marginLeft,
    calculatedTop,
    editorContainer?.left,
    editorContainer?.top,
    editorScrollOffset,
    editorContainer?.right
  ]);

  const screenSize = useScreenSize();

  const clickOutsideHandler = () => {
    const tr = view.state.tr.setMeta(closeEmptyThreadPopupKey, true);
    tr.setMeta(activeThreadKey, null);
    view.dispatch(tr);
    CommentsPositionEmitter.emit('position-comments');
  };
  useOnClickOutside(commentPopupRef, clickOutsideHandler, [
    COMMENT_MENU_CLASS_NAME,
    COMMENT_REACTIONS_CLASS_NAME,
    MENTIONS_MENU_CLASS
  ]);

  if (screenSize === ScreenSizes.Large && threads && !isPublicDocument) return null;
  const notResolvedThreads = threads?.filter((comments) => comments && !comments.resolved);

  const coords = {
    top: deviateFromBottom ? 'unset' : calculatedTop,
    bottom: deviateFromBottom ? calculatedBottom : 'unset',
    left: deviateFromRight ? 'unset' : marginLeft,
    right: deviateFromRight ? 20 : 'unset'
  };
  const multipleThread = notResolvedThreads && notResolvedThreads.length > 1;

  // if setting horizontal position by bottom, verify that its below a OFFSET from the top of the page.
  // if above the offset positions the popup from the viewport heigh
  if (
    coords.bottom !== 'unset' &&
    (getScrolledEditor()?.scrollHeight || 0) - (coords.bottom as number) - (getScrolledEditor()?.scrollTop || 0) <
      MAX_TOP_OFFSET
  )
    coords.bottom =
      (getScrolledEditor()?.scrollHeight || 0) -
      (getScrolledEditor()?.scrollTop || 0) -
      (getScrolledEditor()?.getBoundingClientRect().height || 2) / 2;

  return (
    <div
      ref={commentPopupRef}
      className={`comments-popup-container${multipleThread ? ' multiple' : ''}`}
      style={coords}
    >
      {notResolvedThreads ? (
        notResolvedThreads.map((comments, index) => (
          <div
            key={comments.id}
            onClick={() => {
              setOpenThread(index);
            }}
          >
            {index !== 0 && <Divider />}
            <Thread
              noBorder={multipleThread}
              nodeRefText={getThreadNodeTextFromId(view, comments.id, commentMarkType)}
              active={openThread === index}
              comments={comments}
              commentMarkType={commentMarkType}
              view={view}
              comentEditorNodeViews={comentEditorNodeViews}
            />
          </div>
        ))
      ) : (
        <Thread
          active={true}
          commentMarkType={commentMarkType}
          view={view}
          comments={undefined}
          comentEditorNodeViews={comentEditorNodeViews}
        />
      )}
    </div>
  );
};
