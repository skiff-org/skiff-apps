import { Dialog, DialogContent, styled as MUIStyled, TextField } from '@mui/material';
import { Avatar, Chip, Divider, Icon, Icons } from '@skiff-org/skiff-ui';
import React, { useCallback, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { stringToColorProp } from '../../../../skiff-ui/src/utils/colorUtils';
import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import {
  AddressObject,
  SystemLabels,
  useGetUserContactListQuery,
  useUserLabelsQuery
} from '../../../generated/graphql';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useQuickActions } from '../../../hooks/useQuickActions';
import { useSearch } from '../../../hooks/useSearch';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { upperCaseFirstLetter } from '../../../utils/jsUtils';
import { SYSTEM_LABELS } from '../../../utils/label';
import { SearchFilter, SearchFilterType, SearchItemType } from '../../../utils/searchWorkerUtils';
import { CommandList, CommandListItems } from './CommandList';
import { CMD_PALETTE_ANIMATION_DURATION, CMD_PALETTE_WIDTH, TRIGGER_SEARCH_AFTER } from './constants';

// https://mui.com/guides/migration-v4/#1-use-styled-or-sx-api
const classPrefix = 'SkiffWorldCmdPalette';
const classes = {
  scrollPaper: `${classPrefix}-scroll-paper`,
  paperScrollPaper: `${classPrefix}-paper-scroll-paper`,
  input: `${classPrefix}-input`
};

