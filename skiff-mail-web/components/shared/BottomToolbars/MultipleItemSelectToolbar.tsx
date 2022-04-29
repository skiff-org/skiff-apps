import { Icon } from '@skiff-org/skiff-ui';
import { useCallback } from 'react';
import { SystemLabels } from '../../../generated/graphql';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { handleMarkAsReadUnreadClick } from '../../../utils/mailboxUtils';
import ToolbarButton from './ToolbarButton';

/**
 * Toolbar for when multiple item select is active on
 * mailbox threads/pages (Inbox, Drafts, Sent, etc..)
 */
interface MultipleItemSelectToolbarProps {
  selectedThreadsIds: string[];
  label: string;
  threads: MailboxThreadInfo[];
}
export const MultipleItemSelectToolbar = ({ selectedThreadsIds, label, threads }: MultipleItemSelectToolbarProps) => {
  const { trashThreads } = useThreadActions();
  const isDrafts = label === SystemLabels.Drafts;

  const someSelectedAreUnread = selectedThreadsIds.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );
  const selectedThreads = threads.filter((thread) => selectedThreadsIds.includes(thread.threadID));

  const markAsReadUnreadClick = useCallback(async () => {
    await handleMarkAsReadUnreadClick(selectedThreads, someSelectedAreUnread);
  }, [someSelectedAreUnread, selectedThreads]);

  const nonSelected = selectedThreads.length === 0;
  return (
    <>
      <ToolbarButton
        icon={Icon.Trash}
        disabled={nonSelected}
        onClick={(e) => {
          e.stopPropagation();
          void trashThreads(selectedThreadsIds, isDrafts);
        }}
      />
      <ToolbarButton
        disabled={nonSelected}
        icon={someSelectedAreUnread ? Icon.EnvelopeRead : Icon.EnvelopeUnread}
        onClick={markAsReadUnreadClick}
      />
      <ToolbarButton icon={Icon.OverflowH} disabled={nonSelected} />
    </>
  );
};
