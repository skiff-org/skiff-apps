import { Icon } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';

import { modalReducer } from '../../../redux/reducers/modalReducer';
import { CalendarModalType } from '../../../redux/reducers/modalTypes';

import DeleteAccount from './DeleteAccount';

export const useAccountSettings = () => {
  const dispatch = useDispatch();
  const openLogoutModal = () => dispatch(modalReducer.actions.setOpenModal({ type: CalendarModalType.Logout }));

  const settings: Setting[] = [
    ...insertIf<Setting>(isMobile, {
      value: SettingValue.Logout,
      type: SettingType.Action,
      label: SETTINGS_LABELS[SettingValue.Logout],
      onClick: openLogoutModal,
      icon: Icon.Exit,
      color: 'yellow'
    }),
    {
      value: SettingValue.DeleteAccount,
      type: SettingType.Custom,
      component: <DeleteAccount key='delete-account' />,
      label: SETTINGS_LABELS[SettingValue.DeleteAccount],
      icon: Icon.Trash,
      color: 'red'
    }
  ];

  return settings;
};
