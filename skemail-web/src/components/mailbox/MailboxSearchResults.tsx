import { AnimatePresence } from 'framer-motion';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import { Alignment, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import Autosizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useGetThreadsFromIDsQuery } from 'skiff-front-graphql';
import {
  EmptyIllustration,
  useCurrentUserEmailAliases,
  useMediaQuery,
  usePrevious,
  useUserPreference
} from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { filterExists, StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT, FULL_VIEW_BREAKPOINT } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import { useGetSearchIndexProgress } from '../../hooks/useSearchWorker';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailHotKeysReducer } from '../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { RootState } from '../../redux/store/reduxStore';
import { HiddenLabels } from '../../utils/label';
import { getItemHeight } from '../../utils/mailboxUtils';
import { SkemailResultThreadInfo } from '../../utils/search/searchTypes';
import { useSearch } from '../../utils/search/useSearch';
import { MoveToLabelDropdown } from '../labels/MoveToLabelDropdown';
import Thread from '../Thread';
import { ThreadNavigationIDs } from '../Thread/Thread.types';

import { useRestoreScroll } from '../../hooks/useRestoreScroll';
import { MAIL_LIST_CONTAINER_ID } from './consts';
import { LoadingMailbox } from './LoadingMailbox';
import { useMailboxActions, useMailboxActionsRefs } from './MailboxActions/useMailboxActions';
import { MailboxHeader } from './MailboxHeader';
import MailboxSearchResultItem from './MailboxItem/MailboxSearchResultItem';
import MailboxProgressItem from './MailboxProgress/MailboxProgressItem';
import MailboxProgressView from './MailboxProgress/MailboxProgressView';
import MessageDetailsPanel from './MessageDetailsPanel';

const MailboxContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
`;

const MailboxListThread = styled.div`
  flex: 1;
  display: flex;
  overflow-y: hidden;
`;

const MailboxHeaderBody = styled.div<{ $activeThreadID: boolean; $fullView: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  ${({ $activeThreadID }) => (!$activeThreadID && isMobile ? 'transform: translateX(0) !important;' : '')}
  border-right: ${({ $fullView, $activeThreadID }) =>
    $fullView && !!$activeThreadID ? 'none' : '1px solid var(--border-tertiary)'};
  padding: 0px;
`;

const MailboxBody = styled.div`
  flex: 1;
  display: flex;
  padding-bottom: 0;
  overflow-y: hidden;
`;

const MessageList = styled.div<{ $threadFormat: ThreadDisplayFormat }>`
  flex: 1;
  display: flex;
  min-width: ${(props) => `${props.$threadFormat === ThreadDisplayFormat.Right ? '280px' : '0px'}`};
  height: 100%;
  width: 100%;
  flex-direction: column;
  ${isMobile ? 'height: 100%; overflow-y: hidden;' : ''}
`;

const MAX_THREADS_TO_QUERY = 50;

const getSearchIndexProgressText = (center?: boolean, isCompact?: boolean) => (
  <>
    <Typography size={isCompact ? TypographySize.SMALL : undefined} weight={TypographyWeight.MEDIUM}>
      Creating private search index
    </Typography>
    <Typography
      align={center ? Alignment.CENTER : undefined}
      color='secondary'
      size={isCompact ? TypographySize.SMALL : undefined}
      wrap={center}
    >
      Results will be complete when your device finishes decrypting all mail.
    </Typography>
  </>
);

