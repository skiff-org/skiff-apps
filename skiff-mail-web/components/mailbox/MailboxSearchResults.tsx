import { useMediaQuery } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { uniq, uniqBy } from 'lodash';
import router from 'next/router';
import { Icon, IconButton, Icons, InputField, Typography } from 'nightwatch-ui';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import Autosizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { usePrevious } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { useGetThreadsFromIDsQuery } from 'skiff-mail-graphql';
import { filterExists } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../constants/mailbox.constants';
import { useDrafts } from '../../hooks/useDrafts';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import useLocalSetting, { ThreadDisplayFormat } from '../../hooks/useLocalSetting';
import { useSearch as useCmdPaletteSearch } from '../../hooks/useSearch';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailDraftsReducer } from '../../redux/reducers/draftsReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { RootState } from '../../redux/store/reduxStore';
import Illustration, { Illustrations } from '../../svgs/Illustration';
import { getItemHeight } from '../../utils/mailboxUtils';
import { SearchContext } from '../../utils/search/SearchProvider';
import { SkemailResultIDs, SkemailSearchResult } from '../../utils/search/searchTypes';
import { filterSkemailSearchResults } from '../../utils/search/searchUtils';
import { useSearch } from '../../utils/search/useSearch';
import { SearchItemType } from '../../utils/searchWorkerUtils';
import Thread from '../Thread';
import { ThreadNavigationIDs } from '../Thread/Thread.types';

import { MAIL_LIST_CONTAINER_ID } from './consts';
import MailboxSearchResultItem from './MailboxItem/MailboxSearchResultItem';
import { MailboxSkeleton } from './MailboxSkeleton';
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

