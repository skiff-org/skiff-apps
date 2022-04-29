import { Icon, IconButton } from '@skiff-org/skiff-ui';
import { useCallback } from 'react';

import { SystemLabels } from '../../../generated/graphql';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
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
  const { trashThreads, undoTrashThreads } = useThreadActions();

  const markAsReadUnreadClick = useCallback(async () => {
    await handleMarkAsReadUnreadClick([thread], !read);
  }, [read, thread]);

  const isTrashed = label === SystemLabels.Trash;
  const isDraft = label === SystemLabels.Drafts;

  return (
    <>
      {!isDraft && (
        <IconButton
          icon={!read ? Icon.EnvelopeRead : Icon.EnvelopeUnread}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            void markAsReadUnreadClick();
          }}
          tooltip={!read ? 'Mark as read' : 'Mark as unread'}
        />
      )}
      <IconButton
        icon={isTrashed ? Icon.Undo : Icon.Trash}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (isTrashed) {
            void undoTrashThreads([thread.threadID]);
          } else {
            void trashThreads([thread.threadID], label === SystemLabels.Drafts);
          }
        }}
        tooltip={isTrashed ? 'Undo' : 'Move to trash'}
      />
    </>
  );
};
