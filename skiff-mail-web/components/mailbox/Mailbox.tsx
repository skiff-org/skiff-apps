import { NetworkStatus } from '@apollo/client';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AnimatePresence } from 'framer-motion';
import { Icon, IconButton, Typography } from 'nightwatch-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile, MobileView, isIOS, isAndroid, isMacOs } from 'react-device-detect';
import { configure } from 'react-hotkeys';
import { useDispatch } from 'react-redux';
import Autosizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useScrollActionBar, useToast } from 'skiff-front-utils';
import { sendRNWebviewMsg, usePrevious } from 'skiff-front-utils';
import { CreditInfo, EntityType, SystemLabels } from 'skiff-graphql';
import {
  useGetCreditsLazyQuery,
  useGetCurrentUserEmailAliasesLazyQuery,
  useGetLastViewedReferralCreditLazyQuery,
  useMailboxQuery,
  useSetLastViewedReferralCreditMutation
} from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { COMPACT_MAILBOX_BREAKPOINT, DEFAULT_MAILBOX_LIMIT } from '../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import useLocalSetting, { ThreadDisplayFormat } from '../../hooks/useLocalSetting';
import { useRestoreScroll } from '../../hooks/useRestoreScroll';
import { useSearch } from '../../hooks/useSearch';
import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import Illustration, { Illustrations } from '../../svgs/Illustration';
import { getItemHeight } from '../../utils/mailboxUtils';
import { SearchSkemail } from '../../utils/searchWorkerUtils';
import MobileBottomNavigation from '../shared/BottomNavigation/MobileBottomNavigation';
import LazyPinchZoom from '../Thread/MailHTMLView/PinchZoom/LazyPinchZoom';
import Thread from '../Thread/Thread';

import { MAIL_LIST_CONTAINER_ID } from './consts';
import MobileFilterDrawer from './MailboxActions/MobileFilterDrawer';
import MobileMailboxSelectDrawer from './MailboxActions/MobileMailboxSelectDrawer';
import { animateMailListHeader, MailboxHeader, MAIL_LIST_HEADER_ID, MOBILE_HEADER_HEIGHT } from './MailboxHeader';
import MailboxItem from './MailboxItem/MailboxItem';
import MailboxMobileSearchItem from './MailboxItem/MailboxMobileSearchItem';
import { MailboxSkeleton } from './MailboxSkeleton';
import MessageDetailsPanel from './MessageDetailsPanel';
import MobilePullToRefresh from './MobilePullToRefresh/MobilePullToRefresh';
import useGatedMailboxData from './useGatedMailboxData';

const QuickComposeButton = styled.div`
  position: absolute;
  bottom: 36px;
  right: 36px;
  z-index: 12;
  transform: scale(1.2);
`;

const MailboxContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  background: var(--bg-main-container);
`;

const MailboxListThread = styled.div`
  flex: 1;
  display: flex;
  overflow-y: hidden;
`;

const MailboxHeaderBody = styled.div<{ activeThreadID: boolean; threadFormat: ThreadDisplayFormat }>`
  flex: 1;
  display: ${({ threadFormat, activeThreadID }) =>
    threadFormat === ThreadDisplayFormat.Full && !!activeThreadID ? 'none' : 'flex'};
  flex-direction: column;
  overflow-y: hidden;
  ${({ activeThreadID }) => (!activeThreadID && isMobile ? 'transform: translateX(0) !important;' : '')}
  padding: 0px;
  border-right: 1px solid var(--border-tertiary);
`;

const MailboxBody = styled.div`
  flex: 1;
  display: flex;
  padding-bottom: 0;
  overflow-y: hidden;
`;

const EmptyMailbox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 24px;
  justify-content: center;
  ${isMobile ? 'height: 100%;' : ''}
`;

