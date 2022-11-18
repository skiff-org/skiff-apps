/* eslint-disable import/prefer-default-export */
import { AnimateSharedLayout } from 'framer-motion';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { VariableSizeList } from 'react-window';
import { SystemLabels } from 'skiff-graphql';

import { useCurrentLabel } from '../../../hooks/useCurrentLabel';
import { UNSPECIFIED_ACTION_CAP } from '../../../hooks/useQuickActions';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { useNavigate } from '../../../utils/navigation';
import { SkemailResultIDs } from '../../../utils/search/searchTypes';
import {
  combineSearchResults,
  getRowHeightFromSearchItem,
  SearchAction,
  SearchCategory,
  SearchCategoryType,
  SearchFilter,
  SearchFilterRow,
  SearchItemType,
  SearchQuery,
  SearchSkemail
} from '../../../utils/searchWorkerUtils';

import { CommandListRow } from './CommandListRow';
import {
  CMD_LIST_MARGIN,
  CMD_PALETTE_HEIGHT,
  CMD_PALETTE_WIDTH,
  MAX_QUICK_ACTIONS_SHOWN,
  NO_RESULTS_ROW_HEIGHT
} from './constants';

export interface CommandListItems {
  quickActions: Array<SearchAction>;
  skemails: Array<SearchSkemail>;
  filters: Array<SearchFilter>;
  filterRows: Array<SearchFilterRow>;
  activeFilters: Array<SearchFilter>;
  contactList: Array<SearchCategory>;
  attachmentList: Array<SearchCategory>;
  labelList: Array<SearchCategory>;
  folderList: Array<SearchCategory>;
  recentSearches: SearchQuery[];
}

interface CommandListProps {
  query: string;
  loading: boolean;
  showFilterBy: boolean;
  listItems: CommandListItems;
  searchOptions: {
    contentSearch: boolean;
  };
  onClose: () => void;
  applyFilter: (filter: SearchFilter) => void;
  setActiveFilters: React.Dispatch<React.SetStateAction<SearchFilter[]>>;
  setRecentSearches: React.Dispatch<React.SetStateAction<SearchQuery[]>>;
  searchQuery: (queryString: string) => void;
  goToFullViewSearch: (activeResult?: SkemailResultIDs, currQuery?: string) => void;
}

