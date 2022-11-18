import useMediaQuery from '@mui/material/useMediaQuery';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { Dropdown, DropdownItem, Icon, IconButton, IconText } from 'nightwatch-ui';
import React, { useCallback, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { useGetNumUnreadQuery } from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../../constants/mailbox.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import useLocalSetting, { ThreadDisplayFormat } from '../../../hooks/useLocalSetting';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { handleMarkAsReadUnreadClick, markAllThreadsAsRead } from '../../../utils/mailboxUtils';
import Checkbox from '../../Checkbox';
import { LabelDropdown } from '../../labels/LabelDropdown';

const MailboxToolbar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
`;

const FilterButton = styled(motion.div)`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 8px;
  border-radius: 24px;
  &:hover {
    cursor: pointer;
    background-color: var(--bg-cell-hover);
  }
`;

const Toolbar = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckboxContainer = styled(motion.span)`
  margin-right: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
`;

// const TransitionContainer = styled.span`
//   margin-right: 24px;
//   display: flex;
//   gap: 16px;
//   align-items: center;
// `;

export const MailboxActionsDataTest = {
  moveToTrashIcon: 'move-to-trash-icon',
  undoTrashIcon: 'undo-trash-icon'
};

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

export enum MailboxFilters {
  ALL = 'All',
  READ = 'Read',
  UNREAD = 'Unread',
  ATTACHMENTS = 'Has file'
}

const RELOAD_ROTATION = 720;
const RELOAD_ANIMATION_S = 1;
/**
 * Mailbox Actions
 *
 * Component for rendering actions that modify items in the Mailbox (e.g. delete, move, mark as reads).
 * This component appears in the Mailbox header and can modify mulitple selections at once
 *
 */
export const MailboxActions = ({ threads, label, clearLastSelectedIndex, onRefresh }: MailboxActionsProps) => {
  /** State */
  const [rotation, setRotation] = useState(RELOAD_ROTATION);
  const [showFilterSelect, setShowFilterSelect] = useState(false);
  const [moveToDropdownOpen, setMoveToDropdownOpen] = useState(false);

  /** Redux */
  const dispatch = useDispatch();

  const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const { mailboxLabelsDropdownOpen } = useAppSelector((state) => state.hotkeys);

  // Derive current active filter based on redux filters state
  const { filters } = useAppSelector((state) => state.mailbox);

  let activeFilter = MailboxFilters.ALL;
  if (filters.read === true) activeFilter = MailboxFilters.READ;
  if (filters.read === false) activeFilter = MailboxFilters.UNREAD;
  if (filters.attachments === true) activeFilter = MailboxFilters.ATTACHMENTS;

  /** Other hooks */
  const controls = useAnimation();
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`);

  const [threadFormat] = useLocalSetting('threadFormat');

  const { activeThreadID } = useThreadActions();

  /** Refs */
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const moveToDropdownRef = useRef<HTMLDivElement>(null);

  const isDrafts = label === SystemLabels.Drafts;
  const isDraftsOrSent = isDrafts || label === SystemLabels.Sent;

  const fullScreenThreadOpen = (isCompact ?? threadFormat === ThreadDisplayFormat.Full) && !!activeThreadID;

  const printedLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  const { data } = useGetNumUnreadQuery({
    variables: { label: label },
    skip: label === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const totalNumUnread = data?.unread ?? 0;
  const { enqueueToast, closeToast } = useToast();

  const someThreadsAreSelected = selectedThreadIDs.length > 0;
  const allThreadsAreSelected = selectedThreadIDs.length === threads.length;
  const someSelectedAreUnread = selectedThreadIDs.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );

  const isTrash = label === SystemLabels.Trash;
  const isArchive = label === SystemLabels.Archive;

  const selectedThreads = threads.filter((thread) => selectedThreadIDs.includes(thread.threadID));

  const markAllReadClick = async () => {
    await markAllThreadsAsRead(true, label);
  };

  const markAsReadUnreadClick = useCallback(async () => {
    await handleMarkAsReadUnreadClick(selectedThreads, someSelectedAreUnread);
    if (someSelectedAreUnread && allThreadsAreSelected && selectedThreads.length < totalNumUnread) {
      enqueueToast({
        icon: Icon.Envelope,
        body: `${selectedThreadIDs.length} conversations marked as read. Mark all ${totalNumUnread} conversations in ${printedLabel} as read?`,
        position: {
          vertical: 'bottom',
          horizontal: 'left'
        },
        actions: [
          { label: 'Dismiss', onClick: (key) => closeToast(key) },
          {
            label: 'Mark all as read',
            onClick: (key) => {
              void markAllReadClick();
              closeToast(key);
            }
          }
        ]
      });
    }
  }, [someSelectedAreUnread, selectedThreads, totalNumUnread]);

  const { moveThreads, archiveThreads, trashThreads, deleteThreads } = useThreadActions();
  return (
    <MailboxToolbar>
      <AnimatePresence>
        {!fullScreenThreadOpen && (
          <CheckboxContainer
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key='checkbox-container'
          >
            <Checkbox
              checked={someThreadsAreSelected}
              indeterminate={someThreadsAreSelected && !allThreadsAreSelected}
              onClick={() => {
                if (someThreadsAreSelected) {
                  setSelectedThreadIDs([]);
                } else {
                  setSelectedThreadIDs(threads.map((t) => t.threadID));
                }
                clearLastSelectedIndex();
              }}
            />
            {!isMobile && (
              <motion.div
                animate={controls}
                initial={false}
                key='refresh'
                transition={{
                  duration: RELOAD_ANIMATION_S,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.5, 0.8, 1]
                }}
              >
                <IconButton
                  color='secondary'
                  icon={Icon.Reload}
                  onClick={() => {
                    void onRefresh();
                    void controls.start({ rotate: rotation });
                    setRotation((prev) => prev + 720);
                  }}
                  tooltip={{ title: 'Refresh', shortcut: '⌘+R' }}
                />
              </motion.div>
            )}
          </CheckboxContainer>
        )}
        {someThreadsAreSelected || fullScreenThreadOpen ? (
          <Toolbar key='animated-toolbar'>
            {!isDrafts && (
              <>
                <IconButton
                  color='secondary'
                  icon={someSelectedAreUnread ? Icon.EnvelopeRead : Icon.EnvelopeUnread}
                  onClick={() => void markAsReadUnreadClick()}
                  tooltip={someSelectedAreUnread ? 'Mark as read' : 'Mark as unread'}
                />
                <div>
                  <IconButton
                    color='secondary'
                    hideTooltip={mailboxLabelsDropdownOpen}
                    icon={Icon.Tag}
                    onClick={() => dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen())}
                    ref={labelDropdownRef}
                    tooltip={{ title: 'Labels', shortcut: 'L' }}
                  />
                  <LabelDropdown
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
                    color='secondary'
                    hideTooltip={moveToDropdownOpen}
                    icon={Icon.FolderArrow}
                    onClick={() => setMoveToDropdownOpen(true)}
                    ref={moveToDropdownRef}
                    tooltip='Move to'
                  />
                  <LabelDropdown
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
                    color='secondary'
                    icon={Icon.Trash}
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteThreads(selectedThreadIDs);
                      clearLastSelectedIndex();
                    }}
                    tooltip='Permanently delete'
                  />
                )}
                {label !== SystemLabels.Spam && (
                  <IconButton
                    color='secondary'
                    icon={Icon.Spam}
                    onClick={() => {
                      void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
                      clearLastSelectedIndex();
                    }}
                    tooltip='Report spam'
                  />
                )}
                {label === SystemLabels.Spam && (
                  <IconButton
                    color='secondary'
                    icon={Icon.MoveMailbox}
                    onClick={() => {
                      void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
                      clearLastSelectedIndex();
                    }}
                    tooltip='Not spam'
                  />
                )}
              </>
            )}
            {!isTrash && !isArchive && !isDraftsOrSent && (
              <IconButton
                color='secondary'
                icon={Icon.Archive}
                onClick={(e) => {
                  e.stopPropagation();
                  void archiveThreads(selectedThreadIDs).then(() => {
                    void onRefresh();
                  });
                  clearLastSelectedIndex();
                }}
                tooltip={{ title: 'Archive', shortcut: 'E' }}
              />
            )}
            {!isTrash && !isArchive && (
              <IconButton
                color='secondary'
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
              />
            )}
            {(isTrash || isArchive) && (
              <IconButton
                color='secondary'
                dataTest={MailboxActionsDataTest.undoTrashIcon}
                icon={Icon.MoveMailbox}
                onClick={(e) => {
                  e.stopPropagation();
                  void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
                  clearLastSelectedIndex();
                }}
                tooltip={{ title: 'Move to inbox', shortcut: 'Z' }}
              />
            )}
          </Toolbar>
        ) : (
          <>
            {!isDrafts && (
              <FilterButton
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                key='animated-filter-button'
                onClick={() => setShowFilterSelect((prev) => !prev)}
                ref={filterButtonRef}
                transition={{ delay: 0.3, duration: 0.1 }}
              >
                <IconText
                  color='secondary'
                  endIcon={Icon.ChevronDown}
                  label={activeFilter}
                  level={2}
                  startIcon={Icon.Filter}
                  type='paragraph'
                />
              </FilterButton>
            )}
            {showFilterSelect && (
              <Dropdown buttonRef={filterButtonRef} portal setShowDropdown={setShowFilterSelect}>
                <DropdownItem
                  key='all-dropdown-filter'
                  label={MailboxFilters.ALL}
                  onClick={() => {
                    dispatch(skemailMailboxReducer.actions.setFilters({ filters: {} }));
                    setShowFilterSelect(false);
                  }}
                  value={MailboxFilters.ALL}
                />
                <DropdownItem
                  key='unread-dropdown-filter'
                  label={MailboxFilters.READ}
                  onClick={() => {
                    dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: true } }));
                    setShowFilterSelect(false);
                  }}
                  value={MailboxFilters.READ}
                />
                <DropdownItem
                  key='read-dropdown-filter'
                  label={MailboxFilters.UNREAD}
                  onClick={() => {
                    dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: false } }));
                    setShowFilterSelect(false);
                  }}
                  value={MailboxFilters.UNREAD}
                />
                <DropdownItem
                  key='attachments-filter'
                  label={MailboxFilters.ATTACHMENTS}
                  onClick={() => {
                    dispatch(skemailMailboxReducer.actions.setFilters({ filters: { attachments: true } }));
                    setShowFilterSelect(false);
                  }}
                  value={MailboxFilters.ATTACHMENTS}
                />
              </Dropdown>
            )}
          </>
        )}
      </AnimatePresence>
    </MailboxToolbar>
  );
};
