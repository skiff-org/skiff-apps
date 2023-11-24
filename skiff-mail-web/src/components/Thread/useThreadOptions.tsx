import { DropdownSubmenu, Icon, InputField } from 'nightwatch-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { AddressObject, SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';

import { useDrafts } from '../../hooks/useDrafts';
import { useMarkAsReadUnread } from '../../hooks/useMarkAsReadUnread';
import { useThreadActions } from '../../hooks/useThreadActions';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { BlockUnblockSenderType, ModalType, ReportPhishingOrConcernType } from '../../redux/reducers/modalTypes';
import { LABEL_TO_SYSTEM_LABEL, SystemLabel } from '../../utils/label';
import { LABEL_DROPDOWN_WIDTH } from '../labels/LabelDropdownContent';
import MoveToLabelDropdownContent from '../labels/MoveToLabelDropdownContent';

import { OptionWithSubOption, ThreadBlockOptions } from './Thread.types';

export const useThreadOptions = (
  thread: ThreadDetailInfo | undefined,
  email: MailboxEmailInfo | undefined,
  currentLabel: string,
  defaultEmailAlias: string | undefined,
  emailAliases: string[],
  quickAliases: string[],
  setOpenThreadOptionsDropdown?: (open: boolean) => void,
  setConfirmSilencingModalOpen?: (open: boolean) => void
) => {
  const [search, setSearch] = useState('');

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
        quickAliases,
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
        quickAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  const forward = () => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.forwardCompose({ email, emailAliases, quickAliases, defaultEmailAlias, thread })
    );
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
    const onlyInTrash = thread.attributes.systemLabels.length === 1 && isTrash;
    const isArchive = thread.attributes.systemLabels.includes(SystemLabels.Archive);
    const isImported = thread.attributes.userLabels.some((label) => label.variant === UserLabelVariant.Import);
    const isScheduleSend = thread.attributes.systemLabels.includes(SystemLabels.ScheduleSend);
    // if trash or archive, undo
    if (onlyInTrash || isArchive) {
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
      ...insertIf(!isImported && !isScheduleSend, {
        label: 'Archive',
        icon: Icon.Archive,
        onClick: () => {
          void archiveThreads([thread.threadID]);
        },
        emailSpecific: false
      }),
      ...insertIf(isScheduleSend, {
        label: 'Cancel send',
        icon: Icon.ClockSlash,
        onClick: () => {
          dispatch(
            skemailModalReducer.actions.setOpenModal({
              type: ModalType.UnSendMessage,
              // we pass only the ID since 'activeThread' doesn't have the message body;
              // and UnSendMessage will retrieve full thread from the ID
              threadID: thread.threadID
            })
          );
        },
        emailSpecific: false
      }),
      ...insertIf(!isScheduleSend, {
        label: 'Trash',
        icon: Icon.Trash,
        onClick: () => {
          void trashThreads([thread.threadID], currentLabel === SystemLabels.Drafts, undefined, currentLabel);
        },
        isMobileActionButton: true,
        emailSpecific: false
      })
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
      const showSilencingOption = !isSenderBlocked && !!setConfirmSilencingModalOpen && !isMobile;
      subOptions.unshift({
        label: isSenderBlocked ? 'Unsilence sender' : `Silence sender`,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          if (showSilencingOption) {
            setConfirmSilencingModalOpen(true);
            return;
          }
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
    <DropdownSubmenu
      icon={Icon.Tag}
      inputField={<InputField onChange={(e) => setSearch(e.target.value)} value={search} />}
      key='label'
      label='Add label'
      width={LABEL_DROPDOWN_WIDTH}
    >
      <MoveToLabelDropdownContent
        currentSystemLabels={[currentLabel]}
        search={search}
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
