import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { styled as MUIStyled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import router from 'next/router';
import { Divider, Icon, Icons } from 'nightwatch-ui';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { AppRoutes } from '../../../constants/route.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useQuickActions } from '../../../hooks/useQuickActions';
import { useSearch } from '../../../hooks/useSearch';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { SearchContext } from '../../../utils/search/SearchProvider';
import { SkemailResultIDs } from '../../../utils/search/searchTypes';
import { useSearch as useFullViewSearch } from '../../../utils/search/useSearch';
import {
  getFilterPrefix,
  SearchFilter,
  SearchFilterType,
  isActiveCategoryFilter
} from '../../../utils/searchWorkerUtils';
import FilterChip from '../FilterChip';

import { CommandList } from './CommandList';
import { CMD_PALETTE_ANIMATION_DURATION, CMD_PALETTE_WIDTH, TRIGGER_SEARCH_AFTER } from './constants';

// https://mui.com/guides/migration-v4/#1-use-styled-or-sx-api
const classPrefix = 'SkiffWorldCmdPalette';
const classes = {
  scrollPaper: `${classPrefix}-scroll-paper`,
  paperScrollPaper: `${classPrefix}-paper-scroll-paper`,
  input: `${classPrefix}-input`
};

const StyledDialog = MUIStyled(Dialog)(() => ({
  '@keyframes fade': {
    from: {
      transform: 'scale(1.1)',
      opacity: 0
    },
    to: {
      transform: 'scale(1.0)',
      opacity: 1
    }
  },
  [`&.${classes.scrollPaper}`]: {
    alignItems: 'baseline'
  },
  [`& .${classes.paperScrollPaper}`]: {
    marginTop: '-5vh',
    background: 'var(--bg-emphasis) !important',
    webkitBackdropFilter: 'blur(72px)',
    backdropFilter: 'blur(72px)',
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-l3)',
    border: '1px solid var(--border-secondary)',
    width: '700px',
    animation: 'fade .4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    maxWidth: '700px'
  },
  [`& .${classes.input}`]: {
    fontFamily: 'Skiff Sans Text, sans-serif',
    color: 'var(--text-always-white)',
    fontWeight: 380,
    lineHeight: '24px',
    fontSize: '17px',
    paddingLeft: '8px',
    border: 0
  }
}));

const ActiveFilterChips = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StyledDialogContent = styled(DialogContent)`
  width: ${CMD_PALETTE_WIDTH}px;
  padding: 0 !important;
`;

const FilterButton = styled.div`
  &:hover {
    cursor: pointer;
  }
`;

//Add padding between search icon and an active filter chip
const SearchIcon = styled.div<{ isActiveFilter?: boolean }>`
  ${(props) => props.isActiveFilter && `padding-right: 10px;`}
`;

/**
 * Component that renders the CmdPalette to emails.
 * NOTE: Most of this is duplicated from editor CmdPalette
 * These should eventually be consolidated into a single component
 */