const StyledDialog = MUIStyled(Dialog)(() => ({
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
    boxShadow: 'var(--shadow-l2)',
    width: '700px',
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

const FilterChips = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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
  const { userID } = useRequiredCurrentUserData();

  // GraphQL
  const { data: userLabelData, error: userLabelError } = useUserLabelsQuery();
  const userLabels = userLabelData?.userLabels ?? [];

  const { data: contactListData, error: contactListError } = useGetUserContactListQuery({
    variables: {
      request: {
        userID
      }
    }
  });
  const contactList = contactListData?.user?.contactList ?? [];

  if (userLabelError) {
    console.error(`Failed to retrieve User's labels`, JSON.stringify(userLabelError, null, 2));
  }
  if (contactListError) {
    console.error(`Failed to retrieve User's contact list`, JSON.stringify(contactListError, null, 2));
  }

  // Redux
  const { openModal } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();

  // Hooks
  const { query, skemails, activeFilters, loading, reset, search, setActiveFilters, setQuery } = useSearch();
  const quickActions = useQuickActions(query);

  const focusSearchInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const onClose = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    setActiveFilters([]);
    // clears results after dialog animates away
    setTimeout(() => {
      reset();
    }, CMD_PALETTE_ANIMATION_DURATION);
  }, [dispatch, reset, setActiveFilters]);

  const triggerOnChange = () => {
    setStillTyping(false);
    search();
  };

  const addressInQuery = (addressObj: AddressObject): boolean =>
    addressObj.address.toLowerCase().includes(query.toLowerCase()) ||
    addressObj.name?.toLowerCase().includes(query.toLowerCase()) ||
    false;

  // handle shortcuts to close the dialog
  const toggleCmdPaletteShortcutHandler = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      // delete activeFilters via backspace
      if (event.key === 'Backspace' && query.length === 0) {
        event.stopPropagation();
        event.preventDefault();
        setActiveFilters((activeFilters) => activeFilters.slice(0, -1));
      } else if ((event.key === 'p' && (event.metaKey || event.ctrlKey)) || event.key === 'Escape') {
        // cmd + p, ctrl + p, escape
        event.stopPropagation();
        event.preventDefault();
        onClose();
      } else if ((event.key === '/' && (event.metaKey || event.ctrlKey)) || event.key === 'Escape') {
        // open compose via cmd-slash
        event.stopPropagation();
        event.preventDefault();
        onClose();
        dispatch(skemailModalReducer.actions.openCompose({}));
      } else if (event.key === 'ArrowUp') {
        // this prevents the cursor from jumping to the beginning of the input when a user
        // is navigating the search results with arrow keys
        event.preventDefault();
      }
    },
    [onClose]
  );

  const notActiveLabelFilter = (label) => !activeFilters.map((filter) => filter.subject).includes(label);
  // note this will filter TO/FROM the same person, i.e. can't search for emails to self.
  const notActiveAddressFilter = (label) => !activeFilters.map((filter) => filter.subject).includes(label.name ?? label.address);

  const getCommandListItems = (): CommandListItems => {
    // If there's no active query, show quick actions and no filter options
    let displayedQuickActions = quickActions;
    let displayedFilters: SearchFilter[] = [];
    // If the user has an active query, show relevant filter options instead of quick actions
    // filter out active activeFilters.
    if (query) {
      // User labels
      const userLabelFilters: SearchFilter[] = userLabels
        .filter((label) => label.labelName.toLowerCase().includes(query.toLowerCase()))
        .filter(notActiveLabelFilter)
        .map((label) => ({
          itemType: SearchItemType.Filter,
          subject: `${label.labelName}`,
          filter: {
            filterType: SearchFilterType.UserLabel,
            filterValue: label.labelName
          }
        }));
      // System labels
      const systemLabelFilters: SearchFilter[] = Object.values(SystemLabels)
        .filter((label) => label.toLowerCase().includes(query.toLowerCase()))
        // The Virus system label is used to filter out inbound messages flagged by anti-virus.
        // Since these messages are never exposed to the user, we filter it out from the search results here.
        .filter((label) => label !== SystemLabels.Virus)
        .filter(notActiveLabelFilter)
        .map((label) => ({
          itemType: SearchItemType.Filter,
          subject: `${label}`,
          filter: {
            filterType: SearchFilterType.SystemLabel,
            filterValue: label
          }
        }));

      const addressFromFilters: SearchFilter[] = contactList.filter(notActiveAddressFilter).filter(addressInQuery).map((contact) => ({
        itemType: SearchItemType.Filter,
        subject: `${contact.name || contact.address}`,
        filter: {
          filterType: SearchFilterType.FromAddress,
          filterValue: contact
        }
      }));
      const addressToFilters: SearchFilter[] = contactList.filter(notActiveAddressFilter).filter(addressInQuery).map((contact) => ({
        itemType: SearchItemType.Filter,
        subject: `${contact.name || contact.address}`,
        filter: {
          filterType: SearchFilterType.ToAddress,
          filterValue: contact
        }
      }));

      displayedFilters = [...userLabelFilters, ...systemLabelFilters, ...addressFromFilters, ...addressToFilters];
      displayedQuickActions = [];
    }

    return { skemails, quickActions: displayedQuickActions, filters: displayedFilters };
  };

  const applyFilter = (filter) => {
    setActiveFilters([...activeFilters, filter]);
    reset();
  };

  const EnabledFilters = () => (
    <FilterChips>
      {activeFilters.map((filter) => {
        const { subject } = filter;
        const systemIcon = SYSTEM_LABELS.find((label) => label.name.toUpperCase() === subject)?.icon;
        const isAddress = filter.filter.filterType === SearchFilterType.FromAddress || filter.filter.filterType === SearchFilterType.ToAddress;
        const startIcon = isAddress ? (
          <Avatar label={subject} size='xsmall' themeMode='dark' />
        ) : (
          <Icons color={systemIcon ? 'white' : stringToColorProp(subject)} icon={systemIcon || Icon.Dot} />
        );
        return (
          <Chip
            key={subject}
            label={isAddress ? subject : upperCaseFirstLetter(subject)}
            onDelete={() => setActiveFilters(activeFilters.filter((f) => f !== filter))}
            size='small'
            startIcon={startIcon}
            themeMode='dark'
            type='input'
          />
        );
      })}
    </FilterChips>
  );
  const TextFieldAdornment = (
    <>
      <Icons color='secondary' icon={Icon.Search} size='large' themeMode='dark' />
      <EnabledFilters />
    </>
  );

  const commandList = () => (
    <>
      <div style={{ padding: '10px 24px' }}>
        <TextField
          InputProps={{
            classes: { input: classes.input },
            startAdornment: TextFieldAdornment,
            disableUnderline: true
          }}
          autoFocus
          fullWidth
          inputRef={inputRef}
          onBlur={focusSearchInput}
          onChange={(event) => {
            const newText = event.target.value;
            setStillTyping(true);
            setQuery(newText);
            if (queryTimeout.current) {
              clearTimeout(queryTimeout.current);
            }
            // if the user clears the textfield, we should show the inital contents immediately
            queryTimeout.current = setTimeout(triggerOnChange, newText ? TRIGGER_SEARCH_AFTER : 0);
          }}
          onKeyDown={toggleCmdPaletteShortcutHandler}
          placeholder='Search files and folders...'
          value={query}
          variant='standard'
        />
      </div>
      <Divider length='long' themeMode='dark' />
      <CommandList
        applyFilter={applyFilter}
        listItems={getCommandListItems()}
        loading={loading || stillTyping}
        onClose={onClose}
        query={query}
        // We can use this to paywall contentSearch if we want
        searchOptions={{ contentSearch: true }}
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
          <DialogContent style={{ width: CMD_PALETTE_WIDTH, padding: 0 }}>{commandList()}</DialogContent>
        </StyledDialog>
      )}
    </>
  );
}

export default CmdPalette;
