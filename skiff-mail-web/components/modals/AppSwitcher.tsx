import { Icon } from '@skiff-org/skiff-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetNumUnreadQuery } from 'skiff-front-graphql';
import {
  fetchUserProfileOrgDataFromID,
  getAliasesForUser,
  models,
  UserProfileOrgDataFragment
} from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  OrganizationSelect,
  SectionAction,
  TabPage,
  getAllLocalStorageUUIDs,
  storeLatestUserID,
  getDefaultEmailAlias
} from 'skiff-front-utils';
import { SubscriptionPlan, SystemLabels, WorkspaceEventType, ProductApp } from 'skiff-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';

import { getRouterUri } from '../../apollo/client';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useUsernameFromUser } from '../../hooks/useUsernameFromUser';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { storeWorkspaceEvent, useSubscriptionPlan } from '../../utils/userUtils';
import { useSettings } from '../Settings/useSettings';

interface AppSwitcherProps {
  user: models.User;
}

interface Account {
  label: string;
  sublabel?: string;
  onClick: () => void;
  active: boolean;
  warning?: boolean;
}

const AppSwitcher: React.FC<AppSwitcherProps> = ({ user }) => {
  const dispatch = useDispatch();
  const { data: numUnread } = useGetNumUnreadQuery({
    variables: { label: SystemLabels.Inbox },
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const openLogout = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Logout }));
  };
  const { openSettings } = useSettings();

  const openPlansPage = () => openSettings({ tab: TabPage.Plans });
  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();

  const { username, formattedUsername } = useUsernameFromUser(user);
  const [otherAccountInfo, setOtherAccountInfo] = useState<Account[]>([]);

  // Duplicated from editor app switcher, without alter egos
  // Exactly the same as calendar logic
  useEffect(() => {
    const getAllAccounts = async () => {
      try {
        const allUUIDs: string[] = getAllLocalStorageUUIDs();
        const newAccountItems: Array<Account> = [];
        const profileDataResponse: Array<UserProfileOrgDataFragment | null> = [];
        const routerURI = getRouterUri();
        if (!routerURI) return;
        await Promise.all(
          allUUIDs.map(async (curID: string) => {
            const response = await fetchUserProfileOrgDataFromID(routerURI, curID);
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

  if (activeSubscription === SubscriptionPlan.Free) {
    generalActions.unshift({
      label: 'Upgrade to Pro',
      onClick: openPlansPage,
      dataTest: 'Upgrade',
      key: 'Upgrade'
    });
  }

  const pageSection = {
    workspaces: otherAccountInfo,
    actions: [
      {
        label: 'Add account',
        onClick: () => {
          void storeWorkspaceEvent(WorkspaceEventType.AddAccountStart, '', DEFAULT_WORKSPACE_EVENT_VERSION);
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

  return (
    <OrganizationSelect
      actions={generalActions}
      activeApp={ProductApp.Mail}
      blockPointerEvents
      label={formattedUsername}
      numBannersOpen={bannersOpen.length}
      numUnread={numUnread?.unread}
      section={pageSection}
      sidepanelOpen
      storeWorkspaceEvent={() => void storeEvent}
      username={username}
    />
  );
};

export default AppSwitcher;
