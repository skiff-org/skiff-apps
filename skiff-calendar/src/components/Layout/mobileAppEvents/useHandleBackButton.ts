import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { sendRNWebviewMsg } from 'skiff-front-utils';

import { DrawerTypes, mobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { modalReducer } from '../../../redux/reducers/modalReducer';
import { useAppSelector } from '../../../utils';
import { useCloseSettings } from '../../CalendarSettings/useOpenCloseSettings';
import useCloseEventInfo from '../../EventInfo/useCloseEventInfo';

export const useHandleBackButton = () => {
  const { openDrawers } = useAppSelector((state) => state.mobileDrawer);
  const { openModal } = useAppSelector((state) => state.modal);

  const closeSettings = useCloseSettings();

  const dispatch = useDispatch();

  const [closeEventInfoDrawer] = useCloseEventInfo();

  const handleBackButton = useCallback(() => {
    if (openDrawers && !!openDrawers.length) {
      const lastOpenedDrawerIndex = openDrawers.length - 1;
      const isSettingsOpen = openDrawers[lastOpenedDrawerIndex] === DrawerTypes.Settings;
      const isEventInfoOpen =
        openDrawers[lastOpenedDrawerIndex] === DrawerTypes.EventInfo ||
        openDrawers[lastOpenedDrawerIndex] === DrawerTypes.CreateEvent;
      if (isSettingsOpen) {
        closeSettings();
        return;
      }

      if (isEventInfoOpen) {
        void closeEventInfoDrawer();
        return;
      }
      dispatch(mobileDrawerReducer.actions.closeDrawer(openDrawers[lastOpenedDrawerIndex]));
    } else if (!!openModal) {
      dispatch(modalReducer.actions.setOpenModal(undefined));
    } else {
      sendRNWebviewMsg('minimize', {});
    }
  }, [closeEventInfoDrawer, closeSettings, dispatch, openDrawers, openModal]);
  return handleBackButton;
};
