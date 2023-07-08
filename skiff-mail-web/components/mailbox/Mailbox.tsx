import { NetworkStatus } from '@apollo/client';
import { AnimatePresence } from 'framer-motion';
import { useFlags } from 'launchdarkly-react-client-sdk';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import dynamic from 'next/dynamic';
import { Icon, IconButton, Size } from '@skiff-org/skiff-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAndroid, isIOS, isMacOs, isMobile, MobileView } from 'react-device-detect';
import { configure } from 'react-hotkeys';
import { useDispatch } from 'react-redux';
import Autosizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  useGetCreditsLazyQuery,
  useGetCurrentUserEmailAliasesLazyQuery,
  useGetLastViewedReferralCreditLazyQuery,
  useGetThreadsFromIDsQuery,
  useMailboxQuery,
  useSetLastViewedReferralCreditMutation,
  useSubscriptionPlan
} from 'skiff-front-graphql';
import {
  EmptyIllustration,
  getEnvironment,
  Illustration,
  Illustrations,
  sendRNWebviewMsg,
  SettingValue,
  TabPage,
  useCurrentUserIsOrgAdmin,
  useMediaQuery,
  usePrevious,
  useRequiredCurrentUserData,
  UserPreferenceKey,
  useScrollActionBar,
  useSyncSavedAccount,
  useTheme,
  useUserPreference,
  isReactNativeDesktopApp,
  useCurrentUserEmailAliases
} from 'skiff-front-utils';
import {
  CreditInfo,
  EntityType,
  SubscriptionPlan,
  SystemLabels,
  ThreadDisplayFormat,
  UserLabelVariant
} from 'skiff-graphql';
import {
  ActivationChecklistFeatureFlag,
  filterExists,
  FrontendMailFilteringFeatureFlag,
  StorageTypes,
  POLL_INTERVAL_IN_MS
} from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT, DEFAULT_MAILBOX_LIMIT } from '../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { useDrafts } from '../../hooks/useDrafts';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import { useRestoreScroll } from '../../hooks/useRestoreScroll';
import { useSearch } from '../../hooks/useSearch';
import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getLabelDisplayName } from '../../utils/label';
import { getInitialThreadParams } from '../../utils/locationUtils';
import { getItemHeight } from '../../utils/mailboxUtils';
import { runClientSideMailFilters } from '../../utils/mailFiltering/mailFiltering';
import { SearchItemType, SearchSkemail } from '../../utils/searchWorkerUtils';
import { useSettings } from '../Settings/useSettings';

import { MAIL_LIST_CONTAINER_ID } from './consts';
import { fadeInAnimation } from './Mailbox.styles';
import { animateMailListHeader, MAIL_LIST_HEADER_ID, MailboxHeader, MOBILE_HEADER_HEIGHT } from './MailboxHeader';
import useGatedMailboxData from './useGatedMailboxData';
import { MOCK_MAILBOX_REQUEST } from '__mocks__/mockApiResponse';

const ActivationPaneToggle = dynamic(() => import('./ActivationPane/ActivationPaneToggle'), { ssr: false });
const LoadingMailbox = dynamic(() => import('./LoadingMailbox'), { ssr: false });
const LazyPinchZoom = dynamic(() => import('../Thread/MailHTMLView/PinchZoom/LazyPinchZoom'), { ssr: false });
const Thread = dynamic(() => import('../Thread/Thread'), { ssr: false });
const MobileBottomNavigation = dynamic(() => import('../shared/BottomNavigation/MobileBottomNavigation'), {
  ssr: false
});
const MobileFilterDrawer = dynamic(() => import('./MailboxActions/MobileFilterDrawer'), { ssr: false });
const MobileMailboxSelectDrawer = dynamic(() => import('./MailboxActions/MobileMailboxSelectDrawer'), { ssr: false });
const MailboxItem = dynamic(() => import('./MailboxItem/MailboxItem'), { ssr: false });
const MailboxMobileSearchItem = dynamic(() => import('./MailboxItem/MailboxMobileSearchItem'), { ssr: false });
const MobilePullToRefresh = dynamic(() => import('./MobilePullToRefresh/MobilePullToRefresh'), { ssr: false });
const MessageDetailsPanel = dynamic(() => import('./MessageDetailsPanel'), { ssr: false });

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

