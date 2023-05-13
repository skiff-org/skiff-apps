import { Icon } from 'nightwatch-ui';
import React, { useCallback, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue, useRequiredCurrentUserData } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';

import AddEmail from './AddEmail/AddEmail';
import DeleteAccount from './DeleteAccount/DeleteAccount';
import DeleteRecoveryEmail from './DeleteRecoveryEmail/DeleteRecoveryEmail';
import EditProfileSettings from './EditProfileSettings/EditProfileSettings';

export const useAccountSettings: () => Setting[] = () => {
  const dispatch = useDispatch();

  // Fetch email from server because Apollo object might not be up-to-date
  const { recoveryEmail, unverifiedRecoveryEmail } = useRequiredCurrentUserData();
  const hasRecoveryEmail = !!recoveryEmail;

  const openLogoutModal = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Logout }));
    },
    [dispatch]
  );

  const settings = useMemo<Setting[]>(
    () => [
      ...insertIf<Setting>(!isMobile, {
        type: SettingType.Custom,
        value: SettingValue.EditProfile,
        component: <EditProfileSettings key='edit-profile' />,
        label: SETTINGS_LABELS[SettingValue.EditProfile],
        icon: Icon.AlignCenter,
        color: 'green'
      }),
      ...insertIf<Setting>(hasRecoveryEmail, {
        value: SettingValue.DeleteRecoveryEmail,
        type: SettingType.Custom,
        component: <DeleteRecoveryEmail key='delete-recovery-email' />,
        label: SETTINGS_LABELS[SettingValue.DeleteRecoveryEmail],
        icon: Icon.Envelope,
        color: 'pink',
        dataTest: 'delete-recovery-email'
      }),
      ...insertIf<Setting>(!hasRecoveryEmail, {
        value: SettingValue.AddEmail,
        type: SettingType.Custom,
        component: <AddEmail key='add-email' unverifiedRecoveryEmail={unverifiedRecoveryEmail} />,
        label: SETTINGS_LABELS[SettingValue.AddEmail],
        icon: Icon.Envelope,
        color: 'green'
      }),
      {
        value: SettingValue.DeleteAccount,
        type: SettingType.Custom,
        component: <DeleteAccount key='delete-account' />,
        label: SETTINGS_LABELS[SettingValue.DeleteAccount],
        icon: Icon.Trash,
        color: 'red'
      },
      ...insertIf<Setting>(isMobile, {
        value: SettingValue.Logout,
        type: SettingType.Action,
        label: SETTINGS_LABELS[SettingValue.Logout],
        onClick: openLogoutModal,
        icon: Icon.Exit,
        color: 'yellow'
      })
    ],
    [hasRecoveryEmail, unverifiedRecoveryEmail, openLogoutModal]
  );

  return settings;
};
