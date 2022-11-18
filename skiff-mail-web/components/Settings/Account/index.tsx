import { Icon } from 'nightwatch-ui';
import React, { useCallback, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { useGetUserEmailAndWalletQuery } from 'skiff-mail-graphql';
import { insertIf } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';

import AddEmail from './AddEmail/AddEmail';
import ChangeEmail from './ChangeEmail/ChangeEmail';
import DeleteAccountDialog from './DeleteAccount/DeleteAccount';
import EditProfileSettings from './EditProfileSettings/EditProfileSettings';

export const useAccountSettings: () => Setting[] = () => {
  const dispatch = useDispatch();
  const { userID } = useRequiredCurrentUserData();
  // Fetch email from server because Apollo object might not be up-to-date
  const { data } = useGetUserEmailAndWalletQuery({
    variables: {
      request: {
        userID
      }
    }
  });
  const hasEmail = !!data?.user?.email;

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
      ...insertIf<Setting>(hasEmail, {
        value: SettingValue.ChangeEmail,
        type: SettingType.Custom,
        component: <ChangeEmail key='change-email' />,
        label: SETTINGS_LABELS[SettingValue.ChangeEmail],
        icon: Icon.Envelope,
        color: 'green',
        dataTest: 'change-email'
      }),
      ...insertIf<Setting>(!hasEmail, {
        value: SettingValue.AddEmail,
        type: SettingType.Custom,
        component: <AddEmail key='add-email' />,
        label: SETTINGS_LABELS[SettingValue.AddEmail],
        icon: Icon.Envelope,
        color: 'pink'
      }),
      {
        value: SettingValue.DeleteAccount,
        type: SettingType.Custom,
        component: <DeleteAccountDialog key='delete-account' />,
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
    [openLogoutModal, hasEmail]
  );

  return settings;
};