const MailboxHeaderBody = styled.div<{ $activeThreadID: boolean; $fullView: boolean }>`
  flex: 1;
  display: ${({ $fullView, $activeThreadID }) => ($fullView && !!$activeThreadID ? 'none' : 'flex')};
  flex-direction: column;
  overflow-y: hidden;
  ${({ $activeThreadID }) => (!$activeThreadID && isMobile ? 'transform: translateX(0) !important;' : '')}
  padding: 0px;
  border-right: ${({ $fullView, $activeThreadID }) =>
    $fullView && !!$activeThreadID ? 'none' : '1px solid var(--border-tertiary)'};
`;

const MailboxBody = styled.div`
  flex: 1;
  display: flex;
  padding-bottom: 0;
  overflow-y: hidden;
`;

const MessageList = styled.div<{ threadFormat: ThreadDisplayFormat }>`
  flex: 1;
  display: flex;
  min-width: ${(props) => `${props.threadFormat === ThreadDisplayFormat.Right ? '280px' : '0px'}`};
  height: 100%;
  width: 100%;
  flex-direction: column;
  ${isMobile ? 'height: 100%; overflow-y: hidden;' : ''}
  opacity: 1;
  animation: ${fadeInAnimation} 0.2s linear;
`;

const EmptyIllustrationContainer = styled.div`
  height: 96px;
`;

const SYSTEM_LABELS_TO_POLL: Set<string> = new Set([SystemLabels.Inbox, SystemLabels.Sent, SystemLabels.ScheduleSend]);

const MAX_THREADS_TO_QUERY = 20;

