import {
  Alignment,
  Divider,
  DropdownItem,
  Icon,
  IconButton,
  Select,
  Size,
  Skeleton,
  Typography,
  TypographyWeight,
  useOnClickOutside
} from '@skiff-org/skiff-ui';
import { MarkType } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { FC, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react'; // eslint-disable-line
import styled from 'styled-components';

import { getCustomState } from '../..';
import { MARK_COMMENT } from '../../MarkNames';
import { MENTIONS_MENU_CLASS } from '../../mentionsMenu/EditorMentionsMenu';
import { ThreadAttrs } from '../../Types';
import {
  activeThreadKey,
  CommentPluginState,
  CommentWithPos,
  EditorNodeViews,
  toggleShowResolvedKey
} from '../comment.types';
import { CommentsPositionEmitter, scrollToCommentAnchor } from '../utils/FloatingThreads';
import { checkIfThreadUnreadByAttrs, getThreadNodeTextFromId } from '../utils/thread';

import { COMMENT_MENU_CLASS_NAME, COMMENT_REACTIONS_CLASS_NAME } from './CommentMenu';
import Thread from './Thread';

const DividerContainer = styled.div`
  margin-bottom: 1px;
`;

interface SidepanelThreadProps {
  commentId: string;
  onClick: MouseEventHandler;
  active: boolean;
  commentMarkType: MarkType;
  view: EditorView;
  comments: ThreadAttrs;
  scrolledBy: number;
  scrollHeight: number;
  comentEditorNodeViews: EditorNodeViews;
}

const SkeletonMargin = styled.div`
  margin: 4px 0px;
`;

const SidepanelThread: FC<SidepanelThreadProps> = ({
  scrolledBy,
  scrollHeight,
  view,
  commentId,
  onClick,
  active,
  commentMarkType,
  comments,
  comentEditorNodeViews
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);

  const top = containerRef.current ? containerRef.current.offsetTop : 0;
  const bottom = containerRef.current ? top + containerRef.current.getBoundingClientRect().height : 0;

  const visible = bottom >= scrolledBy && top < scrollHeight + scrolledBy;

  const height = containerRef.current?.getBoundingClientRect().height;
  if (height && height !== placeholderHeight) setPlaceholderHeight(height);

  return (
    <div
      className='sidepanel-thread-container'
      ref={containerRef}
      data-threadid={commentId}
      key={commentId}
      onClick={onClick}
    >
      {!visible ? (
        <SkeletonMargin>
          <Skeleton height={`${placeholderHeight}px`} width='100%' />
        </SkeletonMargin>
      ) : (
        <Thread
          active={active}
          commentMarkType={commentMarkType}
          view={view}
          comments={comments}
          nodeRefText={getThreadNodeTextFromId(view, commentId, commentMarkType)}
          noBorder
          enableScroll={false}
          comentEditorNodeViews={comentEditorNodeViews}
        />
      )}
    </div>
  );
};

type CommentsSidepanelProps = {
  state: CommentPluginState | undefined;
  view: EditorView;
  close?: boolean;
  comentEditorNodeViews: EditorNodeViews;
};

export interface FilterOption {
  label: string;
  filter: (comment: CommentWithPos, view: EditorView) => boolean;
  onClick?: (view: EditorView) => void;
}

const filters: FilterOption[] = [
  {
    label: 'Open',
    filter: (comment) => !comment.comment.resolved,
    onClick: (view) => {
      const tr = view.state.tr;
      tr.setMeta(toggleShowResolvedKey, false);
      view.dispatch(tr);
    }
  },
  {
    label: 'All',
    filter: () => true,
    onClick: (view) => {
      const tr = view.state.tr;
      tr.setMeta(toggleShowResolvedKey, true);
      view.dispatch(tr);
    }
  },
  {
    label: 'Resolved',
    filter: (comment) => !!comment.comment.resolved,
    onClick: (view) => {
      const tr = view.state.tr;
      tr.setMeta(toggleShowResolvedKey, true);
      view.dispatch(tr);
    }
  }
  //{ label: 'Mentions', filter: (comment) => true },

  // {
  //   label: 'Unread',
  //   filter: (comment, view) => checkIfThreadUnreadByAttrs(view, comment.comment),
  //   onClick: (view) => {
  //     const tr = view.state.tr;
  //     tr.setMeta(toggleShowResolvedKey, false);
  //     view.dispatch(tr);
  //   }
  // }
];

export const CommentsSidepanel: FC<CommentsSidepanelProps> = ({
  view,
  state,
  close = false,
  comentEditorNodeViews
}) => {
  const [scrolledBy, setScrolledBy] = useState(0);
  const commentsSidepanelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { setCommentsSidepanel } = getCustomState(view.state);

  const [orderDesc, setOrderDesc] = useState(true);

  const [currentFilter, setCurrentFilter] = useState<FilterOption>(filters[0]);

  const commentMarkType = view.state.schema.marks[MARK_COMMENT];
  let filteredComments = (state?.comments || [])
    .filter((comment) => currentFilter.filter(comment, view))
    .sort(
      (commentA, commentB) => (orderDesc ? -1 : 1) * (commentA.comment.thread[0].time - commentB.comment.thread[0].time)
    );

  filteredComments = [
    ...filteredComments.filter((comment) => checkIfThreadUnreadByAttrs(view.state, comment.comment)),
    ...filteredComments.filter((comment) => !checkIfThreadUnreadByAttrs(view.state, comment.comment))
  ];

  useEffect(() => {
    if (close) {
      const tr = view.state.tr;
      tr.setMeta(toggleShowResolvedKey, false);
      view.dispatch(tr);
    } else {
      if (currentFilter.onClick) {
        currentFilter.onClick(view);
      }
    }
  }, [close, view, currentFilter]);

  const scrollToThread = useCallback((threadId: string, behavior: 'auto' | 'smooth') => {
    const elem = document.querySelector(`[data-threadid="${threadId}"]`) as HTMLDivElement;
    if (!elem) return;
    scrollRef.current?.scrollTo({
      top: elem.offsetTop,
      behavior
    });
  }, []);

  const onSidepanelThreadClicked = useCallback(
    ({ node, pos, comment }: CommentWithPos) => {
      const { tr } = view.state;
      tr.setMeta(activeThreadKey, {
        from: pos,
        to: pos + node.nodeSize - 1,
        id: [comment.id]
      });

      setTimeout(() => {
        scrollToThread(comment.id, checkIfThreadUnreadByAttrs(view.state, comment) ? 'auto' : 'smooth');
      }, 0);
      scrollToCommentAnchor(view, pos, tr, comment.id);
      // scroll to node
      view.dispatch(tr);
    },
    [view, scrollToThread]
  );

  // This will change to the All filter if the user clicked on a thread that is not currently showing.
  useEffect(() => {
    if (!state?.activeThread?.id || state.activeThread.id.length === 0) return;
    if (!filteredComments.map(({ comment: { id } }) => id).includes(state.activeThread.id[0]))
      setCurrentFilter(filters[1]); // All
  }, [state?.activeThread]);

  useEffect(() => {
    if (!state?.activeThread?.id || state.activeThread.id.length === 0) return;
    scrollToThread(state.activeThread.id[0], 'smooth');
  }, [scrollToThread, state?.activeThread]);

  const clickOutsideHandler = () => {
    if (close) return;
    const tr = view.state.tr;
    tr.setMeta(activeThreadKey, null);
    view.dispatch(tr);
    CommentsPositionEmitter.emit('position-comments');
  };

  useOnClickOutside(commentsSidepanelRef, clickOutsideHandler, [
    COMMENT_MENU_CLASS_NAME,
    COMMENT_REACTIONS_CLASS_NAME,
    MENTIONS_MENU_CLASS
  ]);

  return (
    <div ref={commentsSidepanelRef} className={`comments-sidepanel-container ${close ? 'close' : ''}`}>
      <div className='comments-sidepanel-header'>
        <IconButton
          onClick={() => {
            setCommentsSidepanel(false);
          }}
          icon={Icon.DoubleRight}
        />
        <IconButton
          onClick={() => {
            setOrderDesc((o) => !o);
          }}
          icon={orderDesc ? Icon.SortDescending : Icon.SortAscending}
        />
        <div style={{ position: 'relative', marginLeft: 'auto', width: '184px' }}>
          <Select
            onChange={(value: string) => {
              const filterOption = filters.find((filter) => filter.label === value);
              if (filterOption?.onClick) filterOption.onClick(view);
              if (filterOption) setCurrentFilter(filterOption);
            }}
            filled
            size={Size.SMALL}
            value={currentFilter.label}
          >
            {filters.map((filterOption) => (
              <DropdownItem value={filterOption.label} key={filterOption.label} label={filterOption.label} />
            ))}
          </Select>
        </div>
      </div>
      <DividerContainer>
        <Divider />
      </DividerContainer>
      <div
        ref={scrollRef}
        className='comments-sidepanel-scroll'
        onScroll={() => {
          setScrolledBy(scrollRef.current?.scrollTop || 0);
        }}
      >
        {filteredComments.length > 0 ? (
          filteredComments.map((comment, index) => (
            <>
              {index !== 0 && <Divider />}
              <SidepanelThread
                commentId={comment.comment.id}
                onClick={() => onSidepanelThreadClicked(comment)}
                active={state?.activeThread?.id[0] === comment.comment.id}
                commentMarkType={commentMarkType}
                view={view}
                comments={comment.comment}
                scrollHeight={scrollRef.current?.getBoundingClientRect().height || 0}
                scrolledBy={scrolledBy}
                comentEditorNodeViews={comentEditorNodeViews}
              />
            </>
          ))
        ) : (
          <div className='no-comments-toshow'>
            <Typography mono uppercase weight={TypographyWeight.BOLD}>{`No ${
              currentFilter.label !== 'All' ? `${currentFilter.label.toLowerCase()} ` : ''
            }comments`}</Typography>
            <Typography mono uppercase color='secondary' wrap align={Alignment.CENTER}>
              {currentFilter.label} comments on this page will appear here
            </Typography>
          </div>
        )}
        <Divider />
        {filteredComments.length > 0 && <div className='down-padding-scroll' style={{ height: '300px' }}></div>}
      </div>
    </div>
  );
};