const MessageList = styled.div<{ threadFormat: ThreadDisplayFormat }>`
  flex: 1;
  display: flex;
  min-width: ${(props) => `${props.threadFormat === ThreadDisplayFormat.Right ? '280px' : '0px'}`};
  height: 100%;
  width: 100%;
  flex-direction: column;
  ${isMobile ? 'height: 100%; overflow-y: hidden;' : ''}
`;

const SYSTEM_LABELS_TO_POLL: Set<string> = new Set([SystemLabels.Inbox, SystemLabels.Sent, SystemLabels.ScheduleSend]);

export const Mailbox = () => {
  const { value: label, name: labelName } = useRouterLabelContext();
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`);
  const { activeThreadID, setActiveThreadID } = useThreadActions();
  const { filters, hoveredThreadIndex, hoveredThreadID } = useAppSelector((state) => state.mailbox);
  const { composeOpen } = useAppSelector((state) => state.modal);
  // Is the user refreshing or not
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [threadFormat] = useLocalSetting('threadFormat');

  // Index of the most recently selected thread
  const scrollOffset = useRef<number>(0);
  // Fetch aliases to determine whether to show welcome
  const [fetchEmailAliases] = useGetCurrentUserEmailAliasesLazyQuery();
  // Fetch users referral credit info
  const { userID } = useRequiredCurrentUserData();
  const [fetchReferralCredits] = useGetCreditsLazyQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [CreditInfo.CreditsFromReferrals]
      }
    }
  });
  const [getLastViewedReferralCredit] = useGetLastViewedReferralCreditLazyQuery();
  const [setLastViewedReferralCredit] = useSetLastViewedReferralCreditMutation();

  const messageListRef = useRef<HTMLDivElement>(null);
  const windowedListRef = useRef<VariableSizeList | null>(null);
  const windowedListOuterRef = useRef<HTMLDivElement | null>(null);

  // Track mailbox in which last auto open/close took place to ensure it happens only once per label change
  const prevMailboxRef = useRef<string | null>(null);
  const hasAutoOpenedInCurrentMailboxRef = useRef(false);

  const iosKeyboardHeight = useIosKeyboardHeight('mailbox');

  const { enqueueToast } = useToast();

  /* Search hook is only used for mobile */

  // Note: We may eventually want to move mobile to an entirely separate component
  // since there's a growing number of difference like this
  const {
    query: mobileSearchQuery,
    setQuery: setMobileSearchQuery,
    skemails: mobileSearchSkemails,
    search
  } = useSearch();
  const { draftThreads } = useDrafts();
  const {
    data: _data,
    fetchMore,
    refetch,
    networkStatus,
    error
  } = useMailboxQuery({
    variables: {
      request: {
        label,
        cursor: null,
        limit: DEFAULT_MAILBOX_LIMIT,
        polling: true,
        filters,
        platformInfo: {
          isIos: isIOS,
          isAndroid,
          isMacOs,
          isMobile
        }
      }
    },
    pollInterval: SYSTEM_LABELS_TO_POLL.has(label) ? POLL_INTERVAL_IN_MS : undefined,
    notifyOnNetworkStatusChange: true
  });

  if (error) {
    console.error(`Failed to load.`, error);
    enqueueToast({
      body: 'Error loading.',
      icon: Icon.Warning,
      actions: [{ label: 'Copy', onClick: () => navigator.clipboard.writeText(error.message) }]
    });
  }

  // Only lock data when refreshing and on mobile in order to get clean pull to refresh animation
  // When not on mobile data will not be locked
  const lockData = isMobile && isRefreshing;
  const data = useGatedMailboxData(_data, lockData);

  // omit polling from showing the loading state
  // when switching labels, `data` is briefly not defined, so falsy data implies loading
  const loading = networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch || !data;

  const isDrafts = label === SystemLabels.Drafts;
  const isInbox = label === SystemLabels.Inbox;
  const isSent = label === SystemLabels.Sent;
  const isScheduleSend = label === SystemLabels.ScheduleSend;
  const isAutoOpenLabel = isInbox || isSent || isScheduleSend;
  const threads: Array<MailboxThreadInfo> = isDrafts ? draftThreads : data?.mailbox?.threads ?? [];
  const mostRecentThreadID = !!threads.length ? threads[0].threadID : undefined;
  const prevMostRecentThreadID = usePrevious(mostRecentThreadID);
  const displayMobileSearchResults = isMobile && !!mobileSearchQuery;

  // Configuration for global hot keys to allow for holding down
  // arrow keys and scroll up and down the mailbox
  configure({
    ignoreRepeatedEventsWhenKeyHeldDown: false
  });

  // keep track on number of rendered threads in mailbox, used for arrows navigation hotkeys
  useEffect(() => {
    dispatch(skemailMailboxReducer.actions.setRenderedMailboxThreadsCount(data?.mailbox?.threads.length || 0));
  }, [data?.mailbox?.threads.length]);

  // We are adding space at the top of the list for support animation hide/show on header
  const threadsWithSpacer = [{ threadID: '_spacer' }, ...threads];
  const searchSkemailsWithSpacer = [{ threadID: '_spacer' }, ...mobileSearchSkemails];

  const setMailBoxListOuterRef = useScrollActionBar(MOBILE_HEADER_HEIGHT, MAIL_LIST_HEADER_ID);

  // Redux actions
  const dispatch = useDispatch();
  // Memoize with `useCallback` so that `useEffect` dependencies don't change every render
  const setSelectedThreadIDs = useCallback(
    (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs })),
    [dispatch]
  );

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  useEffect(() => {
    // Unselect threads when we switch labels
    setSelectedThreadIDs([]);
    dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(null));
  }, [setSelectedThreadIDs, label]);

  const closeActiveThread = () => {
    setActiveThreadID(undefined);
  };

  const mailboxChanged = label !== prevMailboxRef.current;
  const threadsChanged = mostRecentThreadID !== prevMostRecentThreadID;
  const mailboxChangedOrLoaded = mailboxChanged || threadsChanged;

  // auto-open most recent thread on appropriate mailbox loads in split view
  const shouldOpenMostRecentThread =
    !loading &&
    !isMobile &&
    !isCompact &&
    isAutoOpenLabel &&
    threadFormat === ThreadDisplayFormat.Right &&
    !!mostRecentThreadID &&
    threadsChanged &&
    !activeThreadID &&
    (mailboxChanged || !hasAutoOpenedInCurrentMailboxRef.current); // possilbe to auto open *after* a change when new mail loads

  // Close active thread if changing to a mailbox that doesn't support auto-open (e.g. Spam) or an empty mailbox
  const shouldCloseActiveThread = !isDrafts && !!activeThreadID && mailboxChanged && !loading && threads.length === 0;

  useEffect(() => {
    // when mailbox changes or loads, open the most recent thread or close the active thread if needed
    // we monitor both mailbox changes and thread changes, because labels can update before new mail has loaded
    if (mailboxChangedOrLoaded) {
      if (shouldOpenMostRecentThread) {
        setActiveThreadID({ threadID: mostRecentThreadID });
        hasAutoOpenedInCurrentMailboxRef.current = true; // only one auto open per mailbox change
      } else if (shouldCloseActiveThread) {
        closeActiveThread();
        hasAutoOpenedInCurrentMailboxRef.current = false; // an auto open can happen after a close
      } else if (mailboxChanged) {
        hasAutoOpenedInCurrentMailboxRef.current = false; // reset on any mailbox switch
      }
      prevMailboxRef.current = label;
    }
  });

  const onComposeClick = useCallback(() => {
    dispatch(skemailModalReducer.actions.openEmptyCompose());
  }, [dispatch]);

  useEffect(() => {
    const currentHoveredThread = threads[hoveredThreadIndex % threads.length];
    if (!!currentHoveredThread?.threadID && currentHoveredThread.threadID !== hoveredThreadID) {
      dispatch(skemailMailboxReducer.actions.setHoveredThreadID({ hoveredThreadID: currentHoveredThread.threadID }));
      const msg = document.getElementById(`${currentHoveredThread.threadID}`);
      if (!!msg && !!messageListRef.current) {
        const { top: msgTop, bottom: msgBottom } = msg.getBoundingClientRect();
        const { top: bodyTop, bottom: bodyBottom } = messageListRef.current.getBoundingClientRect();
        const withinViewport = msgTop >= bodyTop && msgBottom <= bodyBottom;
        if (!withinViewport) {
          const alignToTop = msgTop < bodyTop;
          msg.scrollIntoView(alignToTop);
        }
      }
    }
  }, [hoveredThreadID, hoveredThreadIndex, threads]);

  useEffect(() => {
    const checkWelcome = async () => {
      // Open welcome modal if no email aliases
      const { data: emailAliasQuery } = await fetchEmailAliases();
      const emailAliases = emailAliasQuery?.currentUser?.emailAliases;
      // Only show welcome modal if email alias query succeeds and we have no aliases
      if (emailAliases && !emailAliases.length) {
        dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.SkemailWelcome }));
      } else {
        // Else check to see if available referral credits should be displayed.
        const { data: referralCreditsQuery } = await fetchReferralCredits();
        const referralCreditAmount = referralCreditsQuery?.credits?.credits.find(
          (credit) => credit.info === CreditInfo.CreditsFromReferrals
        )?.amount ?? { cents: 0, skemailStorageBytes: '0', editorStorageBytes: '0' };
        const referralCount =
          referralCreditsQuery?.credits?.credits.find((credit) => credit.info == CreditInfo.CreditsFromReferrals)
            ?.count ?? 0;
        const { data: lastViewedReferralCreditQuery } = await getLastViewedReferralCredit();
        const lastViewedReferralCount = lastViewedReferralCreditQuery?.lastViewedReferralCredit.count ?? 0;
        const lastViewedReferralCreditAmount = lastViewedReferralCreditQuery?.lastViewedReferralCredit.amount ?? {
          cents: 0,
          skemailStorageBytes: '0',
          editorStorageBytes: '0'
        };

        const newReferralCreditBytes =
          Number.parseInt(referralCreditAmount.skemailStorageBytes) -
          Number.parseInt(lastViewedReferralCreditAmount.skemailStorageBytes);
        const newReferralCount = referralCount - lastViewedReferralCount;

        if (newReferralCount > 0 && newReferralCreditBytes > 0) {
          dispatch(
            skemailModalReducer.actions.setOpenModal({
              type: ModalType.ReferralSplash,
              creditBytes: newReferralCreditBytes,
              referralCount: newReferralCount
            })
          );
          await setLastViewedReferralCredit({
            variables: {
              request: {
                count: referralCount,
                amount: {
                  cents: referralCreditAmount.cents,
                  skemailStorageBytes: referralCreditAmount.skemailStorageBytes,
                  editorStorageBytes: referralCreditAmount.editorStorageBytes
                }
              }
            }
          });
        }
      }
    };
    // run on mount
    void checkWelcome();
  }, [dispatch, fetchEmailAliases]);

  // Restore scroll (if we're not displaying mobile search results)
  useRestoreScroll(windowedListRef, scrollOffset, threads, !!displayMobileSearchResults);

  const itemHeight = getItemHeight(isMobile);

  // Is multiselect open
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);

  // Is the side panel open
  const messageDetailsPanelOpen = label !== SystemLabels.Drafts && !!activeThreadID;

  const renderInfiniteLoader = () => {
    // whether or not there are more items to be rendered
    const hasNextPage = data?.mailbox?.pageInfo.hasNextPage;
    const cursor =
      hasNextPage && !!data?.mailbox?.pageInfo?.cursor
        ? { threadID: data.mailbox.pageInfo.cursor.threadID, date: data.mailbox.pageInfo.cursor.date }
        : null;
    // number of items on the list / expected to be on the list
    const itemCount = hasNextPage ? threads.length + 1 : threads.length;
    // checks whether a certain item has loaded
    const isItemLoaded = (index: number) => !hasNextPage || index < threads.length;
    // callback that returns a promise that resolves to additional data for the list
    const loadMoreItems = async () => {
      await fetchMore({
        variables: {
          request: {
            label,
            cursor,
            limit: DEFAULT_MAILBOX_LIMIT,
            filters
          }
        }
      });
    };

    const spacerHeight = isMobile ? MOBILE_HEADER_HEIGHT : 0;

    const messageList = (
      <MessageList ref={messageListRef} threadFormat={isCompact ? ThreadDisplayFormat.Full : threadFormat}>
        {!displayMobileSearchResults && (
          <Autosizer>
            {({ height, width }) => (
              <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={itemCount}
                loadMoreItems={loadMoreItems}
                threshold={8}
              >
                {({ ref, onItemsRendered }) => (
                  <VariableSizeList
                    estimatedItemSize={itemHeight}
                    height={height - iosKeyboardHeight}
                    itemCount={threadsWithSpacer.length}
                    itemData={{
                      threads: threadsWithSpacer as MailboxThreadInfo[],
                      selectedThreadIDs,
                      mobileMultiItemsActive,
                      activeThreadID,
                      setActiveThreadID
                    }}
                    itemKey={(index, data) => {
                      const { threads } = data;
                      const item = threads[index];
                      return item.threadID;
                    }}
                    itemSize={(i) => (i === 0 ? spacerHeight : itemHeight)}
                    onItemsRendered={onItemsRendered}
                    onScroll={(e) => {
                      scrollOffset.current = e.scrollOffset;
                    }}
                    outerRef={(outerRef) => {
                      setMailBoxListOuterRef(outerRef);
                      windowedListOuterRef.current = outerRef;
                    }}
                    overscanCount={10}
                    ref={(list) => {
                      ref(list);
                      windowedListRef.current = list;
                    }}
                    style={{
                      overflowX: 'hidden',
                      paddingBottom: iosKeyboardHeight
                    }}
                    width={width}
                  >
                    {MailboxItem}
                  </VariableSizeList>
                )}
              </InfiniteLoader>
            )}
          </Autosizer>
        )}
        {/* Unlike the API returned message data rendered above, results from mobile search are returned */}
        {/* as EMAILS (SearchSkemails) instead of THREADS. Because of this, we must handle the data differently below */}
        {displayMobileSearchResults && !!mobileSearchSkemails.length && (
          <Autosizer>
            {({ height, width }) => (
              <VariableSizeList
                estimatedItemSize={itemHeight}
                height={height - iosKeyboardHeight}
                itemCount={searchSkemailsWithSpacer.length}
                itemData={{
                  skemails: searchSkemailsWithSpacer as SearchSkemail[],
                  selectedThreadIDs,
                  activeThreadID,
                  setActiveThreadID
                }}
                itemKey={(index, data) => {
                  const { skemails } = data;
                  const item = skemails[index];
                  return item.id;
                }}
                itemSize={(i) => (i === 0 ? spacerHeight : itemHeight)}
                onScroll={(e) => {
                  scrollOffset.current = e.scrollOffset;
                }}
                outerRef={(outerRef) => {
                  setMailBoxListOuterRef(outerRef);
                  windowedListOuterRef.current = outerRef;
                }}
                overscanCount={10}
                style={{ overflowX: 'hidden', paddingBottom: iosKeyboardHeight }}
                width={width}
              >
                {MailboxMobileSearchItem}
              </VariableSizeList>
            )}
          </Autosizer>
        )}
      </MessageList>
    );

    return messageList;
  };

  const showSkeleton = loading && !isRefreshing;

  const renderMailboxInnerContainer = () => {
    const mailboxInner = (
      <>
        {showSkeleton && <MailboxSkeleton />}
        {!loading && !threads.length && (
          <EmptyMailbox>
            <Illustration illustration={Illustrations.EmptyMailbox} />
            <Typography level={0} noSelect>
              {labelName} empty
            </Typography>
          </EmptyMailbox>
        )}
        {(!loading || isRefreshing) && !!threads.length && renderInfiniteLoader()}
      </>
    );
    return (
      <>
        {isMobile && (
          <MobilePullToRefresh
            onRefresh={async () => {
              if (networkStatus === NetworkStatus.poll) {
                return;
              }
              sendRNWebviewMsg('triggerHapticFeedback', {});
              await refetch({ request: { label, cursor: null, limit: DEFAULT_MAILBOX_LIMIT, filters } });
            }}
            setLocked={setIsRefreshing}
          >
            {mailboxInner}
          </MobilePullToRefresh>
        )}
        {!isMobile && mailboxInner}
      </>
    );
  };

  const scrollToTopOfMailbox = () => windowedListOuterRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const activeThreadIDIndex = threads.findIndex((thread) => thread.threadID === activeThreadID);
  const nextThread = threads[activeThreadIDIndex + 1];
  const prevThread = threads[activeThreadIDIndex - 1];

  return (
    <MailboxContainer>
      <MailboxListThread>
        <MailboxHeaderBody
          activeThreadID={!!activeThreadID && !isDrafts}
          id={MAIL_LIST_CONTAINER_ID}
          threadFormat={threadFormat}
        >
          <MailboxHeader
            onClick={isMobile ? scrollToTopOfMailbox : undefined}
            onRefresh={async () => {
              if (networkStatus === NetworkStatus.poll) {
                return;
              }
              setIsRefreshing(true);
              await refetch({ request: { label, cursor: null, limit: DEFAULT_MAILBOX_LIMIT, filters } });
              setIsRefreshing(false);
            }}
            setClearAll={() => setSelectedThreadIDs([])}
            setMobileSearchQuery={(newQuery: string) => {
              setMobileSearchQuery(newQuery);
              search();
            }}
            setSelectAll={() => {
              if (displayMobileSearchResults && mobileSearchSkemails.length) {
                setSelectedThreadIDs(mobileSearchSkemails.map((s) => s.threadID));
              } else {
                setSelectedThreadIDs(threads.map((t) => t.threadID));
              }
            }}
            showSkeleton={showSkeleton}
            threads={threads}
          />
          <MailboxBody data-test='mailbox-body'>{renderMailboxInnerContainer()}</MailboxBody>
        </MailboxHeaderBody>
        <AnimatePresence>
          <MessageDetailsPanel key={activeThreadID} open={messageDetailsPanelOpen}>
            {activeThreadID && (
              <Thread
                nextThreadAndEmail={nextThread ? { threadID: nextThread.threadID } : undefined}
                onClose={closeActiveThread}
                prevThreadAndEmail={prevThread ? { threadID: prevThread.threadID } : undefined}
                threadID={activeThreadID}
              />
            )}
          </MessageDetailsPanel>
        </AnimatePresence>
      </MailboxListThread>
      <MobileView>
        <MobileFilterDrawer />
        <MobileMailboxSelectDrawer />
        <LazyPinchZoom enabled /> {/* Lazy load PinchZoom when Mailbox is opened */}
        {!composeOpen && !activeThreadID && !mobileMultiItemsActive && (
          <QuickComposeButton>
            <IconButton
              dataTest='open-compose'
              icon={Icon.Compose}
              onClick={() => {
                // Reset mail animation progress
                animateMailListHeader('1');
                onComposeClick();
              }}
              size='large'
              type='filled'
            />
          </QuickComposeButton>
        )}
        <MobileBottomNavigation threads={threads} />
      </MobileView>
    </MailboxContainer>
  );
};