export const Mailbox = () => {
  const { theme } = useTheme();
  const { value: label, name: labelName } = useRouterLabelContext();
  const prevLabel = usePrevious(label);
  const { userLabelVariant } = useCurrentLabel();
  const flags = useFlags();
  const activationChecklistFF = flags.activationChecklist as ActivationChecklistFeatureFlag;
  const env = getEnvironment(new URL(window.location.origin));
  const enableActivationChecklist =
    env === 'local' || env === 'vercel' || activationChecklistFF === ActivationChecklistFeatureFlag.TRIAL;
  const hasFrontendMailFilteringFeatureFlag =
    env === 'local' || env === 'vercel' || (flags.frontendMailFiltering as FrontendMailFilteringFeatureFlag);
  // need noSsr in useMediaQuery to avoid the first render returning isCompact as false
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`, { noSsr: true });
  const activeThreadAndEmailIDsFromURL = getInitialThreadParams();
  const { activeThreadID, setActiveThreadID } = useThreadActions();
  const { openSettings } = useSettings();

  // Redux actions
  const dispatch = useDispatch();
  const { filters, hoveredThreadIndex, hoveredThreadID, pendingReplies } = useAppSelector((state) => state.mailbox);
  const { composeOpen } = useAppSelector((state) => state.modal);
  // Is the user refreshing or not
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activationPaneOffset, setActivationPaneOffset] = useState(0);

  const { userID } = useRequiredCurrentUserData();
  const {
    data: { activeSubscription },
    loading: activeSubscriptionLoading
  } = useSubscriptionPlan();
  const currentUserIsOrgAdmin = useCurrentUserIsOrgAdmin();

  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);

  // user preference to persistently hide the activation checklist
  const [hideActivationChecklist] = useUserPreference(UserPreferenceKey.HIDE_ACTIVATION_CHECKLIST);

  // Index of the most recently selected thread
  const scrollOffset = useRef<number>(0);
  // Fetch aliases to determine whether to show welcome
  const [fetchEmailAliases] = useGetCurrentUserEmailAliasesLazyQuery();
  const currentUserAliases = useCurrentUserEmailAliases();

  // Fetch users referral credit info
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

  // add the logged in users data to local storage
  // so users can log back in more easily
  useSyncSavedAccount();

  /* Search hook is only used for mobile */

  // Note: We may eventually want to move mobile to an entirely separate component
  // since there's a growing number of difference like this
  const {
    query: mobileSearchQuery,
    setQuery: setMobileSearchQuery,
    resultThreadEmailIds,
    searchForQuery
  } = useSearch();

  const displayMobileSearchResults = isMobile && !!mobileSearchQuery;
  const [resultsToRender, setResultsToRender] = useState<{ emailID: string; thread: MailboxThreadInfo }[]>([]);
  const [startingIndexToFetch, setStartingIndexToFetch] = useState(0);
  const resultThreadIds = resultThreadEmailIds.map((result) => result.threadID);
  const resultEmailIds = resultThreadEmailIds.map((result) => result.emailID);
  // Fetch thread objects
  const threadIDsToFetch = uniq(
    resultThreadIds.slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
  );
  const { refetch: refetchSearchThreads } = useGetThreadsFromIDsQuery({
    variables: { threadIDs: threadIDsToFetch },
    onCompleted: (data) => {
      // Calculate the search results to render given the thread objects fetched from the server
      const newResultsToRender =
        resultEmailIds
          .slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
          .map((resultEmailId) => {
            const threadID = resultThreadEmailIds.find((result) => result.emailID === resultEmailId)?.threadID;
            const thread = data?.userThreads?.find((t) => t?.threadID === threadID);
            if (!thread) {
              return undefined;
            }
            return { emailID: resultEmailId, thread };
          })
          .filter(filterExists) ?? [];
      setResultsToRender((results) =>
        results && startingIndexToFetch > 0
          ? uniqBy([...results, ...newResultsToRender], (r) => r.emailID)
          : newResultsToRender
      );
    },
    skip: !resultThreadIds.length || !displayMobileSearchResults || !resultThreadEmailIds
  });

  useEffect(() => {
    void refetchSearchThreads();
  }, [startingIndexToFetch, refetchSearchThreads]);

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
          isMobile,
          isReactNative: !!window.ReactNativeWebView,
          isSkiffWindowsDesktop: !!window.IsSkiffWindowsDesktop
        },
        isAliasInbox: userLabelVariant === UserLabelVariant.Alias,
        // if the FE Mail Filtering FF is on, only get threads
        // that have had the client side filters applied
        clientsideFiltersApplied: hasFrontendMailFilteringFeatureFlag ? true : undefined
      }
    },
    skip: !label,
    pollInterval: SYSTEM_LABELS_TO_POLL.has(label) ? POLL_INTERVAL_IN_MS : undefined,
    notifyOnNetworkStatusChange: true,
    onCompleted: (loadedData) => {
      if (hasFrontendMailFilteringFeatureFlag) void runClientSideMailFilters();

      // Remove loaded emails from pending replies
      const allEmailIDs = loadedData.mailbox?.threads.flatMap((thread) => thread.emails.map((email) => email.id)) ?? [];
      const loadedPendingReplyEmailIDs = pendingReplies
        .filter((pendingReply) => allEmailIDs.includes(pendingReply.email.id))
        .map((pendingReply) => pendingReply.email.id);
      if (loadedPendingReplyEmailIDs.length)
        dispatch(skemailMailboxReducer.actions.removeFromPendingReplies({ emailIDs: loadedPendingReplyEmailIDs }));
    }
  });

  if (error) {
    console.error(`Failed to load.`, error);
  }

  // Only lock data when refreshing in order to get clean pull to refresh animation
  const data = useGatedMailboxData(_data, isRefreshing);
  const prevData = usePrevious({ ...data });
  useEffect(() => {
    // check for new messages for native notifications
    if (!isReactNativeDesktopApp()) {
      return;
    }
    if (document.hasFocus()) {
      return;
    }
    // compare all the messageIDs for the threads inside data and see which are new
    const prevMessageIDs = prevData?.mailbox?.threads.flatMap((thread) => thread.emails.map((email) => email.id));
    const newMessageIDs = data?.mailbox?.threads.flatMap((thread) => thread.emails.map((email) => email.id));
    const diffMsgIDs = newMessageIDs?.filter((id) => !prevMessageIDs?.includes(id));
    if (diffMsgIDs?.length) {
      const msgWithNewIds =
        data?.mailbox?.threads.flatMap((thread) => thread.emails.filter((email) => diffMsgIDs.includes(email.id))) ??
        [];
      // filter by not from self
      const msgsNotFromSelf = msgWithNewIds.filter((email) => !currentUserAliases.includes(email.from.address));
      const msgsFilteredByRecency = msgsNotFromSelf?.filter((email) => {
        // return true if createdAt within last 1 minute
        const diff = new Date().getTime() - email.createdAt.getTime();
        const diffInMinutes = diff / (1000 * 60);
        return diffInMinutes < 1;
      });
      const notificationInfoForNativeApp = msgsFilteredByRecency.map((email) => ({
        title: email.from.name,
        body: email.decryptedSubject
      }));
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'newMessageNotifications', data: { notificationData: notificationInfoForNativeApp } })
        );
      } catch (err) {
        console.error('Failed to send data to native app', err);
      }
    }
  }, [data, prevData]);

  // omit polling from showing the loading state
  // when switching labels, `data` is briefly not defined, so falsy data implies loading
  const loading =
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.refetch ||
    networkStatus === NetworkStatus.setVariables ||
    !data;

  const isDrafts = label === SystemLabels.Drafts;
  const isInbox = label === SystemLabels.Inbox;
  const isSent = label === SystemLabels.Sent;
  const isScheduleSend = label === SystemLabels.ScheduleSend;
  const isImported = label === SystemLabels.Imported;
  const isAutoOpenLabel = isInbox || isSent || isScheduleSend;
  const threads = isDrafts ? draftThreads : MOCK_MAILBOX_REQUEST.data.mailbox?.threads ?? [];

  const mostRecentThreadID = !!threads.length ? threads[0]?.threadID : undefined;
  const prevMostRecentThreadID = usePrevious(mostRecentThreadID);

  // Configuration for global hot keys to allow for holding down
  // arrow keys and scroll up and down the mailbox
  configure({
    ignoreRepeatedEventsWhenKeyHeldDown: false
  });

  // We are adding space at the top of the list for support animation hide/show on header
  const threadsWithSpacer = [{ threadID: '_spacer' }, ...threads];

  const emailsToRender = useMemo(() => {
    const renderMail = resultsToRender.map((result) => {
      const threadObj = result.thread;
      const foundEmail = threadObj.emails.find((email) => email.id === result.emailID);
      if (!foundEmail || !foundEmail.id || !threadObj?.threadID) {
        console.warn('Search query - did not find email', result.emailID);
        return null;
      }

      return {
        id: foundEmail?.id,
        itemType: SearchItemType.Skemail,
        subject: foundEmail?.decryptedSubject,
        content: foundEmail?.decryptedTextSnippet,
        threadID: threadObj?.threadID,
        createdAt: foundEmail?.createdAt,
        toAddresses: foundEmail?.to.map((address) => address.address),
        to: foundEmail?.to,
        ccAddresses: foundEmail?.cc.map((address) => address.address),
        cc: foundEmail?.cc,
        bccAddresses: foundEmail?.bcc.map((address) => address.address),
        bcc: foundEmail?.bcc,
        fromAddress: foundEmail?.from.address,
        from: foundEmail?.from,
        systemLabels: threadObj?.attributes.systemLabels,
        userLabels: threadObj?.attributes.userLabels,
        read: threadObj?.attributes.read,
        attachments: foundEmail.decryptedAttachmentMetadata
      };
    });
    return renderMail.filter(filterExists);
  }, [resultsToRender]);

  const searchSkemailsWithSpacer = [{ threadID: '_spacer' }, ...emailsToRender];

  const setMailBoxListOuterRef = useScrollActionBar(MOBILE_HEADER_HEIGHT, MAIL_LIST_HEADER_ID);

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
    // refetch threads when we switch labels
    // prevLabel will be undefined on first render, and we don't need to refetch then as the
    // mailbox query will already be triggered
    if (prevLabel !== undefined && prevLabel !== label) {
      void refetch();
    }
  }, [setSelectedThreadIDs, label, dispatch, prevLabel, refetch]);

  // Keeps track of the total number of rendered threads in the mailbox
  // Necessary for hotkey arrow key navigation
  useEffect(() => {
    dispatch(skemailMailboxReducer.actions.setRenderedMailboxThreadsCount(threads.length));
  }, [threads.length, dispatch]);

  // if the activeThread parsed from the URL changes, update the active thread
  useEffect(() => {
    if (activeThreadID !== activeThreadAndEmailIDsFromURL.activeThreadID) {
      // dispatch redux action vs calling setActiveThreadID so we do not change the URL
      dispatch(skemailMailboxReducer.actions.setActiveThread(activeThreadAndEmailIDsFromURL));
    }
  }, [activeThreadID, activeThreadAndEmailIDsFromURL, setActiveThreadID, dispatch]);

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

    // more to fetch - add 1 so you can scroll beyond the last item for pagination
    const searchItemCount =
      resultThreadEmailIds.length > startingIndexToFetch
        ? resultThreadEmailIds.length + 1
        : resultThreadEmailIds.length;

    // checks whether a certain item has loaded
    const isItemLoaded = (index: number) => !hasNextPage || index < threads.length;
    const isItemLoadedSearch = (index: number) => index < searchSkemailsWithSpacer.length;
    // callback that returns a promise that resolves to additional data for the list
    const loadMoreItems = async () => {
      // if in search
      if (displayMobileSearchResults) {
        setStartingIndexToFetch(startingIndexToFetch + MAX_THREADS_TO_QUERY);
        return;
      }
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
                threshold={20}
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
                      isDraft: label === SystemLabels.Drafts,
                      setActiveThreadID
                    }}
                    itemKey={(index, dataToRender) => {
                      const { threads: threadsToRender } = dataToRender;
                      const item = threadsToRender[index];
                      return item?.threadID ?? '';
                    }}
                    itemSize={(i) => (i === 0 ? spacerHeight : itemHeight)}
                    key={isRefreshing ? 'refreshed-message-list' : 'message-list'} // this allows for the mailbox to reload to the top on refreshes
                    onItemsRendered={onItemsRendered}
                    onScroll={(e) => {
                      scrollOffset.current = e.scrollOffset;
                    }}
                    outerRef={(outerRef) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                      setMailBoxListOuterRef(outerRef);
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        {displayMobileSearchResults && !!resultThreadEmailIds.length && (
          <Autosizer>
            {({ height, width }) => (
              <InfiniteLoader
                isItemLoaded={isItemLoadedSearch}
                itemCount={searchItemCount}
                loadMoreItems={loadMoreItems}
                threshold={20}
              >
                {({ ref, onItemsRendered }) => (
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
                    itemKey={(index, searchData) => {
                      const { skemails } = searchData;
                      const item = skemails[index];
                      return item?.id ?? '';
                    }}
                    itemSize={(i) => (i === 0 ? spacerHeight : itemHeight)}
                    onItemsRendered={onItemsRendered}
                    onScroll={(e) => {
                      scrollOffset.current = e.scrollOffset;
                    }}
                    outerRef={(outerRef) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                      setMailBoxListOuterRef(outerRef);
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                      windowedListOuterRef.current = outerRef;
                    }}
                    overscanCount={10}
                    ref={(list) => {
                      ref(list);
                      windowedListRef.current = list;
                    }}
                    style={{ overflowX: 'hidden', paddingBottom: iosKeyboardHeight }}
                    width={width}
                  >
                    {MailboxMobileSearchItem}
                  </VariableSizeList>
                )}
              </InfiniteLoader>
            )}
          </Autosizer>
        )}
      </MessageList>
    );

    return messageList;
  };

  const showLoadingMailbox = loading && !isRefreshing;

  const refetchThreads = async () => {
    await refetch({
      request: {
        label,
        cursor: null,
        limit: DEFAULT_MAILBOX_LIMIT,
        filters,
        refetching: true,
        platformInfo: {
          isIos: isIOS,
          isAndroid,
          isMacOs,
          isMobile,
          isReactNative: !!window.ReactNativeWebView,
          isSkiffWindowsDesktop: !!window.IsSkiffWindowsDesktop
        }
      }
    });
  };

  const renderMailboxInnerContainer = () => {
    const displayLabelName = getLabelDisplayName(labelName);

    const mailboxInner = (
      <>
        {showLoadingMailbox && <LoadingMailbox />}
        {!loading && !threads.length && (
          <EmptyIllustration
            action={
              isImported
                ? {
                    label: 'Import mail',
                    onClick: () => {
                      openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
                    }
                  }
                : undefined
            }
            illustration={
              isImported ? (
                <EmptyIllustrationContainer>
                  <Illustration illustration={Illustrations.OpenEnvelope} theme={theme} />
                </EmptyIllustrationContainer>
              ) : undefined
            }
            subtitle={
              isImported
                ? 'Import your old emails into Skiff'
                : `You have no emails in ${displayLabelName.toLowerCase()}`
            }
            title={isImported ? 'No mail imported yet' : `${displayLabelName} empty`}
          />
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
              await refetchThreads();
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

  const showActivationChecklist =
    enableActivationChecklist &&
    !hideActivationChecklist &&
    !activeSubscriptionLoading &&
    // only admins can change tiers and redeem trials
    currentUserIsOrgAdmin &&
    activeSubscription === SubscriptionPlan.Free &&
    !isMobile &&
    ((!isCompact && threadFormat === ThreadDisplayFormat.Right) || !messageDetailsPanelOpen);

  return (
    <MailboxContainer>
      <MailboxListThread>
        <MailboxHeaderBody
          $activeThreadID={!!activeThreadID && !isDrafts}
          $fullView={isCompact ?? threadFormat === ThreadDisplayFormat.Full}
          id={MAIL_LIST_CONTAINER_ID}
        >
          <MailboxHeader
            onClick={isMobile ? scrollToTopOfMailbox : undefined}
            onRefresh={async () => {
              if (networkStatus === NetworkStatus.poll) {
                return;
              }
              setIsRefreshing(true);
              await refetchThreads();
              setIsRefreshing(false);
            }}
            setClearAll={() => setSelectedThreadIDs([])}
            setMobileSearchQuery={(newQuery: string) => {
              setMobileSearchQuery(newQuery);
              searchForQuery(newQuery);
              setStartingIndexToFetch(0);
            }}
            setSelectAll={() => {
              if (displayMobileSearchResults && resultThreadEmailIds.length) {
                setSelectedThreadIDs(resultThreadEmailIds.map((id) => id.threadID));
              } else {
                setSelectedThreadIDs(threads.map((t) => t.threadID));
              }
            }}
            showSkeleton={showLoadingMailbox}
            threads={threads}
          />
          <MailboxBody data-test='mailbox-body'>{renderMailboxInnerContainer()}</MailboxBody>
        </MailboxHeaderBody>
        <AnimatePresence>
          <MessageDetailsPanel
            key={activeThreadID}
            open={messageDetailsPanelOpen}
            setActivationPaneOffsetWidth={setActivationPaneOffset}
          >
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
        {showActivationChecklist && <ActivationPaneToggle rightOffset={activationPaneOffset} />}
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
              size={Size.LARGE}
            />
          </QuickComposeButton>
        )}
        <MobileBottomNavigation threads={threads} />
      </MobileView>
    </MailboxContainer>
  );
};
