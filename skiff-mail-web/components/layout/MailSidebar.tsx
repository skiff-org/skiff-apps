import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from '@skiff-org/skiff-ui';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import {
  ActionSidebarItem,
  ActionSidebarItemProps,
  DEFAULT_WEB_SETTING_INDICES,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  SettingValue,
  Sidebar,
  SidebarSectionProps,
  SidebarSectionType,
  TabPage,
  useDefaultEmailAlias,
  useRequiredCurrentUserData,
  getEnvironment,
  MAIL_MOBILE_APP_DOWNLOAD_LINK
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { useDrafts } from '../../hooks/useDrafts';
import { useShowAliasInboxes } from '../../hooks/useShowAliasInboxes';
import { ComposeExpandTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { RootState } from '../../redux/store/reduxStore';
import { DNDItemTypes } from '../../utils/dragAndDrop';
import {
  isDefaultSidebarLabel,
  orderAliasLabels,
  sortByName,
  splitUserLabelsByVariant,
  SYSTEM_LABELS,
  userLabelFromGraphQL
} from '../../utils/label';
import { storeWorkspaceEvent } from '../../utils/userUtils';
import AppSwitcher from '../modals/AppSwitcher';
import { useSettings } from '../Settings/useSettings';

import { LabelSidebarItem, LabelVariants } from './SidebarItem';

const BottomContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  flex-grow: 0;
  padding: 6px 0;
  justify-content: flex-end;
  border-top: 1px solid var(--border-tertiary);
`;

export const SidebarDataTest = {
  openComposeButton: 'open-compose-button'
};

export const MailSidebar: React.FC = () => {
  const { showAliasInboxes } = useShowAliasInboxes();

  const user = useRequiredCurrentUserData();
  const dispatch = useDispatch();
  const { composeOpen, composeCollapseState } = useSelector((state: RootState) => state.modal);
  const { composeNewDraft } = useDrafts();
  const { openSettings } = useSettings();
  const { data } = useUserLabelsQuery();
  const { labels, folders, aliasLabels } = splitUserLabelsByVariant(
    data?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );
  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);
  const flags = useFlags();
  const env = getEnvironment(new URL(window.location.origin));
  const showMailAppFooterButton = env === 'local' || env === 'vercel' || (flags.showMailAppFooterButton as boolean);

  const openCommandPalette = () =>
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
  const openSettingsModal = () => openSettings(DEFAULT_WEB_SETTING_INDICES);
  const expand = () => dispatch(skemailModalReducer.actions.expand());
  const openImportSettings = () => {
    openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
    void storeWorkspaceEvent(WorkspaceEventType.MailImportOpen, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };
  const openContactSettings = () => {
    openSettings({ tab: TabPage.Contacts, setting: SettingValue.Contacts });
  };
  // open invite users modal
  const openInviteUsersModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.InviteUsers }));
  };
  const openFeedbackModal = () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Feedback }));

  const openCompose = () => {
    if (composeOpen) {
      if (composeCollapseState === ComposeExpandTypes.Collapsed) {
        expand();
      }
      return;
    }
    dispatch(skemailModalReducer.actions.openEmptyCompose());
    composeNewDraft();
  };

  const primaryActions: ActionSidebarItemProps[] = [
    {
      dataTest: SidebarDataTest.openComposeButton,
      label: 'Compose',
      icon: Icon.Compose,
      onClick: openCompose,
      primaryAction: true
    },
    {
      label: 'Search',
      icon: Icon.Search,
      onClick: openCommandPalette
    },
    {
      label: 'Settings',
      icon: Icon.Settings,
      onClick: openSettingsModal,
      dataTest: 'settings-sidebar'
    }
  ];

  const orderedAliasLabels = orderAliasLabels(aliasLabels, defaultEmailAlias);

  const sections: SidebarSectionProps[] = [
    {
      id: 'system-inbox',
      content: {
        type: SidebarSectionType.NonCollapsible,
        label: 'Mail',
        items: SYSTEM_LABELS.filter(isDefaultSidebarLabel).map((label) => ({
          SectionItem: () => <LabelSidebarItem key={label.value} label={label} variant={LabelVariants.System} />,
          key: label.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No inboxes found'
      }
    },
    ...(showAliasInboxes
      ? [
          {
            id: 'alias-inboxes',
            canDragToSection: false, // cannot drag threads into alias inboxes
            content: {
              type: SidebarSectionType.Collapsible,
              label: 'Aliases',
              items: orderedAliasLabels.map((aliasLabel) => ({
                SectionItem: () => (
                  <LabelSidebarItem key={aliasLabel.value} label={aliasLabel} variant={LabelVariants.Alias} />
                ),
                key: aliasLabel.value
              })),
              acceptedDragType: DNDItemTypes.MESSAGE_CELL,
              noItemsLabel: 'No alias inboxes',
              titleButton: {
                onClick: (e?: React.MouseEvent<Element, MouseEvent>) => {
                  e?.stopPropagation();
                  openSettings({ tab: TabPage.Aliases, setting: SettingValue.AddEmailAlias });
                },
                tooltip: 'Add alias'
              }
            },
            defaultIsOpenVal: true
          }
        ]
      : []),
    {
      id: 'mail-folders',
      content: {
        type: SidebarSectionType.Collapsible,
        label: 'Folders',
        items: folders.map((folder) => ({
          SectionItem: () => <LabelSidebarItem key={folder.value} label={folder} variant={LabelVariants.Folder} />,
          key: folder.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No folders created',
        titleButton: {
          onClick: (e?: React.MouseEvent<Element, MouseEvent>) => {
            e?.stopPropagation();
            dispatch(
              skemailModalReducer.actions.setOpenModal({
                type: ModalType.CreateOrEditLabelOrFolder,
                folder: true
              })
            );
          },
          tooltip: 'New folder'
        }
      }
    },
    {
      id: 'mail-labels',
      content: {
        type: SidebarSectionType.Collapsible,
        label: 'Labels',
        items: labels.map((folder) => ({
          SectionItem: () => <LabelSidebarItem key={folder.value} label={folder} variant={LabelVariants.Folder} />,
          key: folder.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No labels created',
        titleButton: {
          onClick: (e?: React.MouseEvent<Element, MouseEvent>) => {
            e?.stopPropagation();
            dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CreateOrEditLabelOrFolder }));
          },
          tooltip: 'New label'
        }
      }
    }
  ];

  const contactAction = {
    label: 'Contacts',
    icon: Icon.UserCircle,
    onClick: openContactSettings
  };

  const mobileQrAction = {
    label: 'Download app',
    icon: Icon.Mobile,
    onClick: () => {
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.QrCode,
          title: 'Get the Skiff Mail app',
          description: 'Available on iOS, Android, and macOS',
          link: MAIL_MOBILE_APP_DOWNLOAD_LINK,
          buttonProps: {
            label: 'View all downloads',
            onClick: () => window.open(MAIL_MOBILE_APP_DOWNLOAD_LINK, '_blank')
          }
        })
      );
    }
  };

  const footerActions: ActionSidebarItemProps[] = [
    showMailAppFooterButton ? mobileQrAction : contactAction,
    {
      label: 'Import mail',
      icon: Icon.MoveMailbox,
      onClick: openImportSettings
    },
    {
      label: 'Invite',
      icon: Icon.UserPlus,
      onClick: openInviteUsersModal
    },
    {
      label: 'Send feedback',
      icon: Icon.Comment,
      onClick: openFeedbackModal
    }
  ];

  return (
    <Sidebar
      AppSwitcher={<AppSwitcher user={user} />}
      Footer={
        <BottomContainer>
          {footerActions.map(({ label, icon, onClick }) => (
            <ActionSidebarItem color='secondary' icon={icon} key={label} label={label} onClick={onClick} />
          ))}
        </BottomContainer>
      }
      primaryActions={primaryActions}
      sections={sections}
    />
  );
};

export default MailSidebar;
