import { Dialog, ThemeMode } from 'nightwatch-ui';
import { DialogTypes } from 'nightwatch-ui';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';

import { ShortcutsList } from './ShortcutsList';

const DialogContent = styled.div`
  height: 70vh;
  overflow: auto;
  width: 100%;
`;

/**
 * Component that renders the Shortcuts menu
 */
function ShortcutsMenu() {
  const { openModal } = useAppSelector((state) => state.modal);
  const isOpen = openModal?.type === ModalType.Shortcuts;

  const dispatch = useDispatch();
  const onClose = () => dispatch(skemailModalReducer.actions.setOpenModal(undefined));

  return (
    <Dialog
      classesToIgnore={['searchResultRow']}
      customContent
      forceTheme={ThemeMode.DARK}
      onClose={onClose}
      open={isOpen}
      title='Shortcuts'
      type={DialogTypes.Default}
    >
      <DialogContent>
        <ShortcutsList />
      </DialogContent>
    </Dialog>
  );
}

export default ShortcutsMenu;