function CmdPalette() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryTimeout = useRef<NodeJS.Timeout>(); // used to debounce search calls -> only search after the user stops typing
  const [stillTyping, setStillTyping] = useState(false);

  // Redux
  const { openModal } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();

  // Hooks
  const {
    query,
    skemails,
    filterOptions,
    filterRows,
    activeFilters,
    loading,
    userLabels,
    contactList,
    attachmentList,
    labelList,
    folderList,
    recentSearches,
    reset,
    search,
    setRecentSearches,
    setActiveFilters,
    setQuery,
    searchForQuery
  } = useSearch();
  // This updates the search results for the full view search page
  const { search: fullViewSearch } = useFullViewSearch();
  const { setFullView, setActiveResult } = useContext(SearchContext);

  const quickActions = useQuickActions(query);
  const shouldRenderFilterButton = filterRows.some((row) => !!row.filters.length);

  const [showFilterBy, setShowFilterBy] = useState(false);

  useEffect(() => {
    if (openModal?.type === ModalType.CommandPalette) {
      setFullView(false);
    }
  }, [openModal?.type, setFullView]);

  const focusSearchInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const searchQuery = (currQuery: string) => {
    searchForQuery(currQuery);
  };

  const onClose = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    // Todo: Store in redux and apply activeFilters to mailbox as well
    setActiveFilters([]);
    setShowFilterBy(false);
    // clears results after dialog animates away
    setTimeout(() => {
      reset();
    }, CMD_PALETTE_ANIMATION_DURATION);
  }, [dispatch, reset, setActiveFilters]);

  const triggerOnChange = () => {
    setStillTyping(false);
    search();
  };

  const goToFullViewSearch = useCallback(
    (activeResult?: SkemailResultIDs, currQuery?: string) => {
      router.push(AppRoutes.SEARCH);
      fullViewSearch(currQuery ?? query);

      setFullView(true);
      setActiveResult(activeResult);
      onClose();
    },
    [fullViewSearch, onClose, query, setActiveResult, setFullView]
  );

  // handle shortcuts to close the dialog
  const toggleCmdPaletteShortcutHandler = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      // delete activeFilters via backspace
      if (event.key === 'Backspace' && query.length === 0) {
        event.stopPropagation();
        event.preventDefault();
        setActiveFilters((currActiveFilters) => currActiveFilters.slice(0, -1));
        searchQuery(query);
      } else if ((event.key === 'p' && (event.metaKey || event.ctrlKey)) || event.key === 'Escape') {
        // cmd + p, ctrl + p, escape
        event.stopPropagation();
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowUp') {
        // this prevents the cursor from jumping to the beginning of the input when a user
        // is navigating the search results with arrow keys
        event.preventDefault();
      }
    },
    [onClose, query, setActiveFilters]
  );

  const applyFilter = (filter: SearchFilter) => {
    if (!activeFilters.some((activeFilter) => filter.filter.filterType === activeFilter.filter.filterType)) {
      setActiveFilters([...activeFilters, filter]);
      setShowFilterBy(false);
      reset();
    }
  };

  const EnabledFilters = () => (
    <ActiveFilterChips>
      {activeFilters.map((filter) => (
        <FilterChip
          formatLabel
          key={`${filter.subject}-filter`}
          noBorder={filter.filter.filterType !== SearchFilterType.Category}
          onDelete={() => {
            setActiveFilters(activeFilters.filter((f) => f !== filter));
            searchQuery(query);
          }}
          prefix={getFilterPrefix(filter.filter.filterType)}
          searchFilter={filter}
          userLabels={userLabels}
        />
      ))}
    </ActiveFilterChips>
  );
  const TextFieldStartAdornment = (
    <>
      <SearchIcon isActiveFilter={!!activeFilters.length}>
        <Icons color='secondary' icon={Icon.Search} size='large' themeMode='dark' />
      </SearchIcon>
      <EnabledFilters />
    </>
  );

  // Display filter icon only if there are valid filter chips remaining and no active category searches
  const TextFieldEndAdornment =
    shouldRenderFilterButton && !isActiveCategoryFilter(activeFilters) ? (
      <FilterButton key='cmd-palette-filter-button' onClick={() => setShowFilterBy((prev) => !prev)}>
        <Icons color={showFilterBy ? 'primary' : 'secondary'} icon={Icon.Filter} themeMode='dark' />
      </FilterButton>
    ) : null;

  const commandList = () => (
    <>
      <div style={{ padding: '10px 24px' }}>
        <TextField
          InputProps={{
            classes: { input: classes.input },
            startAdornment: TextFieldStartAdornment,
            disableUnderline: true,
            endAdornment: TextFieldEndAdornment
          }}
          autoComplete='off'
          autoFocus
          fullWidth
          inputRef={inputRef}
          onBlur={focusSearchInput}
          onChange={(event) => {
            const newText = event.target.value;
            setStillTyping(true);
            setQuery(newText);
            setShowFilterBy(false);
            if (queryTimeout.current) {
              clearTimeout(queryTimeout.current);
            }
            // if the user clears the textfield, we should show the initial contents immediately
            queryTimeout.current = setTimeout(triggerOnChange, newText ? TRIGGER_SEARCH_AFTER : 0);
          }}
          onKeyDown={toggleCmdPaletteShortcutHandler}
          placeholder='Search messages and commands...'
          value={query}
          variant='standard'
        />
      </div>
      <Divider length='long' themeMode='dark' />
      <CommandList
        applyFilter={applyFilter}
        goToFullViewSearch={goToFullViewSearch}
        listItems={{
          skemails,
          quickActions,
          filters: filterOptions,
          filterRows,
          activeFilters,
          contactList,
          attachmentList,
          labelList,
          folderList,
          recentSearches
        }}
        loading={loading || stillTyping}
        onClose={onClose}
        // We can use this to paywall contentSearch if we want
        query={query}
        searchOptions={{ contentSearch: true }}
        searchQuery={searchQuery}
        setActiveFilters={setActiveFilters}
        setRecentSearches={setRecentSearches}
        showFilterBy={showFilterBy}
      />
    </>
  );

  return (
    <>
      {isMobile && openModal?.type === ModalType.CommandPalette && commandList()}
      {!isMobile && (
        <StyledDialog
          classes={{
            scrollPaper: classes.scrollPaper,
            paperScrollPaper: classes.paperScrollPaper
          }}
          onClose={onClose}
          open={openModal?.type === ModalType.CommandPalette}
          transitionDuration={CMD_PALETTE_ANIMATION_DURATION}
        >
          <StyledDialogContent>{commandList()}</StyledDialogContent>
        </StyledDialog>
      )}
    </>
  );
}

export default CmdPalette;
