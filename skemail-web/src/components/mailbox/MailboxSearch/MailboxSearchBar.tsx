import { CircularProgress, InputField, InputFieldVariant, Size, Typography, TypographySize } from 'nightwatch-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePrevious } from 'skiff-front-utils';
import styled from 'styled-components';

import { skemailSearchReducer } from '../../../redux/reducers/searchReducer';
import { RootState } from '../../../redux/store/reduxStore';
import { useNavigate } from '../../../utils/navigation';
import { SearchSortOrder } from '../../../utils/search/SearchProvider';
import { MailboxSearchFilter } from '../../../utils/search/searchTypes';
import { useSearch } from '../../../utils/search/useSearch';

import { canFiltersBeAppliedWithoutQuery, didSearchFiltersChange, didSearchOrderChange } from './MailboxSearch.utils';

const SearchBar = styled.div`
  padding: 0 8px 0px 20px; // lines up with the select-all checkbox
`;

const SearchBarEndAdornment = styled.div``;

interface MailboxSearchBarProps {
  label: string;
}

export const MailboxSearchBar = ({ label }: MailboxSearchBarProps) => {
  const searchBarRef = useRef<HTMLInputElement>(null);
  const [endAdornmentHover, setEndAdornmentHover] = useState(false);

  const { navigateToInbox } = useNavigate();
  const {
    isSearchInProgress,
    isSearchRoute,
    mailboxQuery: query,
    searchFilters,
    searchSortOrder,
    setMailboxQuery: setQuery,
    searchInSearchRoute,
    resetMailboxSearch
  } = useSearch();

  // redux
  const { isSearchBarOpen, shouldFocus } = useSelector((state: RootState) => state.search);
  const dispatch = useDispatch();
  const closeSearchBar = useCallback(() => dispatch(skemailSearchReducer.actions.closeSearchBar()), [dispatch]);
  const openSearchBar = useCallback(() => dispatch(skemailSearchReducer.actions.openSearchBar()), [dispatch]);
  const clearShouldFocus = useCallback(
    () => dispatch(skemailSearchReducer.actions.setShouldFocus({ shouldFocus: false })),
    [dispatch]
  );

  const doSearch = useCallback(() => {
    searchBarRef.current?.blur();
    searchInSearchRoute(query, searchFilters, searchSortOrder);
  }, [searchInSearchRoute, searchFilters, query, searchSortOrder]);

  //close or open search bar on search route or label change
  useEffect(() => {
    if (!isSearchRoute) {
      closeSearchBar();
    } else {
      // search bar should always be open in search route
      openSearchBar();
    }
  }, [isSearchRoute, label, closeSearchBar, openSearchBar]);

  // clear search state on search bar close
  useEffect(() => {
    if (!isSearchBarOpen && !isSearchInProgress && !isSearchRoute) {
      resetMailboxSearch();
    }
  }, [isSearchBarOpen, isSearchInProgress, isSearchRoute, resetMailboxSearch]);

  // focus on search bar on relevant dispatch
  useEffect(() => {
    if (shouldFocus) {
      searchBarRef.current?.focus();
      clearShouldFocus();
    }
  }, [shouldFocus, clearShouldFocus]);

  // prevSearchFilters is undefined on initial render
  const prevSearchFilters: MailboxSearchFilter[] | undefined = usePrevious(searchFilters);
  const prevSearchOrder: SearchSortOrder | undefined = usePrevious(searchSortOrder);
  const didFiltersChange = didSearchFiltersChange(searchFilters, prevSearchFilters);
  const didOrderChange = didSearchOrderChange(searchSortOrder, prevSearchOrder);
  const didSearchCriteriaChange = didFiltersChange || didOrderChange;
  // some filters, such as date or system label, currently require a search string to return results
  const isReadyToSearch = !!query || canFiltersBeAppliedWithoutQuery(searchFilters);

  // perform search as soon as relevant filters or sort order change
  useEffect(() => {
    if (!didSearchCriteriaChange || isSearchInProgress || !isReadyToSearch) return;
    doSearch();
  }, [didSearchCriteriaChange, isSearchInProgress, isReadyToSearch, doSearch]);

  if (!isSearchBarOpen) return null;

  const getEndAdornmentHandler = () => {
    if (query) {
      // clear current query; other state is preserved unless user chooses to 'Cancel'
      return { onClickEndAdornment: () => setQuery(''), cta: 'Clear' };
    } else {
      return {
        onClickEndAdornment: () => {
          // 'Cancel' results in a closed search bar and routing back to inbox if applicable
          if (isSearchRoute) {
            // leaving search route will trigger search bar close via useEffect
            navigateToInbox();
          } else {
            closeSearchBar();
          }
        },
        cta: 'Cancel'
      };
    }
  };

  const { cta, onClickEndAdornment } = getEndAdornmentHandler();

  return (
    <SearchBar>
      <InputField
        autoFocus
        endAdornment={
          isSearchInProgress ? (
            <CircularProgress size={Size.SMALL} spinner />
          ) : (
            <SearchBarEndAdornment
              onMouseLeave={() => setEndAdornmentHover(false)}
              onMouseOver={() => setEndAdornmentHover(true)}
            >
              <Typography color={endAdornmentHover ? 'primary' : 'secondary'} onClick={onClickEndAdornment}>
                {cta}
              </Typography>
            </SearchBarEndAdornment>
          )
        }
        innerRef={searchBarRef}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setQuery(e.target.value);
        }}
        onKeyDown={(evt: React.KeyboardEvent) => {
          if (evt.key === 'Enter' && isReadyToSearch) {
            doSearch();
          }
        }}
        placeholder='Search for emails'
        size={Size.LARGE}
        typographySize={TypographySize.MEDIUM}
        value={query}
        variant={InputFieldVariant.SEARCH}
      />
    </SearchBar>
  );
};

export default MailboxSearchBar;
