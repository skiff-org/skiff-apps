import { Icon } from 'nightwatch-ui';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels } from 'skiff-graphql';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { handleMarkAsReadUnreadClick } from '../../../utils/mailboxUtils';
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
  const dispatch = useDispatch();
  const { archiveThreads, moveThreads, trashThreads, deleteThreads } = useThreadActions();
  const selectedThreadsIds = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const { value: label } = useRouterLabelContext();
  const isTrash = label === SystemLabels.Trash;
  const isArchive = label === SystemLabels.Archive;
  const isDrafts = label === SystemLabels.Drafts;

  const someSelectedAreUnread = selectedThreadsIds.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );
  const selectedThreads = threads.filter((thread) => selectedThreadsIds.includes(thread.threadID));

  const closeMultiSelectMenu = () => {
    // Set mult item selector to false and clear selected threads
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false));
  };

  const markAsReadUnreadClick = useCallback(async () => {
    await handleMarkAsReadUnreadClick(selectedThreads, someSelectedAreUnread);
    if (selectedThreads.length === threads.length) {
      closeMultiSelectMenu();
    }
  }, [someSelectedAreUnread, selectedThreads]);

  const onMoreOptionsClick = () => dispatch(skemailMobileDrawerReducer.actions.setShowMailboxMoreOptionsDrawer(true));

  const nonSelected = selectedThreads.length === 0;
  return (
    <>
      {!isTrash && !isArchive && (
        <>
          <ToolbarButton
            disabled={nonSelected}
            icon={Icon.Archive}
            onClick={(e) => {
              e.stopPropagation();
              void archiveThreads(selectedThreadsIds);
              closeMultiSelectMenu();
            }}
          />
          <ToolbarButton
            disabled={nonSelected}
            icon={Icon.Trash}
            onClick={(e) => {
              e.stopPropagation();
              void trashThreads(selectedThreadsIds, isDrafts);
              closeMultiSelectMenu();
            }}
          />
        </>
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
        onClick={() => void markAsReadUnreadClick()}
      />
      <ToolbarButton disabled={nonSelected} icon={Icon.OverflowH} onClick={onMoreOptionsClick} />
      <MailboxMoreOptionsDrawer label={label} selectedThreadsIds={selectedThreadsIds} />
      <ApplyUserLabelDrawer currentSystemLabels={[label]} />
    </>
  );
};
