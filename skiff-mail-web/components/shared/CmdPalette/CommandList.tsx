/* eslint-disable import/prefer-default-export */
import { Typography } from '@skiff-org/skiff-ui';
import { AnimateSharedLayout } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { areEqual, ListChildComponentProps, VariableSizeList } from 'react-window';

import { SystemLabels } from '../../../generated/graphql';
import { useCurrentLabel } from '../../../hooks/useCurrentLabel';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { updateThreadAsReadUnread } from '../../../utils/mailboxUtils';
import {
  combineSearchResults,
  SearchAction,
  SearchFilter,
  SearchItem,
  SearchItemType,
  SearchSkemail
} from '../../../utils/searchWorkerUtils';
import { CMD_PALETTE_HEIGHT } from './constants';
import SearchResult from './SearchResult';

export interface CommandListItems {
  quickActions: Array<SearchAction>;
  skemails: Array<SearchSkemail>;
  filters: Array<SearchFilter>;
}

interface CommandListProps {
  query: string;
  loading: boolean;
  listItems: CommandListItems;
  searchOptions: {
    contentSearch: boolean;
  };
  onClose: () => void;
  applyFilter: (filter: SearchFilter) => void;
}

// component to show "No results" text in search results list
const NoResults = ({ style }: { style: React.CSSProperties; contentSearchEnabled: boolean }) => (
  <div style={{ ...style, display: 'flex', alignItems: 'center', margin: '4px 20px', width: '96%' }}>
    <Typography level={2} themeMode='dark' type='label'>
      No results
    </Typography>
  </div>
);

// This component is meant to hold all the "commands" that we will have in the Command Palette.
// It holds quick actions (create new document, go to settings) and recent documents & files.
export const CommandList = ({
  query,
  listItems: searchItems,
  loading,
  searchOptions,
  onClose,
  applyFilter
}: CommandListProps) => {
  const { quickActions: searchActions, skemails, filters } = searchItems;
  const [highlightedRow, setHighlightedRow] = useState(0);
  const listRef = useRef<VariableSizeList | null>(null);
  const searchResults = useMemo(
    () => combineSearchResults(searchActions, skemails, filters),
    [searchActions, skemails, filters]
  );
  // if loading, show empty screen, otherwise show search results or 1 row for no results
  const itemCount = loading ? 0 : Math.max(searchResults.length, 1);
  const { setActiveThreadID } = useThreadActions();
  const currentRouteLabel = useCurrentLabel();
  const router = useRouter();

  const navigateToSkemailResult = useCallback(
    async (skemailResult: SearchSkemail) => {
      const { threadID, id: emailID, systemLabels, read } = skemailResult;
      const activeThreadQuery = { threadID, emailID };
      // If the skemail is not in the current route, navigate to a system label the thread does have
      if (!systemLabels.includes(currentRouteLabel as SystemLabels)) {
        await router.push({ pathname: systemLabels[0], query: activeThreadQuery }, undefined, {
          shallow: true
        });
      } else {
        setActiveThreadID(activeThreadQuery);
      }
      // If the email is unread, mark as read
      if (!read) {
        void updateThreadAsReadUnread([skemailResult.threadID], true, systemLabels);
      }
    },
    [currentRouteLabel, router]
  );

  const onSearchResultSelect = useCallback(
    (index: number) => {
      if (index < searchResults.length) {
        const searchResult = searchResults[index];
        if (searchResult.itemType === SearchItemType.Skemail) {
          void navigateToSkemailResult(searchResult);
          onClose();
        } else if (searchResult.itemType === SearchItemType.Action) {
          searchResult.onClick();
          onClose();
        } else if (searchResult.itemType === SearchItemType.Filter) {
          applyFilter(searchResult);
        }
      }
    },
    [onClose, searchResults]
  );

  // Handles navigating search results with arrow keys, skips headers since we can't select them
  const onKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const documentsHeaderIndex = searchActions.length ? searchActions.length + 1 : 0;
      let nextHighlight = highlightedRow;
      if (event.key === 'ArrowDown' && highlightedRow < searchResults.length - 1) {
        nextHighlight = highlightedRow + 1;
        // Skip if we're at the documents header
        if (nextHighlight === documentsHeaderIndex) nextHighlight++;
      } else if (event.key === 'ArrowUp' && highlightedRow > 1) {
        nextHighlight = highlightedRow - 1;
        // Skip if we're at the documents header
        if (nextHighlight === documentsHeaderIndex) nextHighlight--;
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

  useEffect(() => {
    // Start at index 1 because 0 is header
    setHighlightedRow(1);
    listRef.current?.resetAfterIndex(0, false);
  }, [query, searchResults, loading]);

  const row = memo(({ index, style, data }: ListChildComponentProps) => {
    if (!data.length) {
      return <NoResults contentSearchEnabled={searchOptions.contentSearch} style={style} />;
    }
    const searchResult = data[index] as SearchItem;
    return (
      <SearchResult
        active={index === highlightedRow}
        item={searchResult}
        onClick={() => onSearchResultSelect(index)}
        query={query}
        showContent={searchOptions.contentSearch}
        style={style}
      />
    );
  }, areEqual);
  row.displayName = 'CommandListRow';

  const itemSize = (index: number) => {
    // special case: make first row entire box to display upgrade message.
    if (!searchResults.length && !searchOptions.contentSearch) {
      return CMD_PALETTE_HEIGHT;
    }
    // initial state, no results, or title search
    if (!searchResults.length) {
      return 60;
    }
    // this case shouldn't happen but adding to prevent any index out of bounds errors
    if (index > searchResults.length) {
      return 0;
    }
    const searchResult = searchResults[index];
    if (searchResult.itemType === SearchItemType.Header) {
      return 48;
    }
    if (!searchOptions.contentSearch) {
      return 60;
    }
    return 66;
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
        style={{ margin: '0 auto' }}
        width='96%'
      >
        {row}
      </VariableSizeList>
    </AnimateSharedLayout>
  );
};
