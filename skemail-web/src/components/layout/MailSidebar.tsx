import { FilledVariant, Icon, IconText, Size } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetNumUnreadAllLabelsQuery, useUserLabelsQuery } from 'skiff-front-graphql';
import {
  ActionSidebarItemProps,
  DEFAULT_WEB_SETTING_INDICES,
  MAIL_MOBILE_APP_DOWNLOAD_LINK,
  SettingValue,
  Sidebar,
  SidebarSectionProps,
  SidebarSectionType,
  StorageBar,
  TabPage,
  useCurrentUserEmailAliases,
  useDefaultEmailAlias,
  useGetFF,
  usePrevious,
  useRequiredCurrentUserData,
  useStorageUsage
} from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import useSearchClick from '../../hooks/useSearchClick';
import { useShowAliasInboxes } from '../../hooks/useShowAliasInboxes';
import { ComposeExpandTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { RootState } from '../../redux/store/reduxStore';
import { DNDItemTypes } from '../../utils/dragAndDrop';
import {
  FILES_LABEL,
  isDefaultSidebarLabel,
  orderAliasLabels,
  sortByName,
  splitUserLabelsByVariant,
  SYSTEM_LABELS,
  userLabelFromGraphQL
} from '../../utils/label';
import BulkSilenceFooter from '../BulkSilenceFooter/BulkSilenceFooter';
import AppSwitcher from '../modals/AppSwitcher';
import { useSettings } from '../Settings/useSettings';

import { LabelSidebarItem, LabelVariants } from './SidebarItem';

const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BottomContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-grow: 0;
  gap: 16px;
  padding: 8px;
  padding-top: 12px;
  justify-content: flex-end;
  border-top: 1px solid var(--border-tertiary);
`;

const Wrapper = styled.div<{ $leftAuto?: boolean }>`
  margin-left: ${({ $leftAuto }) => ($leftAuto ? 'auto' : '0')};
`;

export const SidebarDataTest = {
  openComposeButton: 'open-compose-button'
};

interface UnreadCountsObj {
  [key: string]: number;
}

export const MailSidebar: React.FC = () => {
  const { showAliasInboxes } = useShowAliasInboxes();

  const user = useRequiredCurrentUserData();
  const dispatch = useDispatch();
  const [silenceFooterOpen, setSilenceFooterOpen] = useState(false);
  const { composeOpen, composeCollapseState } = useSelector((state: RootState) => state.modal);
  const { composeNewDraft } = useDrafts();
  const { openSettings } = useSettings();
  const { data } = useUserLabelsQuery();
  const { labels, folders, aliasLabels } = splitUserLabelsByVariant(
    data?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );

  const { totalUsageBytes, maxTotalStorageMB, isLoading } = useStorageUsage(user.userID);

  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);
  const { walletAliasesWithName } = useCurrentUserEmailAliases();
  const { handleSearchClick } = useSearchClick();

  const { isImportInProgress } = useAppSelector((state) => state.import);
  const { bulkJobID } = useAppSelector((state) => state.mailbox.inProgressBulkAction) ?? {};
  const prevBulkActionJobID = usePrevious(bulkJobID);
  const isBulkActionDone = !!prevBulkActionJobID && !bulkJobID;

  const LABELS_TO_EXCLUDE = [SystemLabels.Sent, SystemLabels.Drafts, FILES_LABEL.value];
  const orderedAliasLabels = orderAliasLabels(aliasLabels, defaultEmailAlias);

  const sidebarSystemLabels = SYSTEM_LABELS.filter((systemLabel) => isDefaultSidebarLabel(systemLabel));

  const systemLabelValues = sidebarSystemLabels
    .filter(
      (label) =>
        !LABELS_TO_EXCLUDE.includes(label.value) && !(label.value === SystemLabels.Imports && isImportInProgress)
    )
    .map((label) => label.value);

  const orderedAliasLabelValues = orderedAliasLabels.map((label) => label.value);
  const folderValues = folders.map((folder) => folder.value);
  const labelsValues = labels.map((label) => label.value);

  const { data: unreadData, refetch: refetchUnreadData } = useGetNumUnreadAllLabelsQuery({
    variables: {
      labels: [...systemLabelValues, ...orderedAliasLabelValues, ...folderValues, ...labelsValues]
    },
    pollInterval: POLL_INTERVAL_IN_MS
  });

  // refetch unread data after a bulk action finishes
  useEffect(() => {
    if (isBulkActionDone) void refetchUnreadData();
  }, [isBulkActionDone, refetchUnreadData]);

  const unreadCounts = unreadData?.unreadAllLabels || [];
  const unreadCountsObj: UnreadCountsObj = unreadCounts.reduce((acc, { label, count }) => {
    acc[label] = count;
    return acc;
  }, {});

  const showMailAppFooterButton = useGetFF<boolean>('showMailAppFooterButton');

  const openSettingsModal = () => openSettings(DEFAULT_WEB_SETTING_INDICES);
  const expand = () => dispatch(skemailModalReducer.actions.expand());
  const openContactSettings = () => {
    openSettings({ tab: TabPage.Contacts, setting: SettingValue.Contacts });
  };
  const openPlanPage = () => openSettings({ tab: TabPage.Plans });

  // open invite users modal
  const openInviteUsersModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      onClick: handleSearchClick
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
        label: 'Mail',
        items: sidebarSystemLabels.map((label) => ({
          SectionItem: () => (
            <LabelSidebarItem
              key={label.value}
              label={label}
              numUnread={unreadCountsObj[label.value]}
              variant={LabelVariants.System}
            />
          ),
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
              label: 'Addresses',
              items: orderedAliasLabels.map((aliasLabel) => ({
                SectionItem: () => (
                  <LabelSidebarItem
                    key={aliasLabel.value}
                    label={aliasLabel}
                    numUnread={unreadCountsObj[aliasLabel.value]}
                    variant={LabelVariants.Alias}
                    walletAliasesWithName={walletAliasesWithName}
                  />
                ),
                key: aliasLabel.value
              })),
              acceptedDragType: DNDItemTypes.MESSAGE_CELL,
              noItemsLabel: 'No address inboxes',
              titleButton: {
                onClick: (e?: React.MouseEvent<Element, MouseEvent>) => {
                  e?.stopPropagation();
                  openSettings({ tab: TabPage.Addresses, setting: SettingValue.AddEmailAlias });
                },
                tooltip: 'Add address'
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
          SectionItem: () => (
            <LabelSidebarItem
              key={folder.value}
              label={folder}
              numUnread={unreadCountsObj[folder.value]}
              variant={LabelVariants.Folder}
            />
          ),
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
          SectionItem: () => (
            <LabelSidebarItem
              key={folder.value}
              label={folder}
              numUnread={unreadCountsObj[folder.value]}
              variant={LabelVariants.Folder}
            />
          ),
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
    tooltip: 'Contacts',
    icon: Icon.UserCircle,
    onClick: openContactSettings
  };

  const mobileQrAction = {
    icon: Icon.Mobile,
    tooltip: 'Download app',
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
      icon: Icon.UserPlus,
      tooltip: 'Invite',
      onClick: openInviteUsersModal
    },
    {
      label: 'Feedback',
      icon: Icon.Comment,
      onClick: openFeedbackModal
    }
  ];

  return (
    <Sidebar
      AppSwitcher={<AppSwitcher numUnread={unreadCountsObj[SystemLabels.Inbox]} user={user} />}
      Footer={
        <BottomContainer>
          <BulkSilenceFooter setSilenceFooterOpen={setSilenceFooterOpen} />
          {!silenceFooterOpen && (
            <StorageBar
              maxStorageMegabytes={isLoading ? undefined : maxTotalStorageMB}
              onClick={openPlanPage}
              linear
              storageBytesUsed={isLoading ? undefined : totalUsageBytes}
            />
          )}
          <Buttons>
            {footerActions.map(({ label, tooltip, icon, onClick }, index) => {
              return (
                <Wrapper $leftAuto={index === footerActions.length - 1} key={label}>
                  <IconText
                    variant={FilledVariant.FILLED}
                    startIcon={icon}
                    label={label}
                    tooltip={tooltip}
                    size={Size.SMALL}
                    onClick={(e?: React.MouseEvent) => {
                      e?.stopPropagation();
                      if (onClick) onClick(e);
                    }}
                  />
                </Wrapper>
              );
            })}
          </Buttons>
        </BottomContainer>
      }
      primaryActions={primaryActions}
      sections={sections}
    />
  );
};

export default MailSidebar;
