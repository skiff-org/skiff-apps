import { FilledVariant, Icon, IconButton, InputField, Type, Typography } from '@skiff-org/skiff-ui';
import { AnimatePresence } from 'framer-motion';
import { useFlags } from 'launchdarkly-react-client-sdk';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import { useRouter } from 'next/router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import Autosizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useGetThreadsFromIDsQuery } from 'skiff-front-graphql';
import { EmptyIllustration, getEnvironment, useMediaQuery, usePrevious, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat } from 'skiff-graphql';
import { filterExists, SearchIndexProgressFeatureFlag, StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../constants/mailbox.constants';
import { useDrafts } from '../../hooks/useDrafts';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import { useSearch } from '../../hooks/useSearch';
import { useGetSearchIndexProgress } from '../../hooks/useSearchWorker';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { RootState } from '../../redux/store/reduxStore';
import { getItemHeight } from '../../utils/mailboxUtils';
import { SearchContext } from '../../utils/search/SearchProvider';
import { SkemailResultIDs } from '../../utils/search/searchTypes';
import Thread from '../Thread';
import { ThreadNavigationIDs } from '../Thread/Thread.types';

import { MAIL_LIST_CONTAINER_ID } from './consts';
import { LoadingMailbox } from './LoadingMailbox';
import { MailboxHeader } from './MailboxHeader';
import MailboxSearchResultItem from './MailboxItem/MailboxSearchResultItem';
import MessageDetailsPanel from './MessageDetailsPanel';
import SearchIndexProgressItem from './SearchIndexProgress/SearchIndexProgressItem';
import SearchIndexProgressView from './SearchIndexProgress/SearchIndexProgressView';

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

const MailboxHeaderBody = styled.div<{ $activeThreadID: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  ${({ $activeThreadID }) => (!$activeThreadID && isMobile ? 'transform: translateX(0) !important;' : '')}

  padding: 0px;
`;

const HeaderInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  gap: 16px;
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

const SearchBar = styled.div`
  width: 100%;
  margin-left: auto;
  max-width: 432px;
  padding-left: 16px;
`;

const TopBar = styled.div<{ $hide: boolean }>`
  visibility: ${(props) => `${props.$hide ? 'hidden' : 'visible'}`};
  display: flex;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
`;

const MAX_THREADS_TO_QUERY = 50;

export const MailboxSearchResults = () => {
  const searchBarRef = useRef<HTMLInputElement>(null);
  const { query, fullView, activeResult, isNewSearch, setIsNewSearch } = useContext(SearchContext);
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`);
  const env = getEnvironment(new URL(window.location.origin));
  const flags = useFlags();
  const hasSearchIndexProgressFlag =
    env === 'local' || env === 'vercel' || (flags.searchIndexProgress as SearchIndexProgressFeatureFlag);
  const { progress: searchIndexProgress, progressRetrievalError: searchIndexProgressRetrievalError } =
    useGetSearchIndexProgress(hasSearchIndexProgressFlag);

  const showIndexProgress =
    hasSearchIndexProgressFlag &&
    !!searchIndexProgress &&
    !searchIndexProgressRetrievalError &&
    !searchIndexProgress.isIndexComplete;

  // keep track of active thead and email IDs within the component instead of through the useThreadActions
  // hook since the active thread and email is not stored with the route path
  const [activeThreadID, setActiveThreadID] = useState<string | undefined>(activeResult?.threadID);
  const [activeEmailID, setActiveEmailID] = useState<string | undefined>(activeResult?.emailID);
  const [startingIndexToFetch, setStartingIndexToFetch] = useState(0);
  const [resultsToRender, setResultsToRender] = useState<{ emailID: string; thread: MailboxThreadInfo }[]>([]);

  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');

  const dispatch = useDispatch();
  const router = useRouter();

  const { composeOpen } = useSelector((state: RootState) => state.modal);
  const prevComposeOpen = usePrevious(composeOpen);

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

  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const messageListRef = useRef<HTMLDivElement>(null);
  const iosKeyboardHeight = useIosKeyboardHeight('mailbox');

  const { openDraft } = useDrafts();
  const { resultThreadEmailIds, searchForQuery, query: activeQuery, setQuery: setActiveQuery, reset } = useSearch();

  const resultThreadIds = resultThreadEmailIds.map((result) => result.threadID);
  const resultEmailIds = resultThreadEmailIds.map((result) => result.emailID);
  // Fetch thread objects
  const threadIDsToFetch = uniq(
    resultThreadIds.slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
  );

  const { loading, refetch: refetchThreads } = useGetThreadsFromIDsQuery({
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
          ? uniqBy([...results.filter(filterExists), ...newResultsToRender], (r) => r.emailID)
          : newResultsToRender
      );
    }
  });

  const setActiveResult = useCallback(
    (activeThreadAndEmail: ThreadNavigationIDs | undefined) => {
      const { threadID, emailID } = activeThreadAndEmail || {};
      setActiveThreadID(threadID);
      setActiveEmailID(emailID);

      if (!threadID) return;
      // if the new active thread/email is a draft, open up the compose panel with the draft;
      // this function does nothing if thread is not a draft
      openDraft(threadID, emailID);
    },
    [openDraft]
  );

  const startNewSearch = useCallback(
    (newActiveResult?: SkemailResultIDs, currentQuery?: string) => {
      // Reset state when a new search is submitted
      setActiveResult(newActiveResult);
      setIsNewSearch(true);
      searchForQuery(currentQuery ?? activeQuery);
      setStartingIndexToFetch(0);
      // If the query did not change, refetch the results
      if (activeQuery === lastSubmittedQuery) {
        void refetchThreads();
      }
      setIsNewSearch(false);
      setLastSubmittedQuery(activeQuery);
    },
    [activeQuery, lastSubmittedQuery, refetchThreads, searchForQuery, setActiveResult, setIsNewSearch]
  );

  useEffect(() => {
    // this will run if we switch from the search modal to the full view search page
    if (fullView && resultThreadIds && isNewSearch) {
      // update active query shown in search bar
      setActiveQuery(query);
      startNewSearch(activeResult, query);
      setLastSubmittedQuery(query);
    }
  }, [resultThreadIds, query, fullView, activeResult, isNewSearch, setActiveQuery, startNewSearch]);

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

  const itemHeight = getItemHeight(isMobile);

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
                  <SearchIndexProgressItem searchIndexProgress={searchIndexProgress} width={width} />
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
                        activeEmailID,
                        query: lastSubmittedQuery
                      }}
                      itemKey={(index, data) => data.searchResults[index]?.emailID ?? ''}
                      itemSize={itemHeight}
                      onItemsRendered={onItemsRendered}
                      overscanCount={10}
                      ref={ref}
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
  const shouldWaitForIndexProgress =
    hasSearchIndexProgressFlag && noResults && !searchIndexProgress && !searchIndexProgressRetrievalError;
  const showSkeleton = (loading && startingIndexToFetch === 0 && isNewSearch) || shouldWaitForIndexProgress;

  const renderMailboxBody = () => {
    if (showSkeleton) {
      return <LoadingMailbox />;
    }

    if (noResults) {
      // show index progress if there are no results and the search index is not yet complete
      return showIndexProgress ? (
        <SearchIndexProgressView searchIndexProgress={searchIndexProgress} />
      ) : (
        <EmptyIllustration subtitle='No emails match the query' title='No results' />
      );
    }

    return renderSearchResults();
  };

  const activeEmailIDIndex = resultsToRender.findIndex((result) => result.emailID === activeEmailID) || 0;
  const nextSearchResult = resultsToRender[activeEmailIDIndex + 1];
  const prevSearchResult = resultsToRender[activeEmailIDIndex - 1];

  const renderSearchInput = () => {
    return (
      <HeaderInput>
        <TopBar $hide={(isCompact || threadFormat === ThreadDisplayFormat.Full) && messageDetailsPanelOpen}>
          <SearchBar>
            <InputField
              autoFocus
              endAdornment={
                activeQuery && (
                  <Typography mono uppercase color='secondary' onClick={reset}>
                    Clear
                  </Typography>
                )
              }
              icon={Icon.Search}
              innerRef={searchBarRef}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setActiveQuery(e.target.value);
                if (isNewSearch) setIsNewSearch(false);
              }}
              onFocus={() => {
                if (isNewSearch) setIsNewSearch(false);
              }}
              onKeyDown={(evt: React.KeyboardEvent) => {
                if (evt.key === 'Enter') {
                  searchBarRef.current?.blur();
                  void startNewSearch(activeResult);
                }
              }}
              placeholder='Search messages...'
              value={activeQuery}
            />
          </SearchBar>
          <div>
            <IconButton
              icon={Icon.Close}
              onClick={() => router.back()}
              type={Type.SECONDARY}
              variant={FilledVariant.UNFILLED}
            />
          </div>
        </TopBar>
      </HeaderInput>
    );
  };

  return (
    <MailboxContainer>
      <MailboxListThread>
        <MailboxHeaderBody $activeThreadID={!!activeThreadID} id={MAIL_LIST_CONTAINER_ID}>
          <MailboxHeader
            inputField={renderSearchInput()}
            onRefresh={async () => {}}
            setClearAll={() => setSelectedThreadIDs([])}
            setMobileSearchQuery={() => {
              // Search page should never appear on mobile
            }}
            setSelectAll={() => {
              setSelectedThreadIDs(resultsToRender.map((t) => t.thread.threadID));
            }}
            showSkeleton={false}
            threads={resultsToRender.map((t) => t.thread)}
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
              />
            )}
          </MessageDetailsPanel>
        </AnimatePresence>
      </MailboxListThread>
    </MailboxContainer>
  );
};

export default MailboxSearchResults;
