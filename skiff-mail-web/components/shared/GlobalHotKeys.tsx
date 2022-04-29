import React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { useDispatch } from 'react-redux';

import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';

const GlobalHotkeys = () => {
  const dispatch = useDispatch();
  // Command palette
  const cmdPHandler = (e: KeyboardEvent | undefined) => {
    e?.preventDefault();
    e?.stopImmediatePropagation();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
  };
  // meta+P does not work on Windows because it is a system command
  const keyMap = {
    CMD_P: 'meta+p',
    CTRL_P: 'ctrl+p'
  };
  const handlers = {
    CMD_P: cmdPHandler,
    CTRL_P: cmdPHandler
  };
  return <GlobalHotKeys handlers={handlers} keyMap={keyMap} />;
};

export default GlobalHotkeys;
