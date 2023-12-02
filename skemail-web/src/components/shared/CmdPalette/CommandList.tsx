/* eslint-disable import/prefer-default-export */
import { DISPLAY_SCROLLBAR_CSS, ThemeMode } from 'nightwatch-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { VariableSizeList } from 'react-window';
import { SystemLabels } from 'skiff-graphql';
import styled from 'styled-components';

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
  SearchCategoryType,
  SearchItemType,
  SearchSkemail
} from '../../../utils/searchWorkerUtils';

import { CommandListRow } from './CommandListRow';
import {
  CMD_LIST_MARGIN,
  CMD_PALETTE_MAX_HEIGHT,
  CMD_PALETTE_WIDTH,
  MAX_QUICK_ACTIONS_SHOWN,
  NO_RESULTS_ROW_HEIGHT,
  TITLE_ONLY_ROW_HEIGHT
} from './constants';

export interface CommandListItems {
  quickActions: Array<SearchAction>;
  skemails: Array<SearchSkemail>;
}

interface CommandListProps {
  query: string;
  listItems: CommandListItems;
  searchOptions: {
    contentSearch: boolean;
  };
  onClose: () => void;
  goToFullViewSearch: (activeResult?: SkemailResultIDs, currQuery?: string) => void;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const StyledVariableSizeList = styled(VariableSizeList)`
  ${DISPLAY_SCROLLBAR_CSS}

  margin: 0 ${CMD_LIST_MARGIN}px;
`;

// This component is meant to hold all the "commands" that we will have in the Command Palette.
// It holds quick actions (create new document, go to settings) and recent documents & files.
export const CommandList = ({
  query,
  listItems: searchItems,
  searchOptions,
  onClose,
  goToFullViewSearch
}: CommandListProps) => {
  const { quickActions } = searchItems;
  const [highlightedRow, setHighlightedRow] = useState<number | null>(0);
  const dispatch = useDispatch();
  const listRef = useRef<VariableSizeList | null>(null);

  const [hideActions, setHideActions] = useState(true);
  const showActionsToggle = quickActions.length > MAX_QUICK_ACTIONS_SHOWN && query.length < UNSPECIFIED_ACTION_CAP;
  const searchActions = hideActions ? quickActions.slice(0, MAX_QUICK_ACTIONS_SHOWN) : quickActions;

  const searchResults = combineSearchResults(searchActions, showActionsToggle);

  // If there are no search results, there should still be 1 row for the
  // "no results" row.
  const itemCount = Math.max(searchResults.length, 1);
  const { navigateToUserLabel } = useNavigate();
  const { setActiveThreadID } = useThreadActions();
  const { label: currentRouteLabel } = useCurrentLabel();
  const history = useHistory();

  const navigateToSkemailResult = useCallback(
    (skemailResult: SearchSkemail) => {
      const { threadID, id: emailID, systemLabels } = skemailResult;
      const activeThreadQuery = { threadID, emailID };

      // If there is no query, do not go to the full view search page. Instead, route to
      // the mailbox where the original message is
      if (!query.length) {
        // If the skemail is not in the current route, navigate to a system label the thread does have
        if (!systemLabels.includes(currentRouteLabel as SystemLabels)) {
          history.push({ pathname: systemLabels[0], search: new URLSearchParams(activeThreadQuery).toString() });
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
    (index: number | null) => {
      // if nothing selected, full screen search query
      if (index == null) {
        goToFullViewSearch(undefined, query);
        onClose();
        return;
      }
      if (index < searchResults.length) {
        const searchResult = searchResults[index];
        if (!searchResult) {
          console.error(`No search result at index ${index}`);
          return;
        }

        if (searchResult.itemType === SearchItemType.Skemail) {
          navigateToSkemailResult(searchResult);
          onClose();
        } else if (searchResult.itemType === SearchItemType.Action) {
          // onClose has to come before onClick in case the action involves opening another modal since onClose sets the current modal to undefined
          onClose();
          searchResult.onClick();
        } else if (searchResult.itemType === SearchItemType.Category) {
          if (searchResult.categoryInfo) {
            const info = searchResult.categoryInfo;
            if (info.categoryType === SearchCategoryType.Contact) {
              dispatch(skemailModalReducer.actions.directMessageCompose({ address: searchResult.subject }));
            }
            if (info.categoryType === SearchCategoryType.Attachments) {
              navigateToSkemailResult(info.email);
              dispatch(
                skemailModalReducer.actions.setOpenModal({
                  type: ModalType.AttachmentPreview,
                  attachments: info.clientAttachments
                })
              );
            }
            if (info.categoryType === SearchCategoryType.Labels) {
              void navigateToUserLabel(info.name);
            } else if (info.categoryType === SearchCategoryType.Folders) {
              const folderPath = `/label?folder=true#${info.name}`;
              history.push(folderPath);
            }

            onClose();
          }
        } else if (searchResult.itemType === SearchItemType.Query) {
          goToFullViewSearch(undefined, searchResult.subject);
        } else if (searchResult.itemType === SearchItemType.Header) {
          // the only Header with a click option is "Search results" or "Quick Actions"
          if (searchResult.headerItemType === SearchItemType.Skemail) {
            goToFullViewSearch();
          } else if (searchResult.headerItemType === SearchItemType.Action) {
            setHideActions((prev) => !prev);
          }
        }
      }
    },
    [dispatch, goToFullViewSearch, navigateToSkemailResult, onClose, navigateToUserLabel, query, history, searchResults]
  );

  // Handles navigating search results with arrow keys, skips headers since we can't select them
  const onKeyPress = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      let nextHighlight = highlightedRow;
      if (event.key === 'Enter') {
        // Prevent enter from creating newline in editor
        event.preventDefault();
        if (searchResults.length) {
          onSearchResultSelect(highlightedRow);
        } else {
          // If no search results, search in messages
          goToFullViewSearch(undefined, query);
        }
      } else if (event.key === 'ArrowDown' && (highlightedRow || 0) < searchResults.length - 1) {
        nextHighlight = (highlightedRow || 0) + 1;
        // Skip if we're at a header
        if (searchResults?.[nextHighlight]?.itemType === SearchItemType.Header) nextHighlight++;
      } else if (event.key === 'ArrowUp' && (highlightedRow || 0) > 0) {
        nextHighlight = (highlightedRow || 0) - 1;
        // Skip if we're at a header
        if (searchResults?.[nextHighlight]?.itemType === SearchItemType.Header) nextHighlight--;
      }
      setHighlightedRow(nextHighlight);
      listRef.current?.scrollToItem(nextHighlight || 0);
    },
    [highlightedRow, onSearchResultSelect, searchActions.length, searchResults.length]
  );

  // If there are new results, reset the index and highlighting
  useEffect(() => {
    setHighlightedRow(0);
    listRef.current?.resetAfterIndex(0, false);
  }, [query]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, [onKeyPress]);

  const itemSize = (index: number) => {
    // special case: make first row entire box to display upgrade message.
    if (!searchResults.length && !searchOptions.contentSearch) {
      return CMD_PALETTE_MAX_HEIGHT;
    }
    // initial state, no results, or title search
    if (!searchResults.length) {
      return NO_RESULTS_ROW_HEIGHT;
    }
    const searchResult = searchResults[index];
    // this case shouldn't happen but adding to prevent any index out of bounds errors
    if (index > searchResults.length || !searchResult) {
      return 0;
    }
    if (!searchOptions.contentSearch) {
      return NO_RESULTS_ROW_HEIGHT;
    }
    return getRowHeightFromSearchItem(searchResult);
  };

  // Must be at least one because we show "no results" row on 0 search results
  const numSearchResultsToShow = Math.max(searchResults.length, 1);
  const listHeight = Math.min(CMD_PALETTE_MAX_HEIGHT, numSearchResultsToShow * TITLE_ONLY_ROW_HEIGHT) + CMD_LIST_MARGIN;

  return (
    <StyledVariableSizeList
      forceTheme={ThemeMode.DARK}
      height={listHeight}
      itemCount={itemCount}
      itemData={searchResults}
      itemSize={itemSize}
      overscanCount={3}
      ref={listRef}
      // control proportions of list items relative to the styled dialog box
      width={CMD_PALETTE_WIDTH - 2 * CMD_LIST_MARGIN}
    >
      {(listChild) => {
        return (
          <CommandListRow
            {...listChild}
            contentSearch={searchOptions.contentSearch}
            goToFullViewSearch={goToFullViewSearch}
            highlightedRow={highlightedRow || 0}
            onSearchResultSelect={onSearchResultSelect}
            query={query}
            setHighlightedRow={(index: number) => setHighlightedRow(index)}
          />
        );
      }}
    </StyledVariableSizeList>
  );
};