// This component is meant to hold all the "commands" that we will have in the Command Palette.
// It holds quick actions (create new document, go to settings) and recent documents & files.
export const CommandList = ({
  query,
  showFilterBy,
  listItems: searchItems,
  loading,
  searchOptions,
  onClose,
  applyFilter,
  setActiveFilters,
  setRecentSearches,
  searchQuery,
  goToFullViewSearch
}: CommandListProps) => {
  const {
    quickActions,
    skemails,
    filters,
    filterRows,
    activeFilters,
    contactList,
    attachmentList,
    labelList,
    folderList,
    recentSearches
  } = searchItems;
  const [highlightedRow, setHighlightedRow] = useState(0);
  const dispatch = useDispatch();
  const listRef = useRef<VariableSizeList | null>(null);

  const [hideActions, setHideActions] = useState(true);
  const showActionsToggle = quickActions.length > MAX_QUICK_ACTIONS_SHOWN && query.length < UNSPECIFIED_ACTION_CAP;
  const searchActions = hideActions ? quickActions.slice(0, MAX_QUICK_ACTIONS_SHOWN) : quickActions;
  const toggleActionView = () => setHideActions(!hideActions);

  const searchResults = combineSearchResults(
    query,
    searchActions,
    skemails,
    filters,
    filterRows,
    activeFilters,
    contactList,
    attachmentList,
    labelList,
    folderList,
    recentSearches,
    showFilterBy,
    showActionsToggle
  );

  // if loading, show empty screen, otherwise show search results or 1 row for no results
  const itemCount = loading ? 0 : Math.max(searchResults.length, 1);
  const { navigateToUserLabel } = useNavigate();
  const { setActiveThreadID } = useThreadActions();
  const currentRouteLabel = useCurrentLabel();
  const router = useRouter();

  const navigateToSkemailResult = useCallback(
    async (skemailResult: SearchSkemail) => {
      const { threadID, id: emailID, systemLabels } = skemailResult;
      const activeThreadQuery = { threadID, emailID };

      // If there is no query, do not go to the full view search page. Instead, route to
      // the mailbox where the original message is
      if (!query.length) {
        // If the skemail is not in the current route, navigate to a system label the thread does have
        if (!systemLabels.includes(currentRouteLabel as SystemLabels)) {
          await router.push({ pathname: systemLabels[0], query: activeThreadQuery }, undefined, {
            shallow: true
          });
        } else {
          setActiveThreadID(activeThreadQuery);
          dispatch(skemailModalReducer.actions.collapse());
        }
      } else {
        goToFullViewSearch(activeThreadQuery);
      }
    },
    [goToFullViewSearch]
  );

  const onSearchResultSelect = useCallback(
    (index: number) => {
      if (index < searchResults.length) {
        const searchResult = searchResults[index];

        /* We create a new recent search in one of the following cases:
          1. Selecting a non-header search result that is not a recent search nor a filter when the searchbar query is length > 0
          2. Selecting a previous recent search
          3. Selecting a filter that has a query attached to it (ex: suggesting in current mailbox)
        */
        const isSearchResultFromQuery =
          ![SearchItemType.Filter, SearchItemType.Query, SearchItemType.Header].includes(searchResult.itemType) &&
          !!query.length;
        const isFilterWithQuery = searchResult.itemType === SearchItemType.Filter && !!searchResult.query?.length;
        const isPreviousRecentSearch = searchResult.itemType === SearchItemType.Query;
        if (isSearchResultFromQuery || isFilterWithQuery || isPreviousRecentSearch) {
          const subject = searchResult.itemType === SearchItemType.Query ? searchResult.subject || '' : query;
          const queryFilters = searchResult.itemType === SearchItemType.Query ? searchResult.filters : activeFilters;
          const selectedFilters =
            searchResult.itemType === SearchItemType.Filter ? [...activeFilters, searchResult] : queryFilters;

          setRecentSearches((existingRecentSearches) => [
            { itemType: SearchItemType.Query, subject, filters: selectedFilters },
            ...existingRecentSearches
          ]);
        }

        if (searchResult.itemType === SearchItemType.Skemail) {
          void navigateToSkemailResult(searchResult);
          onClose();
        } else if (searchResult.itemType === SearchItemType.Action) {
          // onClose has to come before onClick in case the action involves opening another modal since onClose sets the current modal to undefined
          onClose();
          searchResult.onClick();
        } else if (searchResult.itemType === SearchItemType.Filter) {
          applyFilter(searchResult);
          searchQuery(searchResult.query ?? '');
        } else if (searchResult.itemType === SearchItemType.Category) {
          if (searchResult.categoryInfo) {
            const info = searchResult.categoryInfo;
            if (info.categoryType === SearchCategoryType.Contact) {
              dispatch(skemailModalReducer.actions.directMessageCompose({ address: searchResult.subject }));
            }
            if (info.categoryType === SearchCategoryType.Attachments) {
              void navigateToSkemailResult(info.email);
              dispatch(
                skemailModalReducer.actions.setOpenModal({
                  type: ModalType.AttachmentPreview,
                  attachments: info.clientAttachments
                })
              );
            }
            if (info.categoryType === SearchCategoryType.Labels || info.categoryType === SearchCategoryType.Folders) {
              navigateToUserLabel(info.name);
            }
            onClose();
          }
        } else if (searchResult.itemType === SearchItemType.Query) {
          if (searchResult.filters) {
            setActiveFilters(searchResult.filters);
          }
          searchQuery(searchResult.subject);
          goToFullViewSearch(undefined, searchResult.subject);
        } else if (searchResult.itemType === SearchItemType.Header) {
          // the only Header with a click option is "Search results" or "Quick Actions"
          if (searchResult.headerItemType === SearchItemType.Skemail) {
            goToFullViewSearch();
          } else if (searchResult.headerItemType === SearchItemType.Action) {
            toggleActionView();
          }
        }
      }
    },
    [applyFilter, dispatch, goToFullViewSearch, navigateToSkemailResult, onClose, searchQuery, searchResults]
  );

  // Handles navigating search results with arrow keys, skips headers since we can't select them
  const onKeyPress = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      let nextHighlight = highlightedRow;
      if (event.key === 'ArrowDown' && highlightedRow < searchResults.length - 1) {
        nextHighlight = highlightedRow + 1;
        // Skip if we're at a header
        if (searchResults?.[nextHighlight].itemType === SearchItemType.Header) nextHighlight++;
      } else if (event.key === 'ArrowUp' && highlightedRow > 1) {
        nextHighlight = highlightedRow - 1;
        // Skip if we're at a header
        if (searchResults?.[nextHighlight].itemType === SearchItemType.Header) nextHighlight--;
      } else if (event.key === 'Enter') {
        // Prevent enter from creating newline in editor
        event.preventDefault();
        onSearchResultSelect(highlightedRow);
      }
      setHighlightedRow(nextHighlight);
      listRef.current?.scrollToItem(nextHighlight);
    },
    [highlightedRow, onSearchResultSelect, searchActions.length, searchResults.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, [onKeyPress]);

  // If there are new results, reset the index and highlighting
  useEffect(() => {
    // Start at index 1 because 0 is header
    setHighlightedRow(1);
    listRef.current?.resetAfterIndex(0, false);
  }, [query, loading]);

  const itemSize = (index: number) => {
    // special case: make first row entire box to display upgrade message.
    if (!searchResults.length && !searchOptions.contentSearch) {
      return CMD_PALETTE_HEIGHT;
    }
    // initial state, no results, or title search
    if (!searchResults.length) {
      return NO_RESULTS_ROW_HEIGHT;
    }
    // this case shouldn't happen but adding to prevent any index out of bounds errors
    if (index > searchResults.length) {
      return 0;
    }
    if (!searchOptions.contentSearch) {
      return NO_RESULTS_ROW_HEIGHT;
    }
    return getRowHeightFromSearchItem(searchResults[index]);
  };

  return (
    <AnimateSharedLayout>
      <VariableSizeList
        height={CMD_PALETTE_HEIGHT}
        itemCount={itemCount}
        itemData={searchResults}
        itemSize={itemSize}
        overscanCount={3}
        ref={listRef}
        style={{ margin: `0 0 0 ${CMD_LIST_MARGIN}px` }}
        // control proportions of list items relative to the styled dialog box
        width={CMD_PALETTE_WIDTH - 2 * CMD_LIST_MARGIN}
      >
        {(listChild) => {
          return (
            <CommandListRow
              {...listChild}
              applyFilter={applyFilter}
              contentSearch={searchOptions.contentSearch}
              highlightedRow={highlightedRow}
              onSearchResultSelect={onSearchResultSelect}
              query={query}
            />
          );
        }}
      </VariableSizeList>
    </AnimateSharedLayout>
  );
};
