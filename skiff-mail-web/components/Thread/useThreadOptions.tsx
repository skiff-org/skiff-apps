import { Icon } from '@skiff-org/skiff-ui';
import { DropdownSubmenu } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { SystemLabels, UserLabelVariant, AddressObject } from 'skiff-graphql';

import { useDrafts } from '../../hooks/useDrafts';
import { useMarkAsReadUnread } from '../../hooks/useMarkAsReadUnread';
import { useThreadActions } from '../../hooks/useThreadActions';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType, ReportPhishingOrConcernType, BlockUnblockSenderType } from '../../redux/reducers/modalTypes';
import { LABEL_TO_SYSTEM_LABEL, SystemLabel } from '../../utils/label';
import MoveToLabelDropdownContent from '../labels/MoveToLabelDropdownContent';

import { OptionWithSubOption } from './Thread.types';
import { ThreadBlockOptions } from './Thread.types';
export const useThreadOptions = (
  thread: MailboxThreadInfo | undefined,
  email: MailboxEmailInfo | undefined,
  currentLabel: string,
  defaultEmailAlias: string | undefined,
  emailAliases: string[],
  setOpenThreadOptionsDropdown?: (open: boolean) => void
) => {
  const dispatch = useDispatch();
  const { composeNewDraft } = useDrafts();
  const { markThreadsAsReadUnread } = useMarkAsReadUnread();
  const { moveThreads, trashThreads, archiveThreads } = useThreadActions();
  const userSignature = useUserSignature();

  if (!thread || !email) return;
  const isThreadSpam = thread.attributes.systemLabels.includes(SystemLabels.Spam);

  const isSenderBlocked = email.from.blocked;
  // Compose redux actions
  const openBlockUnblockSenderModal = (from: AddressObject, action: BlockUnblockSenderType) => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.BlockUnblockSender, from, action }));
  };
  const reply = () => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyCompose({
        email,
        thread,
        emailAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  const replyAll = () => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyAllCompose({
        email,
        thread,
        emailAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  const forward = () => {
    composeNewDraft();
    dispatch(skemailModalReducer.actions.forwardCompose({ email, emailAliases, defaultEmailAlias }));
  };
  const moveThread = (targetLabel: SystemLabel) => {
    void moveThreads([thread.threadID], targetLabel, [currentLabel]);
  };
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
  // Show label drawer
  const showLabelDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Plain));
  };

  const getMoveToTrashOrInboxOptions = () => {
    const isTrash = thread.attributes.systemLabels.includes(SystemLabels.Trash);
    const isArchive = thread.attributes.systemLabels.includes(SystemLabels.Archive);
    // if trash or archive, undo
    if (isTrash || isArchive) {
      return [
        {
          label: 'Move to inbox',
          icon: Icon.MoveMailbox,
          onClick: () => {
            void moveThread(LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox]);
          },
          isMobileActionButton: true,
          emailSpecific: false
        }
      ];
    }
    return [
      {
        label: 'Archive',
        icon: Icon.Archive,
        onClick: () => {
          void archiveThreads([thread.threadID]);
        },
        emailSpecific: false
      },
      {
        label: 'Trash',
        icon: Icon.Trash,
        onClick: () => {
          void trashThreads([thread.threadID], currentLabel === SystemLabels.Drafts);
        },
        isMobileActionButton: true,
        emailSpecific: false
      }
    ];
  };

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
  const LabelSubDropdown = () => (
    <DropdownSubmenu icon={Icon.Tag} key='label' label='Add label'>
      <MoveToLabelDropdownContent
        currentSystemLabels={[currentLabel]}
        setShowDropdown={(showDropdown) => {
          if (!!setOpenThreadOptionsDropdown) setOpenThreadOptionsDropdown(showDropdown);
        }}
        threadID={thread.threadID}
        variant={UserLabelVariant.Plain}
      />
    </DropdownSubmenu>
  );

  const threadOptions: ThreadBlockOptions[] = [
    {
      label: 'Reply',
      icon: Icon.Reply,
      onClick: reply,
      emailSpecific: true,
      isMobileActionButton: true
    },
    {
      label: 'Reply all',
      icon: Icon.ReplyAll,
      onClick: replyAll,
      emailSpecific: true,
      isMobileActionButton: true
    },
    {
      label: isMobile ? 'Fwd' : 'Forward',
      icon: Icon.ForwardEmail,
      onClick: forward,
      emailSpecific: true,
      isMobileActionButton: true
    },
    ...getMoveToTrashOrInboxOptions(),
    {
      label: OptionWithSubOption.Report,
      icon: Icon.Spam,
      subOptions: getReportSuboptions()
    },
    {
      label: 'Mark as unread',
      icon: Icon.EnvelopeUnread,
      onClick: () => markThreadsAsReadUnread([thread], false)
    },
    {
      label: 'Add label',
      icon: Icon.Tag,
      customComponent: <LabelSubDropdown />,
      onClick: showLabelDrawer,
      emailSpecific: false
    }
  ];

  return { reportSubOptions: getReportSuboptions(), threadOptions };
};
