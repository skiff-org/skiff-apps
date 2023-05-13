import { Dropdown, DropdownItem, Icon, IconButton, Icons, Type } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetNumUnreadQuery } from 'skiff-front-graphql';
import { useMediaQuery, useToast, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat, UserLabelVariant } from 'skiff-graphql';
import { POLL_INTERVAL_IN_MS, StorageTypes, upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../../constants/mailbox.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useMarkAsReadUnread } from '../../../hooks/useMarkAsReadUnread';
import { useSyncSelectedThreads } from '../../../hooks/useSyncSelectedThreads';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { HiddenLabels, LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { markAllThreadsAsRead } from '../../../utils/mailboxUtils';
import Checkbox from '../../Checkbox';
import { MoveToLabelDropdown } from '../../labels/MoveToLabelDropdown';

const MailboxToolbar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckboxContainer = styled.span`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  margin-left: -8px;
  margin-right: 8px;
  :hover {
    cursor: pointer;
    background: var(--bg-overlay-tertiary);
  }
`;

export const MailboxActionsDataTest = {
  moveToTrashIcon: 'move-to-trash-icon',
  undoTrashIcon: 'undo-trash-icon'
};

export enum MailboxFilters {
  ALL = 'All',
  READ = 'Read',
  UNREAD = 'Unread',
  ATTACHMENTS = 'Has file'
}

interface MailboxActionsProps {
  // selected threads
  threads: MailboxThreadInfo[];
  // path label
  label: string;
  // Clear the lastSelectedIndex state used for multi-select in mailbox
  clearLastSelectedIndex: () => void;
  // force refetch messages
  onRefresh: () => void | Promise<void>;
}

/**
 * Mailbox Actions
 *
 * Component for rendering actions that modify items in the Mailbox (e.g. delete, move, mark as reads).
 * This component appears in the Mailbox header and can modify mulitple selections at once
 *
 */
export const MailboxActions = ({ threads, label, clearLastSelectedIndex, onRefresh }: MailboxActionsProps) => {
  const { markThreadsAsReadUnread } = useMarkAsReadUnread();

  /** State */
  const [moveToDropdownOpen, setMoveToDropdownOpen] = useState(false);
  const [showSelectAll, setShowSelectAll] = useState(false);
  const [selectFilter, setSelectFilter] = useState<MailboxFilters | null>(null);
  useSyncSelectedThreads(threads, selectFilter);
  const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));

  /** Redux */
  const dispatch = useDispatch();

  const checkboxRef = useRef<HTMLDivElement>(null);

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const { mailboxLabelsDropdownOpen } = useAppSelector((state) => state.hotkeys);

  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`);
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);

  const { activeThreadID } = useThreadActions();

  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const moveToDropdownRef = useRef<HTMLDivElement>(null);

  const { enqueueToast, closeToast } = useToast();

  let containsTrash = false,
    containsArchive = false,
    containsDrafts = false,
    containsSent = false,
    containsInbox = false,
    containsSpam = false,
    allSpam = false;

  const isSearch = label === HiddenLabels.Search;
  if (isSearch) {
    containsTrash = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Trash)
    );
    containsArchive = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Archive)
    );
    containsDrafts = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Drafts)
    );
    containsSent = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Sent)
    );
    containsInbox = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Inbox)
    );
    containsSpam = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Spam)
    );
    allSpam = selectedThreadIDs.every((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Spam)
    );
  }
  const isDrafts = label === SystemLabels.Drafts || containsDrafts;
  const isDraftsOrSent = isDrafts || label === SystemLabels.Sent || containsSent;
  const isTrash = label === SystemLabels.Trash || containsTrash;
  const isArchive = label === SystemLabels.Archive || containsArchive;
  const isInbox = label === SystemLabels.Inbox || containsInbox;
  const isSpam = label === SystemLabels.Spam || containsSpam;
  const isSent = label === SystemLabels.Sent;

  const fullScreenThreadOpen = (isCompact ?? threadFormat === ThreadDisplayFormat.Full) && !!activeThreadID;

  const printedLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  const { data } = useGetNumUnreadQuery({
    variables: { label: label },
    skip: label === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const totalNumUnread = data?.unread ?? 0;

  const someThreadsAreSelected = selectedThreadIDs.length > 0;
  const allThreadsAreSelected = selectedThreadIDs.length === threads.length;
  const someSelectedAreUnread = selectedThreadIDs.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );
  const numSelectedUnread = threads.filter((t) => selectedThreadIDs.includes(t.threadID) && !t.attributes.read).length;

  const selectedThreads = threads.filter((thread) => selectedThreadIDs.includes(thread.threadID));
  const { moveThreads, archiveThreads, trashThreads, deleteThreads, downloadThreads } = useThreadActions();

  const markSelectionAsReadUnread = () => {
    markThreadsAsReadUnread(selectedThreads, someSelectedAreUnread);
    if (someSelectedAreUnread && numSelectedUnread > 1 && totalNumUnread > numSelectedUnread) {
      enqueueToast({
        title: `${numSelectedUnread} conversations marked as read`,
        body: `Mark the remaining ${
          totalNumUnread - numSelectedUnread
        } unread conversations in ${printedLabel} as read?`,
        actions: [
          { label: 'Dismiss', onClick: (key) => closeToast(key) },
          {
            label: 'Mark all as read',
            onClick: (key) => {
              void markAllThreadsAsRead(true, label);
              closeToast(key);
            }
          }
        ]
      });
    }
  };

  return (
    <MailboxToolbar>
      {!fullScreenThreadOpen && (
        <>
          <CheckboxContainer
            onClick={() => {
              setShowSelectAll(true);
            }}
            ref={checkboxRef}
          >
            <Checkbox
              checked={someThreadsAreSelected}
              indeterminate={someThreadsAreSelected && !allThreadsAreSelected}
              onClick={(e) => {
                e.stopPropagation();
                if (someThreadsAreSelected) {
                  setSelectFilter(null);
                  setSelectedThreadIDs([]);
                } else {
                  setSelectFilter(MailboxFilters.ALL);
                }
                clearLastSelectedIndex();
              }}
            />
            <Icons color='disabled' icon={Icon.ChevronDown} />
          </CheckboxContainer>
          <Dropdown buttonRef={checkboxRef} portal setShowDropdown={setShowSelectAll} showDropdown={showSelectAll}>
            {(Object.values(MailboxFilters) as Array<MailboxFilters>).map((filter) => {
              return (
                <DropdownItem
                  active={!!filter && filter === selectFilter}
                  key={filter}
                  label={upperCaseFirstLetter(filter)}
                  onClick={() => {
                    setSelectFilter(filter);
                    setShowSelectAll(false);
                  }}
                  value={filter}
                />
              );
            })}
            <DropdownItem
              active={!selectFilter && selectedThreadIDs.length === 0}
              label='None'
              onClick={() => {
                setSelectFilter(null);
                setShowSelectAll(false);
                setSelectedThreadIDs([]);
              }}
              value='None'
            />
          </Dropdown>
        </>
      )}
      {(someThreadsAreSelected || fullScreenThreadOpen) && (
        <Toolbar key='toolbar'>
          {!isDrafts && (
            <>
              <IconButton
                icon={someSelectedAreUnread ? Icon.EnvelopeRead : Icon.EnvelopeUnread}
                onClick={markSelectionAsReadUnread}
                tooltip={someSelectedAreUnread ? 'Mark as read' : 'Mark as unread'}
                type={Type.SECONDARY}
              />
              <div>
                <IconButton
                  icon={Icon.Tag}
                  onClick={() => {
                    dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen());
                  }}
                  ref={labelDropdownRef}
                  tooltip={{ title: 'Labels', shortcut: 'L' }}
                  type={Type.SECONDARY}
                />
                <MoveToLabelDropdown
                  buttonRef={labelDropdownRef}
                  currentSystemLabels={[label]}
                  onClose={() => {
                    dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen(false));
                    clearLastSelectedIndex();
                  }}
                  open={mailboxLabelsDropdownOpen}
                />
              </div>
              <div>
                <IconButton
                  icon={Icon.FolderArrow}
                  onClick={() => setMoveToDropdownOpen(true)}
                  ref={moveToDropdownRef}
                  tooltip='Move to'
                  type={Type.SECONDARY}
                />
                <MoveToLabelDropdown
                  buttonRef={moveToDropdownRef}
                  currentSystemLabels={[label]}
                  onClose={() => {
                    setMoveToDropdownOpen(false);
                    clearLastSelectedIndex();
                  }}
                  open={moveToDropdownOpen}
                  variant={UserLabelVariant.Folder}
                />
              </div>
              {label === SystemLabels.Trash && (
                <IconButton
                  icon={Icon.Trash}
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteThreads(selectedThreadIDs);
                    clearLastSelectedIndex();
                  }}
                  tooltip='Permanently delete'
                  type={Type.SECONDARY}
                />
              )}
              {!isSpam && (
                <IconButton
                  icon={Icon.Spam}
                  onClick={() => {
                    void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
                    clearLastSelectedIndex();
                  }}
                  tooltip='Report spam'
                  type={Type.SECONDARY}
                />
              )}
              {!isSent && (
                <IconButton
                  icon={Icon.Download}
                  onClick={() => {
                    void downloadThreads(selectedThreadIDs, threads);
                    clearLastSelectedIndex();
                  }}
                  tooltip='Export'
                  type={Type.SECONDARY}
                />
              )}
              {allSpam && (
                <IconButton
                  icon={Icon.MoveMailbox}
                  onClick={() => {
                    void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
                    clearLastSelectedIndex();
                  }}
                  tooltip='Not spam'
                  type={Type.SECONDARY}
                />
              )}
            </>
          )}
          {!isTrash && !isArchive && !isDraftsOrSent && (
            <IconButton
              icon={Icon.Archive}
              onClick={(e) => {
                e.stopPropagation();
                void archiveThreads(selectedThreadIDs).then(() => {
                  void onRefresh();
                });
                clearLastSelectedIndex();
              }}
              tooltip={{ title: 'Archive', shortcut: 'E' }}
              type={Type.SECONDARY}
            />
          )}
          {!isTrash && (
            <IconButton
              dataTest={MailboxActionsDataTest.moveToTrashIcon}
              icon={Icon.Trash}
              onClick={(e) => {
                e.stopPropagation();
                void trashThreads(selectedThreadIDs, isDrafts).then(() => {
                  void onRefresh();
                });
                clearLastSelectedIndex();
              }}
              tooltip={{ title: 'Trash', shortcut: '#' }}
              type={Type.SECONDARY}
            />
          )}
          {(isTrash || isArchive) && !isInbox && (
            <IconButton
              dataTest={MailboxActionsDataTest.undoTrashIcon}
              icon={Icon.MoveMailbox}
              onClick={(e) => {
                e.stopPropagation();
                void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
                clearLastSelectedIndex();
              }}
              tooltip={{ title: 'Move to inbox', shortcut: 'Z' }}
              type={Type.SECONDARY}
            />
          )}
        </Toolbar>
      )}
    </MailboxToolbar>
  );
};
