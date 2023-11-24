import { Icon } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  fetchUserProfileOrgDataFromID,
  getAliasesForUser,
  useStoreWorkspaceEventMutation,
  UserProfileOrgDataFragment
} from 'skiff-front-graphql';
import {
  OrganizationSelect,
  getAllLocalStorageUUIDs,
  SectionAction,
  storeLatestUserID,
  getDefaultEmailAlias,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { User, WorkspaceEventType, ProductApp } from 'skiff-graphql';

import { getRouterUri } from '../../apollo/client';
import { modalReducer } from '../../redux/reducers/modalReducer';
import { CalendarModalType } from '../../redux/reducers/modalTypes';
import { useAppSelector } from '../../utils';
import { useUsernameFromUser } from '../../utils/hooks/useUsernameFromUser';

interface AppSwitcherProps {
  user?: User;
}

interface Account {
  label: string;
  sublabel?: string;
  onClick: () => void;
  active: boolean;
  warning?: boolean;
}

const AppSwitcher: React.FC<AppSwitcherProps> = () => {
  const user = useRequiredCurrentUserData();

  const [otherAccountInfo, setOtherAccountInfo] = useState<{ label: string; onClick: () => void; active: boolean }[]>(
    []
  );
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const dispatch = useDispatch();
  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const numBannersOpen = bannersOpen.length;

  const openLogout = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(modalReducer.actions.setOpenModal({ type: CalendarModalType.Logout }));
  };

  const { username, formattedUsername } = useUsernameFromUser(user);

  // Duplicated from editor app switcher, without alter egos
  // Exactly the same as mail logic
  useEffect(() => {
    const getAllAccounts = async () => {
      try {
        const allUUIDs: string[] = getAllLocalStorageUUIDs();
        const newAccountItems: Array<Account> = [];
        const profileDataResponse: Array<UserProfileOrgDataFragment | null> = [];
        const routerURI = getRouterUri();
        if (!routerURI) return;
        await Promise.all(
          allUUIDs.map(async (curUUID: string) => {
            const response = await fetchUserProfileOrgDataFromID(routerURI, curUUID);
            if (response) {
              profileDataResponse.push(response);
            }
          })
        );
        if (allUUIDs.length > 0) {
          const userAccounts = await Promise.all(
            allUUIDs.map(async (uuidElem) => {
              const emailAliases = await getAliasesForUser(routerURI, uuidElem);
              const defaultEmailAlias = getDefaultEmailAlias(uuidElem);
              const curDefault = defaultEmailAlias || (emailAliases ? emailAliases[0] : undefined);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const curUser = profileDataResponse?.find(
                (elem: UserProfileOrgDataFragment | null) => elem?.userID === uuidElem
              );
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const orgName = curUser?.rootOrganization?.name;
              return {
                label: orgName || curDefault || '',
                sublabel: orgName ? curDefault : undefined,
                orgAvatar: curUser?.rootOrganization?.displayPictureData || undefined,
                userAvatar: curUser?.publicData?.displayPictureData || undefined,
                numUnread: undefined,
                onClick: () => {
                  storeLatestUserID(uuidElem);
                  window.location.reload();
                },
                active: uuidElem === user.userID
              };
            })
          );
          newAccountItems.push(...userAccounts);
        }
        setOtherAccountInfo(newAccountItems);
      } catch (error) {
        console.error('Failed to set accounts in app switcher', error);
      }
    };
    void getAllAccounts();
  }, [user.userID, history, dispatch]);

  const generalActions: SectionAction[] = [
    {
      label: 'Log out',
      onClick: openLogout,
      dataTest: 'Logout',
      key: 'Logout'
    }
  ];

  const pageSection = {
    workspaces: otherAccountInfo,
    actions: [
      {
        label: 'Add account',
        onClick: () => {
          void storeWorkspaceEvent({
            variables: {
              request: {
                eventName: WorkspaceEventType.AddAccountStart,
                version: DEFAULT_WORKSPACE_EVENT_VERSION,
                data: ''
              }
            }
          });
          window.location.replace('/login#ADD_ACCOUNT');
        },
        icon: Icon.Plus,
        dataTest: 'add-account',
        key: 'add-account'
      }
    ]
  };

  // TODO: store workspace event
  const storeEvent = () => {};

  return (
    <OrganizationSelect
      actions={generalActions}
      activeApp={ProductApp.Calendar}
      blockPointerEvents
      label={formattedUsername}
      numBannersOpen={numBannersOpen}
      section={pageSection}
      sidepanelOpen
      storeWorkspaceEvent={storeEvent}
      username={username}
    />
  );
};

export default AppSwitcher;
