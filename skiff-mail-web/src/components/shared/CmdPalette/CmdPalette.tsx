import { Dialog, DialogType, Divider, InputField, InputFieldVariant, Size, ThemeMode } from 'nightwatch-ui';
import React, { useCallback, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useQuickActions } from '../../../hooks/useQuickActions';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { skemailSearchReducer } from '../../../redux/reducers/searchReducer';
import { useNavigate } from '../../../utils/navigation';
import { SkemailResultIDs } from '../../../utils/search/searchTypes';
import { useSearch } from '../../../utils/search/useSearch';

import { CommandList } from './CommandList';
import { CMD_LIST_MARGIN, CMD_PALETTE_MAX_HEIGHT, SEARCH_HEADER_HEIGHT, SEARCH_HEADER_PADDING } from './constants';

const CommandListHeader = styled.div`
  padding: ${SEARCH_HEADER_PADDING - 4}px ${SEARCH_HEADER_PADDING + 4}px 0 ${SEARCH_HEADER_PADDING + 4}px;
  width: 100%;
  box-sizing: border-box;
`;

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/**
 * Component that renders the CmdPalette to emails.
 * NOTE: Most of this is duplicated from editor CmdPalette
 * These should eventually be consolidated into a single component
 */
function CmdPalette() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Redux
  const { openModal } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();

  // Hooks
  const { cmdPaletteQuery: query, setCmdPaletteQuery: setQuery, search: searchForQuery } = useSearch();
  const { navigateToSearch } = useNavigate();
  const quickActions = useQuickActions(query);

  const focusSearchInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const onClose = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    setQuery('');
  }, [dispatch, setQuery]);

  const goToFullViewSearch = useCallback(
    (activeResult?: SkemailResultIDs, currQuery?: string) => {
      navigateToSearch();
      void searchForQuery(currQuery ?? query);
      dispatch(skemailSearchReducer.actions.setActiveThread(activeResult));
      onClose();
    },
    [searchForQuery, onClose, query, navigateToSearch, dispatch]
  );

  // handle shortcuts to close the dialog
  const toggleCmdPaletteShortcutHandler = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (event.key === 'Backspace' && query.length === 0) {
        event.stopPropagation();
        event.preventDefault();
        void searchForQuery(query);
      } else if (
        ((event.key === 'p' || event.key === 'k') && (event.metaKey || event.ctrlKey)) ||
        event.key === 'Escape'
      ) {
        // cmd + p, ctrl + p, cmd + k, ctrl + k, escape
        event.stopPropagation();
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowUp') {
        // this prevents the cursor from jumping to the beginning of the input when a user
        // is navigating the search results with arrow keys
        event.preventDefault();
      }
    },
    [onClose, query, searchForQuery]
  );

  const commandList = () => (
    <>
      <CommandListHeader>
        <InputField
          autoFocus
          forceTheme={ThemeMode.DARK}
          onBlur={focusSearchInput}
          onChange={(event) => {
            const newText = event.target.value;
            setQuery(newText);
          }}
          onKeyDown={toggleCmdPaletteShortcutHandler}
          placeholder='Search...'
          ref={inputRef}
          size={Size.LARGE}
          value={query}
          variant={InputFieldVariant.GHOST}
        />
      </CommandListHeader>
      <Divider forceTheme={ThemeMode.DARK} />
      <CommandList
        goToFullViewSearch={goToFullViewSearch}
        listItems={{
          skemails: [],
          quickActions
        }}
        onClose={onClose}
        // We can use this to paywall contentSearch if we want
        query={query}
        searchOptions={{ contentSearch: true }}
      />
    </>
  );

  // Custom height used for preserving vertical alignment even with different
  // number of rows returned from search query.
  const cmdPaletteHeight = CMD_PALETTE_MAX_HEIGHT + CMD_LIST_MARGIN * 3 + SEARCH_HEADER_PADDING + SEARCH_HEADER_HEIGHT;

  return (
    <>
      {isMobile && openModal?.type === ModalType.CommandPalette && commandList()}
      {!isMobile && (
        <Dialog
          customContent
          forceTheme={ThemeMode.DARK}
          height={cmdPaletteHeight}
          noPadding
          onClose={onClose}
          open={openModal?.type === ModalType.CommandPalette}
          type={DialogType.SEARCH}
        >
          <DialogContent>{commandList()}</DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default CmdPalette;