const MailboxHeaderBody = styled.div<{ $activeThreadID: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  ${({ $activeThreadID }) => (!$activeThreadID && isMobile ? 'transform: translateX(0) !important;' : '')}

  padding: 0px;
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
`;

const ResultsHeader = styled(Typography)`
  margin: 0 0 8px 36px;
`;

const TopBar = styled.div<{ $hide: boolean }>`
  visibility: ${(props) => `${props.$hide ? 'hidden' : 'visible'}`};
  display: flex;
  gap: 8px;
  margin-left: 19px;
  align-items: center;
  padding-bottom: 16px;
`;

const MAX_THREADS_TO_QUERY = 50;

export const MailboxSearchResults = () => {
  const searchBarRef = useRef<HTMLInputElement>(null);
  const { query, fullView, activeResult, isNewSearch, setIsNewSearch } = useContext(SearchContext);
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`);
  // keep track of active thead and email IDs within the component instead of through the useThreadActions
  // hook since the active thread and email is not stored with the route path
  const [activeThreadID, setActiveThreadID] = useState<string | undefined>(activeResult?.threadID);
  const [activeEmailID, setActiveEmailID] = useState<string | undefined>(activeResult?.emailID);
  const [skemailsToFetch, setSkemailsToFetch] = useState<SkemailSearchResult[]>([]);
  const [startingIndexToFetch, setStartingIndexToFetch] = useState(0);
  const [resultsToRender, setResultsToRender] = useState<{ emailID: string; thread: MailboxThreadInfo }[]>([]);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');
  // The query we are rendering results for
  const [activeQuery, setActiveQuery] = useState(query);

  const dispatch = useDispatch();
  const { composeOpen } = useSelector((state: RootState) => state.modal);
  const prevComposeOpen = usePrevious(composeOpen);

  const [threadFormat] = useLocalSetting('threadFormat');
  const messageListRef = useRef<HTMLDivElement>(null);
  const iosKeyboardHeight = useIosKeyboardHeight('mailbox');

  const { draftThreads } = useDrafts();
  const { searchResults: allResults, search } = useSearch();
  const { setRecentSearches } = useCmdPaletteSearch();
  const skemailSearchResults = allResults?.filter(filterSkemailSearchResults) ?? [];

  // Fetch thread objects
  const threadIDsToFetch = uniq(
    skemailsToFetch
      .slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
      .map((skemail) => skemail.threadID)
  );
  const { loading, refetch: refetchThreads } = useGetThreadsFromIDsQuery({
    variables: { threadIDs: threadIDsToFetch },
    skip: !threadIDsToFetch.length,
    onCompleted: (data) => {
      // Calculate the search results to render given the thread objects fetched from the server
      const newResultsToRender =
        skemailsToFetch
          .slice(startingIndexToFetch, startingIndexToFetch + MAX_THREADS_TO_QUERY)
          .map((skemailResult) => {
            const thread = data?.userThreads?.find((t) => t?.threadID == skemailResult.threadID);
            const { id: emailID, threadID } = skemailResult;
            if (!thread) {
              // it's a draft or it doesn't exist anymore
              const draftThread = draftThreads.find((draft) => draft.threadID === threadID);
              if (draftThread) {
                return {
                  emailID,
                  thread: draftThread
                };
              }
              return undefined;
            }
            return { emailID, thread };
          })
          ?.filter(filterExists) ?? [];
      setResultsToRender((results) =>
        results && startingIndexToFetch > 0
          ? uniqBy([...results, ...newResultsToRender], (r) => r.emailID)
          : newResultsToRender
      );
    }
  });

  const setActiveResult = (activeThreadAndEmail: ThreadNavigationIDs | undefined) => {
    const { threadID, emailID } = activeThreadAndEmail || {};
    setActiveThreadID(threadID);
    setActiveEmailID(emailID);

    // if the new active thread/email is a draft, open up the compose panel with the draft
    const draftThread = draftThreads.find((draft) => draft.threadID === threadID);
    if (draftThread) {
      const email = draftThread.emails.find((e) => e.id === emailID);
      if (email) {
        dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID: draftThread.threadID }));
        dispatch(skemailModalReducer.actions.editDraftCompose(email));
      }
    }
  };

  const startNewSearch = (newActiveResult?: SkemailResultIDs, currQuery?: string) => {
    const isQueryEmpty = currQuery === '';
    // Reset state when a new search is submitted
    setActiveResult(newActiveResult);
    setIsNewSearch(true);
    setSkemailsToFetch(isQueryEmpty ? [] : skemailSearchResults);
    setStartingIndexToFetch(0);
    const newQuery = currQuery !== undefined ? currQuery : query;
    // If the query did not change, refetch the results
    if (newQuery === lastSubmittedQuery) {
      refetchThreads();
    }
    setLastSubmittedQuery(newQuery);
    if (isQueryEmpty) setResultsToRender([]);
  };

  useEffect(() => {
    // this will run if we switch from the search modal to the full view search page
    if (fullView && allResults && isNewSearch) {
      // update active query shown in search bar
      setActiveQuery(query);
      startNewSearch(activeResult);
    }
    // only update when the search results have changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults]);

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

    const loadMoreItems = async () => {
      // set new index to start fetching from
      setStartingIndexToFetch(startingIndexToFetch + MAX_THREADS_TO_QUERY);
    };

    return (
      <MessageList $threadFormat={isCompact ? ThreadDisplayFormat.Full : threadFormat} ref={messageListRef}>
        {!!resultsToRender.length && (
          <Autosizer>
            {({ height, width }) => (
              <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={skemailSearchResults.length}
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
                    itemKey={(index, data) => data.searchResults[index].emailID}
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
            )}
          </Autosizer>
        )}
      </MessageList>
    );
  };
  const showSkeleton = loading && startingIndexToFetch === 0 && isNewSearch;

  const renderMailboxBody = () => {
    return (
      <>
        {showSkeleton && <MailboxSkeleton renderCheckbox={false} />}
        {!showSkeleton && !resultsToRender.length && (
          <EmptyMailbox>
            <Illustration illustration={Illustrations.EmptyMailbox} />
            <Typography level={0}>No results</Typography>
          </EmptyMailbox>
        )}
        {!showSkeleton && !!resultsToRender.length && renderSearchResults()}
      </>
    );
  };

  const activeEmailIDIndex = resultsToRender.findIndex((result) => result.emailID === activeEmailID) || 0;
  const nextSearchResult = resultsToRender[activeEmailIDIndex + 1];
  const prevSearchResult = resultsToRender[activeEmailIDIndex - 1];

  return (
    <MailboxContainer>
      <MailboxListThread>
        <MailboxHeaderBody $activeThreadID={!!activeThreadID} id={MAIL_LIST_CONTAINER_ID}>
          <TopBar $hide={(isCompact || threadFormat === ThreadDisplayFormat.Full) && messageDetailsPanelOpen}>
            <SearchBar>
              <InputField
                endAdornment={
                  activeQuery && (
                    <Typography
                      color='secondary'
                      onClick={() => {
                        setActiveQuery('');
                        startNewSearch(undefined, '');
                      }}
                    >
                      Clear
                    </Typography>
                  )
                }
                innerRef={searchBarRef}
                onChange={(e) => {
                  setActiveQuery(e.target.value);
                  search(e.target.value);
                  if (isNewSearch) setIsNewSearch(false);
                }}
                onFocus={() => {
                  if (isNewSearch) setIsNewSearch(false);
                }}
                onKeyDown={(evt: React.KeyboardEvent) => {
                  if (evt.key === 'Enter') {
                    searchBarRef.current?.blur();
                    setRecentSearches((recentSearches) => [
                      { itemType: SearchItemType.Query, subject: activeQuery, filters: [] },
                      ...recentSearches
                    ]);
                    startNewSearch();
                  }
                }}
                placeholder='Search messages...'
                size='medium'
                startAdornment={<Icons color='secondary' icon={Icon.EnvelopeSearch} />}
                value={activeQuery}
              />
            </SearchBar>
            <IconButton color='secondary' icon={Icon.Close} onClick={() => router.back()} />
          </TopBar>
          {!showSkeleton && !!resultsToRender.length && (
            <ResultsHeader level={1} type='heading'>
              Search results
            </ResultsHeader>
          )}
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
