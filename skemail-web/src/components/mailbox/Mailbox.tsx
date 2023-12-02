import { NetworkStatus } from '@apollo/client';
import { AnimatePresence } from 'framer-motion';
import { useFlags } from 'launchdarkly-react-client-sdk';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import { Icon, IconButton, Size } from 'nightwatch-ui';
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
  DottedGrid,
  EmptyIllustration,
  FreeCustomDomainToastState,
  getEnvironment,
  Illustration,
  Illustrations,
  isReactNativeDesktopApp,
  isWindowsDesktopApp,
  sendRNWebviewMsg,
  SettingValue,
  TabPage,
  useCurrentUserEmailAliases,
  useCurrentUserIsOrgAdmin,
  useGetFF,
  useLocalSetting,
  useMediaQuery,
  usePrevious,
  useRequiredCurrentUserData,
  UserPreferenceKey,
  useScrollActionBar,
  useSyncSavedAccount,
  useUserPreference
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
  FreeCustomDomainFeatureFlag,
  POLL_INTERVAL_IN_MS,
  StorageTypes
} from 'skiff-utils';
import styled from 'styled-components';

import {
  COMPACT_MAILBOX_BREAKPOINT,
  DEFAULT_MAILBOX_LIMIT,
  FULL_VIEW_BREAKPOINT
} from '../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { useDrafts } from '../../hooks/useDrafts';
import { IMPORT_PROGRESS_UPDATE_INTERVAL } from '../../hooks/useImportProgress';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import { useQuickAliasFilterLabelIDs } from '../../hooks/useQuickAliasFilterLabelIDs';
import { useRestoreScroll } from '../../hooks/useRestoreScroll';
import { useThreadActions } from '../../hooks/useThreadActions';
import { useUpdateNextAndPrevActiveIDs } from '../../hooks/useUpdateNextAndPrevActiveIDs';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailHotKeysReducer } from '../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getLabelDisplayName, LABEL_TO_SYSTEM_LABEL } from '../../utils/label';
import { getInitialThreadParams } from '../../utils/locationUtils';
import { getMailboxActionProgressDescription, isMutexBulkAction } from '../../utils/mailboxActionUtils';
import { getItemHeight, scrollThreadIntoView } from '../../utils/mailboxUtils';
import { runClientSideMailFilters } from '../../utils/mailFiltering/mailFiltering';
import { markThreadsAsRead } from '../../utils/mailFiltering/mailFiltering.utils';
import { useSearch } from '../../utils/search/useSearch';
import { SearchItemType, SearchSkemail } from '../../utils/searchWorkerUtils';
import { MoveToLabelDropdown } from '../labels/MoveToLabelDropdown';
import { useHandleMailto } from '../layout/handleOpenMailto';
import { useSettings } from '../Settings/useSettings';
import MobileBottomNavigation from '../shared/BottomNavigation/MobileBottomNavigation';
import LazyPinchZoom from '../Thread/MailHTMLView/PinchZoom/LazyPinchZoom';
import Thread from '../Thread/Thread';

import ActivationPaneToggle from './ActivationPane/ActivationPaneToggle';
import { MAIL_LIST_CONTAINER_ID } from './consts';
import { importProgressCopy } from './ImportProgress/ImportProgress.constants';
import { ImportProgressItem } from './ImportProgress/ImportProgressItem';
import LoadingMailbox from './LoadingMailbox';
import { fadeInAnimation } from './Mailbox.styles';
import MobileFilterDrawer from './MailboxActions/MobileFilterDrawer';
import MobileMailboxSelectDrawer from './MailboxActions/MobileMailboxSelectDrawer';
import { useMailboxActions, useMailboxActionsRefs } from './MailboxActions/useMailboxActions';
import { animateMailListHeader, MAIL_LIST_HEADER_ID, MailboxHeader, MOBILE_HEADER_HEIGHT } from './MailboxHeader';
import MailboxItem from './MailboxItem/MailboxItem';
import MailboxMobileSearchItem from './MailboxItem/MailboxMobileSearchItem';
import { getProgressViewText } from './MailboxProgress/MailboxProgress.constants';
import { MAIL_PROGRESS_ITEM_HEIGHT } from './MailboxProgress/MailboxProgressItem';
import MailboxProgressView from './MailboxProgress/MailboxProgressView';
import MessageDetailsPanel from './MessageDetailsPanel';
import MobilePullToRefresh from './MobilePullToRefresh/MobilePullToRefresh';
import { FreeCustomDomainToast } from './toasts/FreeCustomDomainToast';
import { ImportAndSuggestionsCompleteToast } from './toasts/ImportAndSuggestionsCompleteToast';
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
  overflow-x: hidden;
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

const EmptyGridContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;
  width: 100%;
  overflow: hidden;
`;

const ZindexContainer = styled.div`
  position: relative;
  z-index: 9;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
`;

const EmptyIllustrationContainer = styled.div`
  width: 148px;
  height: 148px;
  > span {
    width: 148px;
    height: 148px;
  }
`;

const SYSTEM_LABELS_TO_POLL: Set<string> = new Set([
  SystemLabels.Inbox,
  SystemLabels.Sent,
  SystemLabels.ScheduleSend,
  SystemLabels.QuickAliases
]);

const MAX_THREADS_TO_QUERY = 20;

export const Mailbox = () => {
  const { value: label, name: labelName } = useRouterLabelContext();
  const prevLabel = usePrevious(label);
  const { userLabelVariant } = useCurrentLabel();

  const flags = useFlags();
  const activationChecklistFF = flags.activationChecklist as ActivationChecklistFeatureFlag;

  const env = getEnvironment(new URL(window.location.origin));
  const enableActivationChecklist =
    env === 'local' || env === 'vercel' || activationChecklistFF === ActivationChecklistFeatureFlag.TRIAL;
  // need noSsr in useMediaQuery to avoid the first render returning isCompact as false
  const isCompact = useMediaQuery(`(max-width:${FULL_VIEW_BREAKPOINT}px)`, { noSsr: true });

  const activeThreadAndEmailIDsFromURL = getInitialThreadParams();
  const { activeThreadID, setActiveThreadID, trashThreads, moveThreads, archiveThreads } = useThreadActions();
  const { openSettings } = useSettings();
  const openQuickAliasTab = () => openSettings({ tab: TabPage.QuickAliases, setting: SettingValue.QuickAlias });

  const [isHovered, setIsHovered] = useState(false);

  // Redux actions
  const dispatch = useDispatch();
  const {
    prevActiveThreadID,
    nextActiveThreadID,
    filters,
    hoveredThreadIndex,
    hoveredThreadID,
    pendingReplies,
    pendingMailboxAction,
    inProgressBulkAction,
    selectedThreadIDs
  } = useAppSelector((state) => state.mailbox);
  const { composeOpen } = useAppSelector((state) => state.modal);
  const [listWidth, setListWidth] = useState<number>(0);
  const quickAliasFilterLabelIDs = useQuickAliasFilterLabelIDs();
  const prevQuickAliasFilterLabelIDs = usePrevious(quickAliasFilterLabelIDs);
  const quickAliasFilterChanged = prevQuickAliasFilterLabelIDs
    ? !isEqual(sortBy(quickAliasFilterLabelIDs), sortBy(prevQuickAliasFilterLabelIDs))
    : !!quickAliasFilterLabelIDs.length;

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

  const [freeCustomDomainToastStatus] = useLocalSetting(StorageTypes.INTRO_FREE_CUSTOM_DOMAIN);
  const [hideImportComplete] = useLocalSetting(StorageTypes.HIDE_IMPORT_COMPLETE);

  // user preference to persistently hide the activation checklist
  const [hideActivationChecklist] = useUserPreference(UserPreferenceKey.HIDE_ACTIVATION_CHECKLIST);

  // Keeps track of whether or not we are getting new threads because of pagination
  // This value is used for front end filtering, as we only want to run front end filters
  // after a poll or refetch result
  const isPaginating = useRef(false);
  const lastTimestampRanClientSideFilters = useRef<number>(0);

  // Index of the most recently selected thread
  const scrollOffset = useRef<number>(0);
  // Fetch aliases to determine whether to show welcome
  const [fetchEmailAliases] = useGetCurrentUserEmailAliasesLazyQuery();
  const { emailAliases: currentUserAliases, walletAliasesWithName, quickAliases } = useCurrentUserEmailAliases();

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

  const iosKeyboardHeight = useIosKeyboardHeight('mailbox');

  // add the logged in users data to local storage
  // so users can log back in more easily
  useSyncSavedAccount();
  useHandleMailto();

  /* Search hook is only used for mobile */

  // Note: We may eventually want to move mobile to an entirely separate component
  // since there's a growing number of difference like this
  const {
    mailboxQuery: mobileSearchQuery,
    setMailboxQuery: setMobileSearchQuery,
    skemailSearchResults: searchResultEmails,
    search: searchForQuery
  } = useSearch();

  const { mailboxLabelsDropdownOpen, mailboxMoveFolderDropdownOpen } = useAppSelector((state) => state.hotkeys);
  // give user the option to perform action on selected threads versus whole mailbox
  const displayMobileSearchResults = isMobile && !!mobileSearchQuery;
  const [resultsToRender, setResultsToRender] = useState<{ emailID: string; thread: MailboxThreadInfo }[]>([]);
  const [startingIndexToFetch, setStartingIndexToFetch] = useState(0);
  const resultThreadIds = searchResultEmails.map((result) => result.threadID);
  const resultEmailIds = searchResultEmails.map((result) => result.emailID);
  // Fetch thread objects
  const threadIDsToFetch = uniq(
    resultThreadIds.slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
  );
  const { refetch: refetchSearchThreads, networkStatus: searchThreadsNetworkStatus } = useGetThreadsFromIDsQuery({
    variables: { threadIDs: threadIDsToFetch },
    onCompleted: (data) => {
      // Calculate the search results to render given the thread objects fetched from the server
      const newResultsToRender =
        resultEmailIds
          .slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
          .map((resultEmailId) => {
            const threadID = searchResultEmails.find((result) => result.emailID === resultEmailId)?.threadID;
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
    skip: !resultThreadIds.length || !displayMobileSearchResults || !searchResultEmails,
    notifyOnNetworkStatusChange: true
  });

  useEffect(() => {
    void refetchSearchThreads();
  }, [startingIndexToFetch, refetchSearchThreads]);

  const isDrafts = label === SystemLabels.Drafts;
  const isImports = label === SystemLabels.Imports;
  const isQuickAliases = label === SystemLabels.QuickAliases;

  const { progress: importProgress, isImportInProgress } = useAppSelector((state) => state.import);
  const prevNumImported = usePrevious(importProgress?.numEmailsImported) ?? 0;
  const inProgressBulkActionOriginLabel = inProgressBulkAction?.bulkAction.originLabelValue;
  const pendingMailboxActionOriginLabel = pendingMailboxAction?.originLabelValue;

  const { draftThreads } = useDrafts();

  const getPollInterval = () => {
    if (SYSTEM_LABELS_TO_POLL.has(label)) return POLL_INTERVAL_IN_MS;
    // Poll more frequently for imports while an import is in progress so we show
    // imported emails as they come in
    if (isImports && isImportInProgress) return IMPORT_PROGRESS_UPDATE_INTERVAL;
    return undefined;
  };

  const filterQuickAliasThreads = isQuickAliases && !!quickAliasFilterLabelIDs.length;

  // when filtering in "Quick Aliases" mailbox, we pass an array of labelID's rather than system label
  const mailboxRequestLabel = {
    label: filterQuickAliasThreads ? undefined : label,
    userLabels: filterQuickAliasThreads ? quickAliasFilterLabelIDs : undefined
  };

  const mailboxRequestBase = {
    ...mailboxRequestLabel,
    cursor: null,
    limit: DEFAULT_MAILBOX_LIMIT,
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
    clientsideFiltersApplied: true
  };

  const {
    data: _data,
    fetchMore,
    refetch,
    networkStatus,
    error
  } = useMailboxQuery({
    variables: {
      request: {
        ...mailboxRequestBase,
        polling: true
      }
    },
    skip: !label,
    pollInterval: getPollInterval(),
    notifyOnNetworkStatusChange: true,
    onCompleted: (loadedData) => {
      // Only run frontend filtering logic on poll or refetch.
      // Do not run if we are just paginating, as we are not fetching for newly received threads
      const msSinceLastClientSideMailFiltersRun = Date.now() - lastTimestampRanClientSideFilters.current;
      // For the Imports mailbox, only rerun FE filtering if we're not paginating and enough
      // time has passed since the last run. Otherwise, we refetch too many times as new
      // emails are constantly coming in during the import
      const shouldRunClientSideMailFilters = isImports
        ? !isPaginating.current && msSinceLastClientSideMailFiltersRun >= POLL_INTERVAL_IN_MS
        : !isPaginating.current || msSinceLastClientSideMailFiltersRun >= POLL_INTERVAL_IN_MS * 2;
      if (shouldRunClientSideMailFilters) {
        void runClientSideMailFilters()?.then(async (numFiltered) => {
          // Do not refetch if the import is in progress
          if (numFiltered && numFiltered > 0) {
            console.log(`Filtered ${numFiltered} emails, requerying`);
            setIsRefreshing(true);
            await refetchThreads();
            setIsRefreshing(false);
          }
        });
        lastTimestampRanClientSideFilters.current = Date.now();
      }

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

  useEffect(() => {
    if (!isWindowsDesktopApp()) {
      return;
    }
    const notificationActionListener = (event: MessageEvent) => {
      // actions available are `openThread`, `markAsRead`, `markAsSpam`, `sendToTrash`, `archive`
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const parsedData = JSON.parse(event.data) as { type: string; data: { action: string; threadId: string } };
        if (parsedData.type === 'notificationAction') {
          const { action, threadId: threadID } = parsedData.data;
          if (action === 'openThread') {
            setActiveThreadID({ threadID });
          } else if (action === 'markAsRead') {
            void markThreadsAsRead([threadID]);
          } else if (action === 'markAsSpam') {
            void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
          } else if (action === 'sendToTrash') {
            void trashThreads([threadID], false);
          } else if (action === 'archive') {
            void archiveThreads([threadID]);
          }
        }
      } catch (err) {
        console.error('Failed to parse data for Windows action', err);
      }
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    chrome.webview.addEventListener('message', notificationActionListener);
    return () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      chrome.webview.removeEventListener('message', notificationActionListener);
    };
  }, []);

  // Only lock data when refreshing in order to get clean pull to refresh animation
  const data = useGatedMailboxData(_data, isRefreshing);
  const prevData = usePrevious({ ...data });
  useEffect(() => {
    // check for new messages for native notifications
    if (!isReactNativeDesktopApp() && !isWindowsDesktopApp()) {
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
      const notificationInfoForNativeApp = msgsFilteredByRecency.map((email) => {
        const threadIDforEmail = data?.mailbox?.threads.find((thread) =>
          thread.emails.find((threadEmail) => threadEmail.id === email.id)
        )?.threadID;
        return {
          title: email.from.name,
          body: email.decryptedSubject,
          emailID: email.id,
          threadID: threadIDforEmail
        };
      });
      if (isReactNativeDesktopApp()) {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'newMessageNotifications',
              data: { notificationData: notificationInfoForNativeApp }
            })
          );
        } catch (err) {
          console.error('Failed to send data to native app', err);
        }
      } else if (isWindowsDesktopApp()) {
        try {
          const message = {
            type: 'newMessageNotifications',
            data: { notificationData: notificationInfoForNativeApp }
          };

          // Windows WebView2 injects a global `window.chrome` object
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          chrome.webview.postMessage(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send data to Windows app', error);
        }
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

  const setLastSelectedIndex = useCallback(
    (index: number | null) => {
      dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(index));
    },
    [dispatch]
  );
  const clearLastSelectedIndex = useCallback(() => {
    setLastSelectedIndex(null);
  }, [setLastSelectedIndex]);

  const onRefreshMailbox = async () => {
    if (networkStatus === NetworkStatus.poll) {
      return;
    }
    setIsRefreshing(true);
    await refetchThreads();
    setIsRefreshing(false);
  };

  const threads: MailboxThreadInfo[] = useMemo(
    () => (isDrafts ? draftThreads : data?.mailbox?.threads ?? []),
    [data?.mailbox?.threads, draftThreads, isDrafts]
  );
  const threadIDs = threads.map((thread) => thread.threadID);
  const { mailboxActions, shouldConfirmSelectedOrAllThreads } = useMailboxActions({
    threads,
    label,
    clearLastSelectedIndex,
    onRefresh: onRefreshMailbox
  });
  const { labelRef, folderRef } = useMailboxActionsRefs();
  useUpdateNextAndPrevActiveIDs(threadIDs);

  const hasFreeCustomDomainFF = useGetFF<FreeCustomDomainFeatureFlag>('freeCustomDomain');

  const showImportedProgress =
    (isImportInProgress || (importProgress?.areImportsComplete && !importProgress?.silencingSuggestionsComplete)) &&
    isImports;

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
    (newSelectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: newSelectedThreadIDs })),
    [dispatch]
  );

  useEffect(() => {
    // Unselect threads when we switch labels
    setSelectedThreadIDs([]);
    dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(null));
    const firstMailImported =
      importProgress && importProgress?.numEmailsImported > prevNumImported && prevNumImported === 0;
    // refetch threads when we switch labels
    // prevLabel will be undefined on first render, and we don't need to refetch then as the
    // mailbox query will already be triggered
    // also refetch if we started an import and this is the first time we are processing
    // imported emails
    if ((prevLabel !== undefined && prevLabel !== label) || firstMailImported || quickAliasFilterChanged) {
      void refetch();
    }
  }, [
    setSelectedThreadIDs,
    label,
    dispatch,
    prevLabel,
    refetch,
    isImportInProgress,
    prevNumImported,
    importProgress,
    quickAliasFilterChanged
  ]);

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
  useRestoreScroll(windowedListRef, scrollOffset, threads, !!displayMobileSearchResults, listWidth);

  const itemHeight = useCallback((width: number) => {
    // Assuming the getItemHeight function is already appropriately implemented
    setListWidth(width);
    return getItemHeight(isMobile, width < COMPACT_MAILBOX_BREAKPOINT);
  }, []);

  const onResize = () => {
    if (windowedListRef.current) {
      windowedListRef.current.resetAfterIndex(0, true);
    }
  };

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
      searchResultEmails.length > startingIndexToFetch ? searchResultEmails.length + 1 : searchResultEmails.length;

    // checks whether a certain item has loaded
    const isItemLoaded = (index: number) => !hasNextPage || index < threads.length;
    const isItemLoadedSearch = (index: number) => index < searchSkemailsWithSpacer.length;
    // callback that returns a promise that resolves to additional data for the list
    const loadMoreItems = async () => {
      // Do not load more items if we are already fetching more
      if (networkStatus === NetworkStatus.fetchMore) {
        return;
      }

      // if in search
      // Only reset if there is no current in flight query to get search results
      if (displayMobileSearchResults && searchThreadsNetworkStatus === NetworkStatus.ready) {
        setStartingIndexToFetch(startingIndexToFetch + MAX_THREADS_TO_QUERY);
        return;
      }

      isPaginating.current = true;
      await fetchMore({
        variables: {
          request: {
            ...mailboxRequestLabel,
            cursor,
            limit: DEFAULT_MAILBOX_LIMIT,
            filters
          }
        }
      });
      isPaginating.current = false;
    };

    const spacerHeight = isMobile ? MOBILE_HEADER_HEIGHT : 0;

    const messageList = (
      <MessageList ref={messageListRef} threadFormat={isCompact ? ThreadDisplayFormat.Full : threadFormat}>
        {!displayMobileSearchResults && (
          <Autosizer onResize={onResize}>
            {({ height, width }) => (
              <>
                {showImportedProgress && !loading && (
                  <ImportProgressItem numProcessed={importProgress?.numEmailsImported ?? 0} width={width} />
                )}
                <InfiniteLoader
                  isItemLoaded={isItemLoaded}
                  itemCount={itemCount}
                  loadMoreItems={loadMoreItems}
                  threshold={20}
                >
                  {({ ref, onItemsRendered }) => (
                    <VariableSizeList
                      className='variable-size-list'
                      estimatedItemSize={itemHeight(width)}
                      height={height - iosKeyboardHeight - (showImportedProgress ? MAIL_PROGRESS_ITEM_HEIGHT : 0)}
                      itemCount={threadsWithSpacer.length}
                      itemData={{
                        threads: threadsWithSpacer as MailboxThreadInfo[],
                        selectedThreadIDs,
                        listWidth: width,
                        mobileMultiItemsActive,
                        activeThreadID,
                        isDraft: label === SystemLabels.Drafts,
                        setActiveThreadID,
                        walletAliasesWithName,
                        mailboxActions
                      }}
                      itemKey={(index, dataToRender) => {
                        const { threads: threadsToRender } = dataToRender;
                        const item = threadsToRender[index];
                        return item?.threadID ?? '';
                      }}
                      itemSize={(i) => (i === 0 ? spacerHeight : itemHeight(width))}
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
                        paddingBottom: iosKeyboardHeight
                      }}
                      width={width - 1}
                    >
                      {MailboxItem}
                    </VariableSizeList>
                  )}
                </InfiniteLoader>
                <MoveToLabelDropdown
                  buttonRef={labelRef}
                  currentSystemLabels={[label]}
                  onClose={() => dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen(false))}
                  open={mailboxLabelsDropdownOpen}
                  shouldOfferBulkAction={shouldConfirmSelectedOrAllThreads}
                />
                <MoveToLabelDropdown
                  buttonRef={folderRef}
                  currentSystemLabels={[label]}
                  onClose={() => dispatch(skemailHotKeysReducer.actions.setMailboxMoveFolderDropdownOpen(false))}
                  open={mailboxMoveFolderDropdownOpen}
                  shouldOfferBulkAction={shouldConfirmSelectedOrAllThreads}
                  variant={UserLabelVariant.Folder}
                />
              </>
            )}
          </Autosizer>
        )}
        {displayMobileSearchResults && !!searchResultEmails.length && (
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
                    estimatedItemSize={itemHeight(width)}
                    height={height - iosKeyboardHeight}
                    itemCount={searchSkemailsWithSpacer.length}
                    itemData={{
                      skemails: searchSkemailsWithSpacer as SearchSkemail[],
                      selectedThreadIDs,
                      activeThreadID,
                      setActiveThreadID,
                      walletAliasesWithName
                    }}
                    itemKey={(index, searchData) => {
                      const { skemails } = searchData;
                      const item = skemails[index];
                      return item?.id ?? '';
                    }}
                    itemSize={(i) => (i === 0 ? spacerHeight : itemHeight(width))}
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

  const showLoadingMailbox =
    ((loading && !isRefreshing) ||
      // show loading rather than empty inbox following a mailbox action that affects all rendered threads
      // (e.g. moving all rendered threads to trash)
      (!!pendingMailboxAction && label === pendingMailboxActionOriginLabel && !threads.length)) &&
    !isImportInProgress;

  const refetchThreads = async () => {
    await refetch({
      request: {
        ...mailboxRequestBase,
        refetching: true
      }
    });
  };

  const renderEmptyMailbox = () => {
    const displayLabelName = getLabelDisplayName(labelName, walletAliasesWithName);

    return (
      <>
        {isImports && (
          <EmptyGridContainer>
            <ZindexContainer>
              <EmptyIllustration
                action={{
                  label: 'Import mail',
                  onClick: () => {
                    openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
                  },
                  setIsHovered,
                  isHovered
                }}
                illustration={
                  <EmptyIllustrationContainer>
                    <Illustration illustration={Illustrations.OpenEnvelope} />
                  </EmptyIllustrationContainer>
                }
                subtitle='Import external emails into Skiff'
                title='No mail imported yet'
              />
            </ZindexContainer>
            <DottedGrid isHovered={isHovered} width='calc(100vw - 242px)' />
          </EmptyGridContainer>
        )}
        {isQuickAliases && (
          <EmptyIllustration
            action={
              quickAliases.length === 0
                ? {
                    label: 'Get started',
                    onClick: openQuickAliasTab
                  }
                : undefined
            }
            illustration={<Illustration illustration={Illustrations.QuickAliasesEnvelope} />}
            subtitle={
              quickAliases.length === 0
                ? 'Set up Quick Aliases to create unlimited aliases on the fly'
                : 'No messages for selected Quick Aliases found.'
            }
            title={quickAliases.length === 0 ? 'You have no Quick Aliases yet' : 'Filters applied'}
          />
        )}
        {!(isImports || isQuickAliases) && (
          <EmptyIllustration
            subtitle={`You have no emails in ${displayLabelName.toLowerCase()}`}
            title={`${displayLabelName} empty`}
          />
        )}
      </>
    );
  };

  const renderMailboxBody = () => {
    // if a bulk action that will move every thread in this mailbox
    // is in progress, show the progress indicator
    if (
      inProgressBulkAction &&
      isMutexBulkAction(inProgressBulkAction.bulkAction.type) &&
      label === inProgressBulkActionOriginLabel
    ) {
      return (
        <MailboxProgressView
          description={getProgressViewText(
            getMailboxActionProgressDescription(inProgressBulkAction.bulkAction),
            'This will be done in a snap!'
          )}
          progress={
            inProgressBulkAction.isFinishing // stop the spinner when we're done and before progress view is gone; counter won't show so numbers are arbitrary completion state
              ? {
                  numProcessed: 1,
                  numToProcess: 1
                }
              : undefined
          }
        />
      );
    }

    if (showLoadingMailbox) {
      return <LoadingMailbox />;
    }

    if (!loading && !threads.length) {
      // show import progress if there are no results and the import is not yet complete
      return showImportedProgress ? (
        <MailboxProgressView
          actionLabel='imported'
          description={getProgressViewText(importProgressCopy.title, importProgressCopy.description, true)}
          progress={{
            numProcessed: importProgress?.numEmailsImported ?? 0
          }}
        />
      ) : (
        renderEmptyMailbox()
      );
    }

    return renderInfiniteLoader();
  };

  const renderMailboxInnerContainer = () => {
    const mailboxBody = renderMailboxBody();
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
            {mailboxBody}
          </MobilePullToRefresh>
        )}
        {!isMobile && mailboxBody}
      </>
    );
  };

  const scrollToTopOfMailbox = () => windowedListOuterRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  // Scroll the active thread into view
  useEffect(() => {
    scrollThreadIntoView(messageListRef, activeThreadID);
  }, [activeThreadID]);

  const [canShowPromoPanes, setCanShowPromoPanes] = useState<boolean>();
  const [showActivationChecklist, setShowActivationChecklist] = useState<boolean>();

  useEffect(() => {
    if (!activeSubscriptionLoading && currentUserIsOrgAdmin !== undefined) {
      const newCanShowPromoPanesState =
        currentUserIsOrgAdmin && activeSubscription === SubscriptionPlan.Free && !isMobile;
      setCanShowPromoPanes(newCanShowPromoPanesState);

      const newShowActivationChecklistState =
        newCanShowPromoPanesState &&
        enableActivationChecklist &&
        !hideActivationChecklist &&
        ((!isCompact && threadFormat === ThreadDisplayFormat.Right) || !messageDetailsPanelOpen);

      setShowActivationChecklist(newShowActivationChecklistState);
    }
    // Do not include hasSeenActivationChecklist in the dependency list.
    // This way, if we open the activation checklist and then close it, we
    // do not show the silencing toast immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSubscription,
    activeSubscriptionLoading,
    currentUserIsOrgAdmin,
    enableActivationChecklist,
    hideActivationChecklist,
    isCompact,
    messageDetailsPanelOpen,
    threadFormat,
    isMobile
  ]);

  const showFreeCustomDomainToast =
    canShowPromoPanes &&
    hasFreeCustomDomainFF &&
    freeCustomDomainToastStatus === FreeCustomDomainToastState.SHOULD_SHOW;

  // Only show the toast if silencing suggestions have finished generating
  // and the import is complete
  const showImportAndSuggestionsCompleteToast =
    importProgress?.areImportsComplete &&
    importProgress?.silencingSuggestionsComplete &&
    !hideImportComplete &&
    !isMobile;

  return (
    <MailboxContainer>
      {showFreeCustomDomainToast && <FreeCustomDomainToast />}
      {showImportAndSuggestionsCompleteToast && <ImportAndSuggestionsCompleteToast />}
      <MailboxListThread>
        <MailboxHeaderBody
          $activeThreadID={!!activeThreadID && !isDrafts}
          $fullView={isCompact ?? threadFormat === ThreadDisplayFormat.Full}
          id={MAIL_LIST_CONTAINER_ID}
        >
          <MailboxHeader
            onClick={isMobile ? scrollToTopOfMailbox : undefined}
            onRefresh={onRefreshMailbox}
            setClearAll={() => setSelectedThreadIDs([])}
            setMobileSearchQuery={(newQuery: string) => {
              setMobileSearchQuery(newQuery);
              void searchForQuery(newQuery);
              setStartingIndexToFetch(0);
            }}
            setSelectAll={() => {
              if (displayMobileSearchResults && searchResultEmails.length) {
                setSelectedThreadIDs(searchResultEmails.map((result) => result.threadID));
              } else {
                setSelectedThreadIDs(threadIDs);
              }
            }}
            showSkeleton={showLoadingMailbox}
            threads={threads}
            walletAliasesWithName={walletAliasesWithName}
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
                nextThreadAndEmail={nextActiveThreadID ? { threadID: nextActiveThreadID } : undefined}
                onClose={closeActiveThread}
                prevThreadAndEmail={prevActiveThreadID ? { threadID: prevActiveThreadID } : undefined}
                threadID={activeThreadID}
                walletAliasesWithName={walletAliasesWithName}
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
