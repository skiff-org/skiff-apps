import { Icon } from 'nightwatch-ui';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DEFAULT_WEB_SETTING_INDICES,
  TabPage,
  SettingValue,
  SidebarSectionType,
  ActionSidebarItemProps,
  ActionSidebarItem,
  SidebarSectionProps,
  useToast
} from 'skiff-front-utils';
import { Sidebar } from 'skiff-front-utils';
import { useUserLabelsQuery } from 'skiff-mail-graphql';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useDrafts } from '../../hooks/useDrafts';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { RootState } from '../../redux/store/reduxStore';
import { DNDItemTypes } from '../../utils/dragAndDrop';
import {
  isDefaultSidebarLabel,
  sortByName,
  SYSTEM_LABELS,
  userLabelFromGraphQL,
  splitUserLabelsAndFolders
} from '../../utils/label';
import AppSwitcher from '../modals/AppSwitcher';
import { useSettings } from '../Settings/useSettings';

import { LabelSidebarItem, LabelVariants } from './SidebarItem';

const BottomContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  flex-grow: 0;
  justify-content: flex-end;
`;

export const SidebarDataTest = {
  openComposeButton: 'open-compose-button'
};

export const MailSidebar: React.FC = () => {
  const user = useRequiredCurrentUserData();
  const dispatch = useDispatch();
  const { composeOpen, isComposeCollapsed } = useSelector((state: RootState) => state.modal);
  const { composeNewDraft } = useDrafts();
  const { openSettings } = useSettings();
  const { data } = useUserLabelsQuery();
  const [userLabels, userFolders] = splitUserLabelsAndFolders(
    data?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );
  const { enqueueToast } = useToast();

  const openCommandPalette = () =>
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
  const openSettingsModal = () => openSettings(DEFAULT_WEB_SETTING_INDICES);
  const expand = () => dispatch(skemailModalReducer.actions.expand());
  const openImportSettings = () => openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
  // open invite users modal
  const openInviteUsersModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.InviteUsers }));
  };
  const openFeedbackModal = () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Feedback }));

  const openCompose = () => {
    if (composeOpen) {
      if (isComposeCollapsed) {
        expand();
      } else {
        enqueueToast({
          body: 'You are already composing a message',
          icon: Icon.Warning,
          position: {
            vertical: 'top',
            horizontal: 'center'
          }
        });
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

  const sections: SidebarSectionProps[] = [
    {
      id: 'system-inbox',
      content: {
        type: SidebarSectionType.NonCollapsible,
        label: 'General',
        items: SYSTEM_LABELS.filter(isDefaultSidebarLabel).map((label) => ({
          SectionItem: () => <LabelSidebarItem key={label.value} label={label} variant={LabelVariants.System} />,
          key: label.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No inboxes found'
      }
    },
    {
      id: 'more-inbox',
      content: {
        type: SidebarSectionType.Collapsible,
        label: 'More',
        items: SYSTEM_LABELS.filter((label) => !isDefaultSidebarLabel(label)).map((label) => ({
          SectionItem: () => <LabelSidebarItem key={label.value} label={label} variant={LabelVariants.System} />,
          key: label.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No inboxes found'
      }
    },
    {
      id: 'mail-folders',
      content: {
        type: SidebarSectionType.Collapsible,
        label: 'Folders',
        items: userFolders.map((folder) => ({
          SectionItem: () => <LabelSidebarItem key={folder.value} label={folder} variant={LabelVariants.Folder} />,
          key: folder.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No folders created',
        titleButton: {
          onClick: (e) => {
            e.stopPropagation();
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
        items: userLabels.map((folder) => ({
          SectionItem: () => <LabelSidebarItem key={folder.value} label={folder} variant={LabelVariants.Folder} />,
          key: folder.value
        })),
        acceptedDragType: DNDItemTypes.MESSAGE_CELL,
        noItemsLabel: 'No labels created',
        titleButton: {
          onClick: (e) => {
            e.stopPropagation();
            dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CreateOrEditLabelOrFolder }));
          },
          tooltip: 'New label'
        }
      }
    }
  ];

  const footerActions: ActionSidebarItemProps[] = [
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
