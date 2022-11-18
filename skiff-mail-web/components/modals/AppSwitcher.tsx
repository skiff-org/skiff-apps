import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  OrganizationSelect,
  ProductApp,
  getAllLocalStorageUUIDs,
  storeLatestUserID,
  getEnvironment
} from 'skiff-front-utils';
import { SystemLabels, WorkspaceEventType } from 'skiff-graphql';
import { useGetNumUnreadQuery, useGetOrganizationQuery } from 'skiff-mail-graphql';
import { models } from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { useUsernameFromUser } from '../../hooks/useUsernameFromUser';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { fetchUserProfileDataFromIDs, storeWorkspaceEvent } from '../../utils/userUtils';

interface AppSwitcherProps {
  user: models.User;
}

const AppSwitcher: React.FC<AppSwitcherProps> = ({ user }) => {
  const { rootOrgID } = useRequiredCurrentUserData();

  const { data: org } = useGetOrganizationQuery({
    variables: { id: rootOrgID }
  });

  const dispatch = useDispatch();
  const currentLabel = useCurrentLabel();
  const { data: numUnread } = useGetNumUnreadQuery({
    variables: { label: currentLabel ?? SystemLabels.Inbox },
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const openLogoutModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Logout }));
  };

  const { username, formattedUsername } = useUsernameFromUser(user);
  const [otherAccountInfo, setOtherAccountInfo] = useState<{ label: string; onClick: () => void; active: boolean }[]>(
    []
  );
  const flags = useFlags();

  // same code as editor app switcher, but just shows other accounts
  useEffect(() => {
    const getAllAccounts = async () => {
      try {
        const allUUIDs = getAllLocalStorageUUIDs().filter((curID) => curID !== user.userID);
        const newAccountItems: Array<{ label: string; onClick: () => void; active: boolean }> = [];
        if (allUUIDs.length > 0) {
          const profileDataResponse = await fetchUserProfileDataFromIDs(allUUIDs);
          newAccountItems.push(
            ...allUUIDs.map((uuidElem) => ({
              label: profileDataResponse?.find((elem) => elem.userID === uuidElem)?.username ?? uuidElem,
              onClick: () => {
                storeLatestUserID(uuidElem);
                window.location.reload();
              },
              active: uuidElem === user.userID
            }))
          );
        }
        setOtherAccountInfo(newAccountItems);
      } catch (error) {
        console.error('Failed to set accounts in app switcher', error);
      }
    };
    void getAllAccounts();
  }, [user.userID]);

  const generalActions = [
    {
      label: `Log out ${formattedUsername}`,
      onClick: openLogoutModal,
      dataTest: 'Logout'
    }
  ];

  const pageSection = {
    workspaces: [
      {
        label: org?.organization.name ?? '',
        onClick: () => {},
        active: true
      },
      ...otherAccountInfo
    ],
    actions: [
      {
        label: 'Add account',
        onClick: () => {
          window.location.replace('/login#ADD_ACCOUNT');
        },
        icon: Icon.Plus,
        dataTest: 'add-account',
        key: 'add-account'
      }
    ]
  };

  const storeEvent = () => {
    return storeWorkspaceEvent(WorkspaceEventType.SwitchFromEmailToEditor, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  const env = getEnvironment(new URL(window.location.origin));

  return (
    <OrganizationSelect
      actions={generalActions}
      activeApp={ProductApp.Mail}
      blockPointerEvents
      label={formattedUsername}
      numUnread={numUnread?.unread}
      section={pageSection}
      sidepanelOpen
      storeWorkspaceEvent={() => void storeEvent}
      username={username}
    />
  );
};

export default AppSwitcher;
