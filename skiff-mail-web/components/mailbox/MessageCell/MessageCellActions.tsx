import { Icon, IconButton, TooltipLabelProps } from 'nightwatch-ui';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels } from 'skiff-graphql';

import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { handleMarkAsReadUnreadClick } from '../../../utils/mailboxUtils';

interface MessageCellActionsProps {
  // selected thread
  thread: MailboxThreadInfo;
  // whether thread is read or unread
  read: boolean;
  // path label
  label: string;
}

/**
 * MessageCellActions
 *
 * Component for rendering actions that modify items in the Mailbox (e.g. delete, move, mark as reads).
 * This component appears in the message cell and modifies a single selection (i.e. message thread).
 *
 */
export const MessageCellActions = ({ read, thread, label }: MessageCellActionsProps) => {
  const dispatch = useDispatch();
  const { archiveThreads, trashThreads, moveThreads } = useThreadActions();

  const markAsReadUnreadClick = useCallback(async () => {
    await handleMarkAsReadUnreadClick([thread], !read);
  }, [read, thread]);

  const isTrashed = label === SystemLabels.Trash;
  const isArchived = label === SystemLabels.Archive;
  const isDraft = label === SystemLabels.Drafts;
  const isScheduled = label === SystemLabels.ScheduleSend;
  const isTrashedOrArchived = isTrashed || isArchived;

  const handleThrashThread = () =>
    isScheduled
      ? dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.UnSendMessage, thread }))
      : trashThreads([thread.threadID], isDraft);

  const renderIconButton = (icon: Icon, tooltip: TooltipLabelProps | string, onClick: () => void) => (
    <IconButton
      color='secondary'
      icon={icon}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }}
      size='small'
      tooltip={tooltip}
    />
  );

  return (
    <>
      {/* read / unread */}
      {!isDraft &&
        renderIconButton(
          read ? Icon.EnvelopeUnread : Icon.EnvelopeRead,
          read ? 'Mark as unread' : 'Mark as read',
          () => void markAsReadUnreadClick()
        )}
      {/* undo trash / archive */}
      {isTrashedOrArchived &&
        renderIconButton(
          Icon.MoveMailbox,
          { title: 'Move to inbox', shortcut: 'Z' },
          () => void moveThreads([thread.threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label])
        )}
      {/* archive */}
      {!isDraft &&
        !isTrashedOrArchived &&
        renderIconButton(
          Icon.Archive,
          { title: 'Archive', shortcut: 'E' },
          () => void archiveThreads([thread.threadID])
        )}
      {/* trash */}
      {!isTrashedOrArchived &&
        renderIconButton(Icon.Trash, { title: 'Trash', shortcut: '#' }, () => void handleThrashThread())}
    </>
  );
};
