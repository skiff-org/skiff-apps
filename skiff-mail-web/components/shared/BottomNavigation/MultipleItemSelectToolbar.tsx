import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels } from 'skiff-graphql';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useMarkAsReadUnread } from '../../../hooks/useMarkAsReadUnread';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import MailboxMoreOptionsDrawer from '../../mailbox/MailboxActions/MobileMailboxMoreOptionsDrawer';
import ApplyUserLabelDrawer from '../../Thread/ApplyUserLabelDrawer';

import ToolbarButton from './ToolbarButton';

interface MultipleItemSelectToolbarProps {
  threads: MailboxThreadInfo[];
}

/**
 * Toolbar for when multiple item select is active on
 * mailbox threads/pages (Inbox, Drafts, Sent, etc..)
 */
export const MultipleItemSelectToolbar = ({ threads }: MultipleItemSelectToolbarProps) => {
  const [isMarkAsReadUnreadStarted, setIsMarkAsReadUnreadStarted] = useState(false);
  const dispatch = useDispatch();
  const { archiveThreads, moveThreads, trashThreads, deleteThreads } = useThreadActions();
  const selectedThreadsIds = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const { value: label } = useRouterLabelContext();
  const { markThreadsAsReadUnread, isLoading: isMarkAsReadUnreadLoading } = useMarkAsReadUnread();

  const isTrash = label === SystemLabels.Trash;
  const isArchive = label === SystemLabels.Archive;
  const isDrafts = label === SystemLabels.Drafts;

  const someSelectedAreUnread = selectedThreadsIds.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );
  const selectedThreads = threads.filter((thread) => selectedThreadsIds.includes(thread.threadID));
  const nonSelected = selectedThreads.length === 0;

  // Set mult item selector to false and clear selected threads
  const closeMultiSelectMenu = useCallback(
    () => dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false)),
    [dispatch]
  );
  const onMoreOptionsClick = () => dispatch(skemailMobileDrawerReducer.actions.setShowMailboxMoreOptionsDrawer(true));

  const onMarkAsReadUnreadClick = () => {
    markThreadsAsReadUnread(selectedThreads, someSelectedAreUnread);
    setIsMarkAsReadUnreadStarted(true);
  };

  // Close multi-select toolbar if the user marked all threads as read / unread
  useEffect(() => {
    if (!isMarkAsReadUnreadStarted || isMarkAsReadUnreadLoading) return;
    if (selectedThreads.length === threads.length) closeMultiSelectMenu();
    setIsMarkAsReadUnreadStarted(false);
  }, [
    closeMultiSelectMenu,
    isMarkAsReadUnreadStarted,
    isMarkAsReadUnreadLoading,
    selectedThreads.length,
    threads.length
  ]);

  return (
    <>
      {!isArchive && (
        <ToolbarButton
          disabled={nonSelected}
          icon={Icon.Archive}
          onClick={(e) => {
            e.stopPropagation();
            void archiveThreads(selectedThreadsIds);
            closeMultiSelectMenu();
          }}
        />
      )}
      {!isTrash && (
        <ToolbarButton
          disabled={nonSelected}
          icon={Icon.Trash}
          onClick={(e) => {
            e.stopPropagation();
            void trashThreads(selectedThreadsIds, isDrafts);
            closeMultiSelectMenu();
          }}
        />
      )}
      {isTrash ||
        (isArchive && (
          <ToolbarButton
            disabled={nonSelected}
            icon={Icon.Inbox}
            onClick={(e) => {
              e.stopPropagation();
              void moveThreads(selectedThreadsIds, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
              closeMultiSelectMenu();
            }}
          />
        ))}
      {isTrash && (
        <ToolbarButton
          disabled={nonSelected}
          icon={Icon.Trash}
          onClick={(e) => {
            e.stopPropagation();
            void deleteThreads(selectedThreadsIds);
            closeMultiSelectMenu();
          }}
        />
      )}
      <ToolbarButton
        disabled={nonSelected}
        icon={someSelectedAreUnread ? Icon.EnvelopeRead : Icon.EnvelopeUnread}
        onClick={onMarkAsReadUnreadClick}
      />
      <ToolbarButton disabled={nonSelected} icon={Icon.OverflowH} onClick={onMoreOptionsClick} />
      <MailboxMoreOptionsDrawer label={label} selectedThreadsIds={selectedThreadsIds} />
      <ApplyUserLabelDrawer currentSystemLabels={[label]} />
    </>
  );
};