export const MailboxSearchResults = () => {
  const {
    skemailSearchResults: searchResultEmails,
    isSearchInProgress,
    lastSubmittedMailboxQuery,
    lastSubmittedSearchFilters
  } = useSearch();
  const isCompact = useMediaQuery(`(max-width:${FULL_VIEW_BREAKPOINT}px)`);
  const { progress: searchIndexProgress, progressRetrievalError: searchIndexProgressRetrievalError } =
    useGetSearchIndexProgress();
  const { mailboxLabelsDropdownOpen, mailboxMoveFolderDropdownOpen } = useAppSelector((state) => state.hotkeys);
  const { labelRef, folderRef } = useMailboxActionsRefs();
  const windowedListRef = useRef<FixedSizeList | null>(null);
  const [listWidth, setListWidth] = useState<number>(0);
  const scrollOffset = useRef<number>(0);

  const dispatch = useDispatch();

  const clearLastSelectedIndex = useCallback(() => {
    dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(null));
  }, [dispatch]);

  const showIndexProgress =
    lastSubmittedMailboxQuery &&
    !!searchIndexProgress &&
    !searchIndexProgressRetrievalError &&
    !searchIndexProgress.isIndexComplete;

  const [startingIndexToFetch, setStartingIndexToFetch] = useState(0);
  const [resultsToRender, setResultsToRender] = useState<SkemailResultThreadInfo[]>([]);
  const resultThreads = resultsToRender.map((t) => t.thread);

  useRestoreScroll(windowedListRef, scrollOffset, resultThreads, false, listWidth);

  const { mailboxActions } = useMailboxActions({
    threads: resultThreads,
    label: HiddenLabels.Search,
    clearLastSelectedIndex
  });

  // we only show the loading skeleton on first search; after that, previous results are shown while new search in progress
  const [isFirstSearchComplete, setIsFirstSearchComplete] = useState(false);

  const { composeOpen } = useSelector((state: RootState) => state.modal);
  const prevComposeOpen = usePrevious(composeOpen);

  const { walletAliasesWithName } = useCurrentUserEmailAliases();
  const { activeThreadID, activeEmailID, setActiveThreadID } = useThreadActions();

  // Redux actions
  // Memoize with `useCallback` so that `useEffect` dependencies don't change every render
  const setSelectedThreadIDs = useCallback(
    (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs })),
    [dispatch]
  );

  useEffect(() => {
    // Unselect threads when we switch labels
    setSelectedThreadIDs([]);
    dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(null));
  }, [dispatch, setSelectedThreadIDs]);

  // reset the starting index and select state when a new search begins
  useEffect(() => {
    if (isSearchInProgress) {
      setStartingIndexToFetch(0);
      setSelectedThreadIDs([]);
      dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(null));
    }
  }, [isSearchInProgress, dispatch, setSelectedThreadIDs]);

  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const messageListRef = useRef<HTMLDivElement>(null);
  const iosKeyboardHeight = useIosKeyboardHeight('mailbox');

  const { openDraft } = useDrafts();

  const resultThreadIds = searchResultEmails.map((result) => result.threadID);
  const resultEmailIds = searchResultEmails.map((result) => result.emailID);
  // Fetch thread objects
  const threadIDsToFetch = uniq(
    resultThreadIds.slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
  );

  const { loading: resultThreadsLoading } = useGetThreadsFromIDsQuery({
    variables: { threadIDs: threadIDsToFetch },
    onCompleted: (data) => {
      // Calculate the search results to render given the thread objects fetched from the server
      const newResultsToRender =
        resultEmailIds
          .slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
          .map((resultEmailId) => {
            const { threadID, match } = searchResultEmails.find((result) => result.emailID === resultEmailId) || {};
            const thread = data?.userThreads?.find((t) => t?.threadID === threadID);
            if (!thread || !match) {
              return undefined;
            }
            return { emailID: resultEmailId, thread, match };
          })
          .filter(filterExists) ?? [];
      setResultsToRender((results) =>
        results && startingIndexToFetch > 0
          ? uniqBy([...results.filter(filterExists), ...newResultsToRender], (r) => r.emailID)
          : newResultsToRender
      );
    }
  });

  const setActiveResult = useCallback(
    (activeThreadAndEmail: ThreadNavigationIDs | undefined) => {
      const { threadID, emailID } = activeThreadAndEmail || {};
      if (!threadID) {
        setActiveThreadID(undefined);
        return;
      }

      setActiveThreadID({ threadID, emailID });
      // if the new active thread/email is a draft, open up the compose panel with the draft;
      // this function does nothing if thread is not a draft
      openDraft(threadID, emailID);
    },
    [openDraft, setActiveThreadID]
  );

  // Unset active thread and email if the compose panel was open and now is closed
  useEffect(() => {
    if (prevComposeOpen && !composeOpen) {
      setActiveResult(undefined);
    }
    // Only run when the compose panel is opened/closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeOpen]);

  // Scroll to the active email
  useEffect(() => {
    if (!activeEmailID) return;
    const msg = document.getElementById(activeEmailID);
    if (!!msg && !!messageListRef.current) {
      const { top: msgTop, bottom: msgBottom } = msg.getBoundingClientRect();
      const { top: bodyTop, bottom: bodyBottom } = messageListRef.current.getBoundingClientRect();
      const withinViewport = msgTop >= bodyTop && msgBottom <= bodyBottom;
      if (!withinViewport) {
        const alignToTop = msgTop < bodyTop;
        msg.scrollIntoView(alignToTop);
      }
    }
  }, [activeEmailID]);

  // set flag after first search done
  useEffect(() => {
    if (
      (lastSubmittedMailboxQuery || lastSubmittedSearchFilters?.length) &&
      !resultThreadsLoading &&
      !isFirstSearchComplete
    ) {
      setIsFirstSearchComplete(true);
    }
  }, [isFirstSearchComplete, resultThreadsLoading, lastSubmittedMailboxQuery, lastSubmittedSearchFilters?.length]);

  const itemHeight = useCallback(
    (width: number) => {
      setListWidth(width);
      // Assuming the getItemHeight function is already appropriately implemented
      return getItemHeight(isMobile, width < COMPACT_MAILBOX_BREAKPOINT);
    },
    [isMobile]
  );
  const activeThread = resultsToRender.find((result) => result.thread.threadID === activeThreadID)?.thread;
  const isActiveThreadDraft = activeThread?.attributes.systemLabels.includes(SystemLabels.Drafts);
  // Is the side panel open
  // Do not open the side panel if the active thread is a draft (compose panel will instead be open)
  const messageDetailsPanelOpen = !!activeThreadID && !isActiveThreadDraft;

  const renderSearchResults = () => {
    const isItemLoaded = (index: number) => {
      return index < startingIndexToFetch + MAX_THREADS_TO_QUERY;
    };

    const loadMoreItems = () => {
      // set new index to start fetching from
      setStartingIndexToFetch(startingIndexToFetch + MAX_THREADS_TO_QUERY);
    };

    return (
      <MessageList $threadFormat={isCompact ? ThreadDisplayFormat.Full : threadFormat} ref={messageListRef}>
        {!!resultsToRender.length && (
          <Autosizer>
            {({ height, width }) => (
              <>
                {showIndexProgress && (
                  <MailboxProgressItem
                    description={getSearchIndexProgressText(undefined, width < COMPACT_MAILBOX_BREAKPOINT)}
                    progress={{
                      numProcessed: searchIndexProgress.numThreadsIndexed,
                      numToProcess: searchIndexProgress.numIndexableThreads
                    }}
                    width={width}
                  />
                )}
                <InfiniteLoader
                  isItemLoaded={isItemLoaded}
                  itemCount={resultThreadIds.length}
                  loadMoreItems={loadMoreItems}
                  threshold={8}
                >
                  {({ ref, onItemsRendered }) => (
                    <FixedSizeList
                      height={height - iosKeyboardHeight}
                      itemCount={resultsToRender.length}
                      itemData={{
                        searchResults: resultsToRender,
                        setActiveResult,
                        listWidth: width,
                        activeEmailID,
                        walletAliasesWithName,
                        mailboxActions
                      }}
                      ref={(list) => {
                        ref(list);
                        windowedListRef.current = list;
                      }}
                      onScroll={(e) => {
                        scrollOffset.current = e.scrollOffset;
                      }}
                      itemKey={(index, data) => data.searchResults[index]?.emailID ?? ''}
                      itemSize={itemHeight(width)}
                      onItemsRendered={onItemsRendered}
                      overscanCount={10}
                      style={{ overflowX: 'hidden', paddingBottom: iosKeyboardHeight }}
                      width={width}
                    >
                      {MailboxSearchResultItem}
                    </FixedSizeList>
                  )}
                </InfiniteLoader>
              </>
            )}
          </Autosizer>
        )}
      </MessageList>
    );
  };

  // if searchIndexProgress has yet to resolve and there are no results to render, we don't know whether
  // the search returned no results because there are genuinely no results or because the index is not yet complete,
  // so we show loading skeleton until indexing progress is determined
  // (or until there's a retrieval error, in which case we fall back to the "No Results" illustration)
  const noResults = resultsToRender.length === 0;
  const shouldWaitForIndexProgress = noResults && !searchIndexProgress && !searchIndexProgressRetrievalError;
  // we show a loading state only during the first search after each component mount;
  // subsequent searches show results from previous search while new search is in progress
  const showSkeleton =
    !isFirstSearchComplete &&
    ((resultThreadsLoading && startingIndexToFetch === 0) || shouldWaitForIndexProgress || isSearchInProgress);

  const renderMailboxBody = () => {
    if (showSkeleton) {
      return <LoadingMailbox />;
    }

    if (noResults) {
      // show index progress if there are no results and the search index is not yet complete
      return showIndexProgress ? (
        <MailboxProgressView
          actionLabel='indexed'
          description={getSearchIndexProgressText(true)}
          progress={{
            numProcessed: searchIndexProgress.numThreadsIndexed,
            numToProcess: searchIndexProgress.numIndexableThreads
          }}
        />
      ) : (
        <EmptyIllustration
          subtitle={lastSubmittedMailboxQuery ? 'No emails match the query' : 'Enter a query to search'}
          title='No results'
        />
      );
    }

    return renderSearchResults();
  };

  const activeEmailIDIndex = resultsToRender.findIndex((result) => result.emailID === activeEmailID) || 0;
  const nextSearchResult = resultsToRender[activeEmailIDIndex + 1];
  const prevSearchResult = resultsToRender[activeEmailIDIndex - 1];

  return (
    <MailboxContainer>
      <MailboxListThread>
        <MailboxHeaderBody
          $activeThreadID={!!activeThreadID}
          $fullView={isCompact ?? threadFormat === ThreadDisplayFormat.Full}
          id={MAIL_LIST_CONTAINER_ID}
        >
          <MailboxHeader
            onRefresh={async () => {}}
            setClearAll={() => setSelectedThreadIDs([])}
            setMobileSearchQuery={() => {
              // Search page should never appear on mobile
            }}
            setSelectAll={() => {
              setSelectedThreadIDs(resultsToRender.map((t) => t.thread.threadID));
            }}
            showSkeleton={false}
            threads={resultThreads}
            walletAliasesWithName={walletAliasesWithName}
          />
          <MailboxBody>{renderMailboxBody()}</MailboxBody>
        </MailboxHeaderBody>
        <AnimatePresence>
          <MessageDetailsPanel key={activeEmailID} open={messageDetailsPanelOpen}>
            {activeThreadID && (
              <Thread
                emailID={activeEmailID}
                nextThreadAndEmail={
                  nextSearchResult
                    ? { threadID: nextSearchResult.thread.threadID, emailID: nextSearchResult.emailID }
                    : undefined
                }
                onClose={() => {
                  setActiveResult(undefined);
                }}
                prevThreadAndEmail={
                  prevSearchResult
                    ? { threadID: prevSearchResult.thread.threadID, emailID: prevSearchResult.emailID }
                    : undefined
                }
                setActiveThreadAndEmail={setActiveResult}
                threadID={activeThreadID}
                walletAliasesWithName={walletAliasesWithName}
              />
            )}
          </MessageDetailsPanel>
        </AnimatePresence>
      </MailboxListThread>
      <MoveToLabelDropdown
        buttonRef={labelRef}
        currentSystemLabels={[HiddenLabels.Search]}
        onClose={() => dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen(false))}
        open={mailboxLabelsDropdownOpen}
      />
      <MoveToLabelDropdown
        buttonRef={folderRef}
        currentSystemLabels={[HiddenLabels.Search]}
        onClose={() => dispatch(skemailHotKeysReducer.actions.setMailboxMoveFolderDropdownOpen(false))}
        open={mailboxMoveFolderDropdownOpen}
        variant={UserLabelVariant.Folder}
      />
    </MailboxContainer>
  );
};

export default MailboxSearchResults;
