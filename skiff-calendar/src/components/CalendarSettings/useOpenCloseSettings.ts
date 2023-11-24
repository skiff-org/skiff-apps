import { useCallback, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import { TABS_QUERY_PARAM, SETTINGS_QUERY_PARAM, SettingsPage } from 'skiff-front-utils';

import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { modalReducer } from '../../redux/reducers/modalReducer';
import { CalendarModalType } from '../../redux/reducers/modalTypes';

export const useOpenSettings = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const openSettings = useCallback(
    (page: SettingsPage) => {
      const { tab, setting } = page.indices;

      const query = new URLSearchParams();
      if (tab) query.set(TABS_QUERY_PARAM, tab);
      if (setting) query.set(SETTINGS_QUERY_PARAM, setting);
      if (isMobile) {
        dispatch(mobileDrawerReducer.actions.openDrawer(DrawerTypes.Settings));
      } else {
        dispatch(modalReducer.actions.setOpenModal({ type: CalendarModalType.Settings }));
      }
      history.replace({
        search: query.toString(),
        state: page.payload
      });
    },
    [dispatch, history]
  );
  return openSettings;
};

export const useCloseSettings = () => {
  const history = useHistory();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const dispatch = useDispatch();

  const onClose = () => {
    query.delete(SETTINGS_QUERY_PARAM);
    query.delete(TABS_QUERY_PARAM);
    if (isMobile) {
      dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.Settings));
    } else {
      dispatch(modalReducer.actions.setOpenModal(undefined));
    }
    history.replace({
      search: query.toString()
    });
  };

  return onClose;
};
