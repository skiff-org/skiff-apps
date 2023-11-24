import { useFlags } from 'launchdarkly-react-client-sdk';
import { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useDebouncedAsyncCallback } from 'skiff-front-utils';

import { useIsFullScreenThreadOpen } from '../../hooks/useIsFullScreenThreadOpen';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailSearchReducer } from '../../redux/reducers/searchReducer';
import { HiddenLabels } from '../label';
import { useNavigate } from '../navigation';

import { SearchCategory, SearchContext, SearchSortOrder } from './SearchProvider';
import { LabelSearchResult, MailboxSearchFilter, SearchItemType, SearchResult, UserSearchResult } from './searchTypes';
import { isSkemailSearchResult } from './searchUtils';
import { useLabelSearch } from './useLabelSearch';
import { SEARCH_UPDATE_INTERVAL, useSkemailSearch } from './useSkemailSearch';
import { useUserSearch } from './useUserSearch';

/**
 * useSearch returns search function that takes in a search string
 * The search function takes into account the current category / applied search modifiers
 * (which it gets from SearchProvider) and dispatches the appropriate search calls in order to populate
 * the result.
 * For example, if the user already has a "in: INBOX" modifier applied, we will not show any more results
 * under `Narrow search`.
 *
 * it also returns the `searchResults`, which is an array of the results to be rendered.
 */
export const useSearch = () => {
  const location = useLocation();
  const isSearchRoute = location.pathname.includes(HiddenLabels.Search);
  const { navigateToSearch } = useNavigate();
  const flags = useFlags();
  const autoSuggest = flags.skemailAutoSuggest as boolean;
  const dispatch = useDispatch();
  const { activeThreadID, activeEmailID } = useThreadActions();
  const isFullScreenThreadOpen = useIsFullScreenThreadOpen();

  const {
    searchResults,
    category,
    mailboxQuery,
    cmdPaletteQuery,
    lastSubmittedMailboxQuery,
    isSearchInProgress,
    searchFilters,
    searchSortOrder,
    lastSubmittedSearchFilters,
    setSearchResults,
    setMailboxQuery,
    setCmdPaletteQuery,
    setIsSearchInProgress,
    setSearchFilters,
    setSearchSortOrder,
    setLastSubmittedMailboxQuery,
    setLastSubmittedSearchFilters
  } = useContext(SearchContext);

  const { search: skemailSearch } = useSkemailSearch();
  const { search: labelSearch } = useLabelSearch();
  const { search: userSearch } = useUserSearch();

  const [search] = useDebouncedAsyncCallback(
    async (searchStr: string, filters?: MailboxSearchFilter[], showResultsInCmdPalette?: boolean, sortOrder?: SearchSortOrder) => {
      if (!isSearchInProgress) setIsSearchInProgress(true);
      // minisearch results are currently only delivered via full-view search route
      // so regardless of whether search came from command palette or mailbox search bar,
      // we sync the mailbox search bar state
      setMailboxQuery(searchStr);
      setSearchFilters(filters || []);
      setSearchSortOrder(sortOrder || SearchSortOrder.Relevance);
      const newSearchResults: SearchResult[] = [];
      // Search results
      // depending on the category, could be a list of emails, labels, folders, users.
      let categorySearchResults: SearchResult[] = [];
      const searchResultHeader: SearchResult = {
        type: SearchItemType.HEADER,
        label: 'Search results'
      };
      if (category === SearchCategory.SKEMAIL) {
        const skemailResults = await skemailSearch(searchStr, filters, autoSuggest, sortOrder);
        if (skemailResults?.length) {
          categorySearchResults = [...skemailResults];
          if (showResultsInCmdPalette) {
            categorySearchResults.unshift(searchResultHeader);
          }
        }
      } else if (category === SearchCategory.LABEL) {
        const labelResults: LabelSearchResult[] | undefined = labelSearch(searchStr);
        if (labelResults?.length) {
          categorySearchResults = [searchResultHeader, ...labelResults];
        }
      } else if (category === SearchCategory.USER) {
        const userResults: UserSearchResult[] | undefined = userSearch(searchStr);
        if (userResults?.length) {
          categorySearchResults = [searchResultHeader, ...userResults];
        }
      }
      newSearchResults.push(...categorySearchResults);
      setSearchResults(newSearchResults);
      setLastSubmittedMailboxQuery(searchStr);
      setLastSubmittedSearchFilters(filters);
      setIsSearchInProgress(false);
      return newSearchResults;
    },
    SEARCH_UPDATE_INTERVAL
  );

  const searchInSearchRoute = useCallback(
    (query: string, filters?: MailboxSearchFilter[], searchSortOrder?: SearchSortOrder) => {
      setIsSearchInProgress(true); // will be reverted via 'search'
      if (!isSearchRoute) {
        navigateToSearch();
        // preserve any active thread when navigating to search;
        // but only if there is not a full screen thread open,
        // to ensure that there is always an obvious context change
        if (activeThreadID && !isFullScreenThreadOpen) {
          dispatch(skemailSearchReducer.actions.setActiveThread({ threadID: activeThreadID, emailID: activeEmailID }));
        }
      }
      void search(query, filters, undefined, searchSortOrder);
    },
    [
      navigateToSearch,
      search,
      dispatch,
      setIsSearchInProgress,
      isSearchRoute,
      activeEmailID,
      activeThreadID,
      isFullScreenThreadOpen
    ]
  );

  const resetMailboxSearch = useCallback(() => {
    // active thread state is managed via redux to avoid linking
    // useThreadActions with high-frequency changes to search state, such as query changes
    dispatch(skemailSearchReducer.actions.setActiveThread(undefined));
    setMailboxQuery('');
    setSearchResults([]);
    setLastSubmittedMailboxQuery(undefined);
    setLastSubmittedSearchFilters(undefined);
    setIsSearchInProgress(false);
    setSearchFilters([]);
    setSearchSortOrder(SearchSortOrder.Relevance);
  }, [
    setMailboxQuery,
    setSearchResults,
    setLastSubmittedMailboxQuery,
    setIsSearchInProgress,
    setSearchFilters,
    setSearchSortOrder,
    setLastSubmittedSearchFilters,
    dispatch
  ]);

  return {
    skemailSearchResults: searchResults?.filter(isSkemailSearchResult) || [],
    isSearchRoute,
    mailboxQuery,
    cmdPaletteQuery,
    isSearchInProgress,
    lastSubmittedMailboxQuery,
    searchFilters,
    searchSortOrder,
    lastSubmittedSearchFilters,
    setSearchFilters,
    setSearchSortOrder,
    setMailboxQuery,
    setCmdPaletteQuery,
    search,
    searchInSearchRoute,
    resetMailboxSearch
  };
};
