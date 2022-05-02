import { NetworkStatus } from '@apollo/client';
import { Skeleton } from '@mui/material';
import { Typography } from '@skiff-org/skiff-ui';
import { range } from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import PullToRefresh from 'react-simple-pull-to-refresh';
import Autosizer from 'react-virtualized-auto-sizer';
import { areEqual, FixedSizeList, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import styled from 'styled-components';

import {
  DEFAULT_MAILBOX_LIMIT,
  ITEM_HEIGHT,
  MOBILE_ITEM_HEIGHT,
  POLL_INTERVAL_IN_MS
} from '../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { SystemLabels, useGetCurrentUserEmailAliasesLazyQuery, useMailboxQuery } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useRestoreScroll } from '../../hooks/useRestoreScroll';
import { useInitializeSearchWorker } from '../../hooks/useSearchWorker';
import { useSkemailEnabled } from '../../hooks/useSkemailEnabled';
import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailBottomToolbarReducer } from '../../redux/reducers/bottomToolbarReducer';
import { skemailDraftsReducer } from '../../redux/reducers/draftsReducer';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { PopulateComposeContent, PopulateComposeTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import Illustration, { Illustrations } from '../../svgs/Illustration';
import { userLabelFromGraphQL } from '../../utils/label';
import { getEditorBasePath } from '../../utils/linkToEditorUtils';
import { handleMarkAsReadUnreadClick } from '../../utils/mailboxUtils';
import { threadFilter, threadSearchFilter } from '../../utils/threadFilters';
import { convertHtmlToTextContent } from '../MailEditor/mailEditorUtils';
import Thread from '../Thread/Thread';
import { MailboxView } from './Mailbox.types';
import MobileFilterDrawer from './MailboxActions/MobileFilterDrawer';
import MobileSettingsDrawer from './MailboxActions/MobileSettingsDrawer';
import { MailboxHeader } from './MailboxHeader';
import { MessageCell } from './MessageCell/MessageCell';
import MessageDetailsPanel from './MessageDetailsPanel';
import MobileSearch from './MobileSearch';
import useMobilePageToolbar from './useMobilePageToolbar';

const MailboxContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  padding: 16px 16px 0px 16px;
  ${isMobile ? 'padding: 12px 12px 0px 12px;' : ''}
`;

const MailboxBody = styled.div`
  flex: 1;
  display: flex;
  padding-bottom: 0;
  overflow-y: hidden;
`;

const LoadingMailbox = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const EmptyMailbox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 24px;
  justify-content: center;
`;

const MessageList = styled.div<{ splitView: boolean }>`
  flex: 1;
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  overflow-y: auto;
  ${isMobile ? 'height: 100%' : ''}
`;

const SYSTEM_LABELS_TO_POLL: Set<string> = new Set([SystemLabels.Inbox, SystemLabels.Sent]);

export const Mailbox = () => {
  const { value: label, name: labelName } = useRouterLabelContext();
  const { shouldShowSkemail } = useSkemailEnabled();
  const { activeThreadID, setActiveThreadID } = useThreadActions();
  const [view, setView] = useState<MailboxView>(MailboxView.ALL);
  const [messageDetailsPanelOpen, setMessageDetailsPanelOpen] = useState(!!activeThreadID);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Index of the most recently selected thread
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const scrollOffset = useRef<number>(0);
  // Fetch aliases to determine whether to show welcome
  const [fetchEmailAliases] = useGetCurrentUserEmailAliasesLazyQuery();

  const messageListRef = useRef<HTMLDivElement>(null);
  const windowedListRef = useRef<FixedSizeList | null>(null);
  const windowedListOuterRef = useRef<HTMLDivElement>(null);

  const { draftThreads } = useDrafts();
  const { data, networkStatus, fetchMore, refetch } = useMailboxQuery({
    variables: { request: { label, cursor: null, limit: DEFAULT_MAILBOX_LIMIT, polling: true } },
    pollInterval: SYSTEM_LABELS_TO_POLL.has(label) ? POLL_INTERVAL_IN_MS : undefined,
    notifyOnNetworkStatusChange: true
  });

  // omit polling from showing the loading state
  const loading = networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch;

  // Initialize search worker to start indexing skemails
  useInitializeSearchWorker();

  const isDrafts = label === SystemLabels.Drafts;

  const threads: Array<MailboxThreadInfo> = isDrafts ? draftThreads : data?.mailbox?.threads ?? [];
  const activeThread = threads.find((t) => t.threadID === activeThreadID);
  const filteredThreads = threads
    .filter((thread) => threadFilter(thread, view))
    .filter((thread) => threadSearchFilter(thread, searchQuery));

  const isDraftOrSent = isDrafts || label === SystemLabels.Sent;

  // Redux actions
  const dispatch = useDispatch();
  // Memoize with `useCallback` so that `useEffect` dependencies don't change every render
  const setSelectedThreadIDs = useCallback(
    (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs })),
    [dispatch]
  );
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  const openCompose = (populateComposeContent: PopulateComposeContent) =>
    dispatch(skemailModalReducer.actions.openCompose({ populateComposeContent }));

  useEffect(() => {
    // Unselect threads when we switch labels
    setSelectedThreadIDs([]);
    setLastSelectedIndex(null);
  }, [setSelectedThreadIDs, label]);

  useEffect(() => {
    const checkWelcome = async () => {
      // Open welcome modal if no email aliases
      const { data: emailAliasQuery } = await fetchEmailAliases();
      const emailAliases = emailAliasQuery?.currentUser?.emailAliases ?? [];
      if (!emailAliases.length) {
        dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.SkemailWelcome }));
      }
    };
    // run on mount
    void checkWelcome();
  }, [dispatch, fetchEmailAliases]);

  // Open the message details panel if there is an active thread
  useEffect(() => {
    setMessageDetailsPanelOpen(!!activeThreadID);
  }, [activeThreadID]);

  useRestoreScroll(windowedListRef, scrollOffset, filteredThreads);

  // redirects if feature flag not enabled
  useEffect(() => {
    if (!shouldShowSkemail) {
      window.location.replace(getEditorBasePath());
    }
  }, [shouldShowSkemail]);

  // Is multiselect open
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);

  // eslint-disable-next-line react/display-name
  const MailboxItem = memo(({ index, style }: ListChildComponentProps) => {
    const thread: MailboxThreadInfo = filteredThreads[index];
    if (!thread.emails.length) return null;
    const isSelected = selectedThreadIDs.includes(thread.threadID);
    const firstEmail = thread.emails[0];
    const latestEmail = thread.emails[thread.emails.length - 1];

    const isThreadAboveSelected = index > 0 && selectedThreadIDs.includes(threads[index - 1].threadID);
    const isThreadBelowSelected = index < threads.length - 1 && selectedThreadIDs.includes(threads[index + 1].threadID);
    const isThreadBelowActive = index < threads.length - 1 && activeThreadID === threads[index + 1].threadID;

    const emailsSortedByCreatedDesc = [...thread.emails];
    emailsSortedByCreatedDesc.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    // Latest from address that isn't the sender and that is different from the first email sender of the thread
    const latestUniqueFrom = emailsSortedByCreatedDesc.find(
      (email) => email.from.address !== firstEmail.from.address
    )?.from;

    // If the email is outbound, display up to two addresses from the TO field
    // Else, display the latest and first FROM addresses in the thread
    const addressObjs = isDraftOrSent ? latestEmail.to : [firstEmail.from, latestUniqueFrom];

    const displayNames: string[] = addressObjs
      .map((addr) => addr?.name || addr?.address || '')
      .filter((addr) => !!addr?.length);

    const onSelectToggle = (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => {
      // If shift key is selected and another thread was recently selected, handle multi-select
      if (e.shiftKey && typeof lastSelectedIndex === 'number' && lastSelectedIndex !== index) {
        // Grab all threads in between the two recently selected threads]
        const startIndex = Math.min(lastSelectedIndex, index);
        const endIndex = Math.max(lastSelectedIndex, index);
        const multiSelectedThreadIDs = filteredThreads.slice(startIndex, endIndex + 1).map((t) => t.threadID);
        // If the thread being clicked is selected, deselect all
        if (isSelected) {
          setSelectedThreadIDs(selectedThreadIDs.filter((threadID) => !multiSelectedThreadIDs.includes(threadID)));
        } // else, select all
        else {
          setSelectedThreadIDs([...new Set([...selectedThreadIDs, ...multiSelectedThreadIDs])]);
        }
      }
      // Else if not shift key and the thread is selected, deselect it by filtering it out
      else if (isSelected) {
        setSelectedThreadIDs(selectedThreadIDs.filter((threadID) => threadID !== thread.threadID));
      } else {
        // Else, add just this thread to the array of selected emails
        setSelectedThreadIDs([...selectedThreadIDs, thread.threadID]);
      }
      setLastSelectedIndex(index);
    };

    const getMessage = () => {
      const decryptedText = latestEmail.decryptedText;
      // Drafts are saved in local storage as HTML,
      // so we need to convert it to human readable text
      if (label === SystemLabels.Drafts) {
        return decryptedText && convertHtmlToTextContent(decryptedText);
      }
      // Non draft emails when decrypted are formatted
      return decryptedText;
    };

    return (
      <div style={style}>
        <MessageCell
          active={thread.threadID === activeThreadID}
          date={thread.emailsUpdatedAt}
          displayNames={displayNames}
          hasAttachment={!!latestEmail.decryptedAttachmentMetadata?.length}
          isThreadAboveSelected={isThreadAboveSelected}
          isThreadBelowActive={isThreadBelowActive}
          isThreadBelowSelected={isThreadBelowSelected}
          key={thread.threadID}
          label={label}
          message={getMessage()}
          onClick={(e) => {
            if (isMobile && mobileMultiItemsActive) {
              onSelectToggle(e);
              return;
            }
            if (isDrafts) {
              dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID: thread.threadID }));
              openCompose({ type: PopulateComposeTypes.EditDraft, email: latestEmail, thread });
            } else {
              // When opening the thread, mark it as read if it is currently unread
              if (!thread.attributes.read) {
                void handleMarkAsReadUnreadClick([thread], true);
              }
              setActiveThreadID({ threadID: thread.threadID });
              setMessageDetailsPanelOpen(true);
              // if compose is already open, collapse it so the thread panel is visible
              dispatch(skemailModalReducer.actions.collapse());
            }
          }}
          onSelectToggle={onSelectToggle}
          read={thread.attributes.read}
          selected={isSelected}
          subject={thread.emails[0].decryptedSubject}
          thread={thread}
          userLabels={thread.attributes.userLabels.map(userLabelFromGraphQL)}
        />
      </div>
    );
  }, areEqual);

  const renderInfiniteLoader = () => {
    // whether or not there are more items to be rendered
    const hasNextPage = data?.mailbox?.pageInfo.hasNextPage;
    // number of items on the list / expected to be on the list
    const itemCount = hasNextPage ? filteredThreads.length + 1 : filteredThreads.length;
    // checks whether a certain item has loaded
    const isItemLoaded = (index: number) => !hasNextPage || index < filteredThreads.length;
    // callback that returns a promise that resolves to additional data for the list
    const loadMoreItems = async () => {
      await fetchMore({
        variables: {
          request: {
            label,
            cursor: data?.mailbox?.pageInfo.cursor,
            limit: DEFAULT_MAILBOX_LIMIT
          }
        }
      });
    };

    const messageList = (
      <MessageList ref={messageListRef} splitView={messageDetailsPanelOpen}>
        <Autosizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              threshold={10}
            >
              {({ ref, onItemsRendered }) => (
                <FixedSizeList
                  height={height}
                  itemCount={filteredThreads.length}
                  itemSize={isMobile ? MOBILE_ITEM_HEIGHT : ITEM_HEIGHT}
                  onItemsRendered={onItemsRendered}
                  onScroll={(e) => {
                    scrollOffset.current = e.scrollOffset;
                  }}
                  outerRef={windowedListOuterRef}
                  overscanCount={10}
                  ref={(list) => {
                    ref(list);
                    windowedListRef.current = list;
                  }}
                  width={width}
                >
                  {MailboxItem}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </Autosizer>
      </MessageList>
    );

    return (
      <>
        {/* on mobile users can swipe down to refresh the mailbox */}
        {isMobile && (
          <PullToRefresh
            onRefresh={async () => {
              await refetch({ request: { label, cursor: null, limit: DEFAULT_MAILBOX_LIMIT } });
            }}
          >
            {messageList}
          </PullToRefresh>
        )}
        {/* on desktop, we have a refresh button and no need for the gesture */}
        {!isMobile && messageList}
      </>
    );
  };

  const renderMailboxInnerContainer = () => (
    <>
      {loading && (
        <LoadingMailbox>
          {range(5).map((index) => (
            <Skeleton
              height={isMobile ? MOBILE_ITEM_HEIGHT : ITEM_HEIGHT}
              key={index}
              style={{ margin: '0 8px', backgroundColor: 'var(--bg-field-default)' }}
            />
          ))}
        </LoadingMailbox>
      )}
      {!loading && !filteredThreads.length && (
        <EmptyMailbox>
          <Illustration illustration={Illustrations.EmptyMailbox} isMobile={isMobile} />
          <Typography level={0} type='paragraph'>
            {labelName} empty
          </Typography>
        </EmptyMailbox>
      )}
      {!loading && !!filteredThreads.length && renderInfiniteLoader()}
    </>
  );

  // Show correct toolbar
  useMobilePageToolbar(messageListRef, selectedThreadIDs, label, threads);

  const scrollToTopOfMailbox = () => windowedListOuterRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <MailboxContainer>
      <MailboxHeader
        onClick={isMobile ? scrollToTopOfMailbox : undefined}
        onRefresh={async () => {
          await refetch({ request: { label, cursor: null, limit: DEFAULT_MAILBOX_LIMIT } });
        }}
        setClearAll={() => setSelectedThreadIDs([])}
        setLastSelectedIndex={setLastSelectedIndex}
        setSelectAll={() => setSelectedThreadIDs(filteredThreads.map((t) => t.threadID))}
        setView={setView}
        threads={threads}
        view={view}
      />
      <MobileView>
        {
          // Hide mobile search bar when inbox is empty
          threads.length > 0 && <MobileSearch setSearchQuery={setSearchQuery} />
        }
      </MobileView>
      <MailboxBody>
        {renderMailboxInnerContainer()}
        <MessageDetailsPanel key={activeThreadID} open={messageDetailsPanelOpen}>
          {activeThread && (
            <Thread
              onClose={() => {
                setMessageDetailsPanelOpen(false);
                setActiveThreadID(undefined);
                // Update toolbar
                dispatch(skemailBottomToolbarReducer.actions.forceUpdate());
              }}
              thread={activeThread}
            />
          )}
        </MessageDetailsPanel>
      </MailboxBody>
      <MobileView>
        <MobileFilterDrawer setView={setView} view={view} />
        <MobileSettingsDrawer />
      </MobileView>
    </MailboxContainer>
  );
};
