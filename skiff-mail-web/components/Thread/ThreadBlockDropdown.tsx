import { Button, Divider, Drawer, Dropdown, DropdownItem, DropdownSubmenu, Icon, IconText } from '@skiff-org/skiff-ui';
import React, { RefObject } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { AddressObject, SystemLabels } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useThreadActions } from '../../hooks/useThreadActions';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { PopulateComposeContent, PopulateComposeTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { BlockUnblockSenderType, ModalType, ReportPhishingOrConcernType } from '../../redux/reducers/modalTypes';
import { LABEL_TO_SYSTEM_LABEL, SystemLabel } from '../../utils/label';
import { handleMarkAsReadUnreadClick } from '../../utils/mailboxUtils';
import LabelDropdownContent from '../labels/LabelDropdownContent';
import { DrawerOption, DrawerOptions } from '../shared/DrawerOptions';

type ThreadBlockDropdownProps = {
  thread: MailboxThreadInfo;
  email: MailboxEmailInfo;
  open: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
  setOpen: (open: boolean) => void;
  onClose: () => void;
};

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 12px 0;
  gap: 4px;
  justify-content: space-between;
  width: 100%;
`;

enum OptionWithSubOption {
  Report = 'Report'
}

interface ThreadBlockOptions {
  label: string;
  icon?: Icon;
  onClick?: (e?: any) => void;
  subOptions?: ThreadBlockOptions[];
  customComponent?: React.ReactElement;
}

export const ThreadBlockDropdown = ({ thread, email, open, buttonRef, setOpen, onClose }: ThreadBlockDropdownProps) => {
  const { value: currentLabel } = useRouterLabelContext();
  const { composeNewDraft } = useDrafts();
  const dispatch = useDispatch();
  const openCompose = (populateComposeContent: PopulateComposeContent) => {
    composeNewDraft();
    dispatch(skemailModalReducer.actions.openCompose({ populateComposeContent }));
  };
  // Open drawer state -> gets updated from MobileThreadHeader
  const drawerOpen = useAppSelector((state) => state.mobileDrawer.showMoreThreadOptionsDrawer);

  // Current selected email state
  const currentEmail = useAppSelector((state) => state.mobileDrawer.currentEmail);

  const { moveThreads, trashThreads } = useThreadActions();

  const openPhishingOrConcernModal = (purpose: ReportPhishingOrConcernType) => {
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.ReportPhishingOrConcern,
        threadID: thread.threadID,
        emailID: email.id,
        fromAddress: email.from.address,
        systemLabels: thread.attributes.systemLabels,
        purpose: purpose
      })
    );
  };

  const openBlockUnblockSenderModal = (from: AddressObject, action: BlockUnblockSenderType) => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.BlockUnblockSender, from, action }));
  };

  // Show report block thread drawer
  const showReportDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowReportThreadBlockDrawer(true));
  };

  // Hide current drawer
  const hideDrawer = () => {
    setOpen(false);
    dispatch(skemailMobileDrawerReducer.actions.setShowMoreThreadOptionsDrawer(false));
  };

  const moveThread = (targetLabel: SystemLabel) => {
    void moveThreads(
      [thread.threadID],
      targetLabel,
      currentLabel === SystemLabels.Drafts,
      currentLabel === SystemLabels.Trash
    );
  };

  const isThreadSpam = thread.attributes.systemLabels.includes(SystemLabels.Spam);

  const isSenderBlocked = email.from.blocked;

  const getReportSuboptions = () => {
    const subOptions = [
      {
        label: 'Report phishing',
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          openPhishingOrConcernModal(ReportPhishingOrConcernType.Phishing);
        }
      },
      {
        label: 'Report a concern',
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          openPhishingOrConcernModal(ReportPhishingOrConcernType.Concern);
        }
      }
    ];

    // Block or unblock sender options
    // Only add them  if we aren't on the Sent page.
    // On Sent, the sender is always the user.
    if (currentLabel !== SystemLabels.Sent) {
      subOptions.unshift({
        label: isSenderBlocked ? 'Unblock sender' : 'Block sender',
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          openBlockUnblockSenderModal(
            email.from,
            isSenderBlocked ? BlockUnblockSenderType.Unblock : BlockUnblockSenderType.Block
          );
        }
      });
    }

    // Report spam or not spam options
    subOptions.unshift({
      label: isThreadSpam ? 'Mark as not spam' : 'Report spam',
      onClick: () => {
        moveThread(isThreadSpam ? LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox] : LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam]);
      }
    });
    return subOptions;
  };

  const reportSubOptions = getReportSuboptions();

  const getLabelSubDropdown = () => (
    <DropdownSubmenu icon={Icon.Tag} key='label' label='Add label'>
      <LabelDropdownContent threadID={thread.threadID} />
    </DropdownSubmenu>
  );

  const getMoveToTrashOrInboxOption = () => {
    if (thread.attributes.systemLabels.includes(SystemLabels.Trash)) {
      return {
        label: 'Move to inbox',
        icon: Icon.Inbox,
        onClick: () => {
          void moveThread(LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox]);
        }
      };
    }
    return {
      label: 'Move to trash',
      icon: Icon.Trash,
      onClick: () => {
        void trashThreads([thread.threadID], currentLabel === SystemLabels.Drafts);
      }
    };
  };

  const threadOptions: ThreadBlockOptions[] = [
    {
      label: 'Reply',
      icon: Icon.Reply,
      onClick: () => {
        openCompose({ type: PopulateComposeTypes.Reply, email, thread });
      }
    },
    {
      label: 'Reply all',
      icon: Icon.ReplyAll,
      onClick: () => {
        openCompose({ type: PopulateComposeTypes.ReplyAll, email, thread });
      }
    },
    {
      label: 'Forward',
      icon: Icon.ForwardEmail,
      onClick: () => {
        openCompose({ type: PopulateComposeTypes.Forward, email, thread });
      }
    },
    {
      label: `Mark as ${thread.attributes.read ? 'unread' : 'read'}`,
      icon: Icon.EnvelopeUnread,
      onClick: () => {
        void handleMarkAsReadUnreadClick([thread], false);
        onClose();
      }
    },
    {
      label: 'Add label',
      icon: Icon.Tag,
      customComponent: getLabelSubDropdown()
    },
    getMoveToTrashOrInboxOption(),
    {
      label: OptionWithSubOption.Report,
      icon: Icon.Spam,
      subOptions: reportSubOptions
    }
  ];

  const mobileThreadActions = [...threadOptions];
  const actions = mobileThreadActions.splice(0, 3); //Actions for mobile

  if (!open && !drawerOpen) {
    return null;
  }

  // If current email is not the same as the email prop do not open drawer
  if (isMobile && currentEmail && email.id !== currentEmail.id) {
    return null;
  }

  // Maps options to dropdown items, recursively adding suboptions
  const optionToItem = (option) => {
    if (option.customComponent) {
      return option.customComponent;
    }
    if (option.subOptions) {
      return (
        <DropdownSubmenu icon={option.icon} key={option.label} label={option.label}>
          {option.subOptions.map(optionToItem)}
        </DropdownSubmenu>
      );
    }
    return (
      <DropdownItem
        dataTest={option.label}
        icon={option.icon}
        key={option.label}
        label={option.label}
        onClick={(e?: React.MouseEvent) => {
          option.onClick(e);
          setOpen(false);
        }}
      />
    );
  };

  const createMobileActions = () => (
    // Top Actions (Reply Forward ReplyAll)
    <ActionsContainer>
      {actions.map((action) => (
        <Button key={action.label} onClick={action.onClick as any} startIcon={action.icon} type='secondary'>
          {action.label}
        </Button>
      ))}
    </ActionsContainer>
  );

  const mobileOptionsToItem = (option) => {
    if (option.subOptions) {
      // Move thread button
      return (
        <DrawerOption
          key={option.label}
          onClick={() => {
            //Sub-option drawers must replace current drawer
            hideDrawer();
            if (option.label === OptionWithSubOption.Report) {
              dispatch(skemailMobileDrawerReducer.actions.setReportThreadBlockOptions(reportSubOptions)); // Set report options
              showReportDrawer(); // Show report thread block drawer
            }
          }}
        >
          <IconText key={option.label} label={option.label} startIcon={option.icon} type='paragraph' />
        </DrawerOption>
      );
    }
    return (
      <DrawerOption key={option.label} onClick={option.onClick}>
        <IconText key={option.label} label={option.label} startIcon={option.icon} type='paragraph' />
      </DrawerOption>
    );
  };

  return isMobile ? (
    <>
      <Drawer hideDrawer={hideDrawer} show={open || drawerOpen}>
        <DrawerOptions>
          <DrawerOption>{createMobileActions()}</DrawerOption>
          <Divider />
          {mobileThreadActions.map(mobileOptionsToItem)}
        </DrawerOptions>
      </Drawer>
    </>
  ) : (
    <Dropdown buttonRef={buttonRef} portal setShowDropdown={setOpen}>
      {threadOptions.map(optionToItem)}
    </Dropdown>
  );
};
