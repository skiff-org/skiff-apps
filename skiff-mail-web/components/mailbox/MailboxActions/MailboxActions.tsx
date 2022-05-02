import { Dropdown, DropdownItem, Icon, IconButton, IconText } from '@skiff-org/skiff-ui';
import { useCallback, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { SystemLabels } from '../../../generated/graphql';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { handleMarkAsReadUnreadClick } from '../../../utils/mailboxUtils';
import Checkbox from '../../Checkbox';
import { LabelDropdown } from '../../labels/LabelDropdown';

const MailboxToolbar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
`;

const FilterButton = styled.div`
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

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckboxContainer = styled.span`
  margin-right: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
`;

enum MailboxView {
  ALL,
  UNREAD,
  READ
}

const viewToText = {
  [MailboxView.ALL]: 'All',
  [MailboxView.UNREAD]: 'Unread',
  [MailboxView.READ]: 'Read'
};

export const MailboxActionsDataTest = {
  moveToTrashIcon: 'move-to-trash-icon',
  moveToInboxIcon: 'move-to-inbox-icon'
};

interface MailboxActionsProps {
  // selected threads
  threads: MailboxThreadInfo[];
  // filtered Mailbox view
  view: MailboxView;
  // path label
  label: string;
  // updates filtered Mailbox view
  setView: (view: MailboxView) => void;
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
export const MailboxActions = ({
  threads,
  view,
  label,
  setView,
  clearLastSelectedIndex,
  onRefresh
}: MailboxActionsProps) => {
  const dispatch = useDispatch();
  const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const [showFilterSelect, setShowFilterSelect] = useState(false);
  const [labelDropdown, setLabelDropdown] = useState(false); // control dropdown state for labels (user labels)

  const filterButtonRef = useRef<HTMLDivElement>(null);
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const isDrafts = label === SystemLabels.Drafts;

  const someThreadsAreSelected = selectedThreadIDs.length > 0;
  const allThreadsAreSelected = selectedThreadIDs.length === threads.length;
  const someSelectedAreUnread = selectedThreadIDs.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );

  const selectedThreads = threads.filter((thread) => selectedThreadIDs.includes(thread.threadID));

  const markAsReadUnreadClick = useCallback(async () => {
    await handleMarkAsReadUnreadClick(selectedThreads, someSelectedAreUnread);
  }, [someSelectedAreUnread, selectedThreads]);

  const { moveThreads, trashThreads } = useThreadActions();

  return (
    <MailboxToolbar>
      <CheckboxContainer>
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
          <IconButton
            color={someThreadsAreSelected ? 'primary' : 'secondary'}
            icon={Icon.Reload}
            onClick={onRefresh}
            tooltip='Refresh'
          />
        )}
      </CheckboxContainer>
      {someThreadsAreSelected ? (
        <Toolbar>
          {!isDrafts && (
            <>
              <IconButton
                icon={someSelectedAreUnread ? Icon.EnvelopeRead : Icon.EnvelopeUnread}
                onClick={markAsReadUnreadClick}
                size='large'
                tooltip={someSelectedAreUnread ? 'Mark as read' : 'Mark as unread'}
              />
              <div>
                <IconButton
                  icon={Icon.Tag}
                  onClick={() => setLabelDropdown((prev) => !prev)}
                  ref={labelDropdownRef}
                  size='large'
                  tooltip='Labels'
                />
                <LabelDropdown
                  buttonRef={labelDropdownRef}
                  onClose={() => {
                    setLabelDropdown(false);
                    clearLastSelectedIndex();
                  }}
                  open={labelDropdown}
                />
              </div>
              {label !== SystemLabels.Spam && (
                <IconButton
                  icon={Icon.Spam}
                  onClick={() => {
                    void moveThreads(
                      selectedThreadIDs,
                      LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam],
                      isDrafts,
                      label === SystemLabels.Trash
                    );
                    clearLastSelectedIndex();
                  }}
                  size='large'
                  tooltip='Report spam'
                />
              )}
              {label === SystemLabels.Spam && (
                <IconButton
                  icon={Icon.NotSpam}
                  onClick={() => {
                    void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], isDrafts, false);
                    clearLastSelectedIndex();
                  }}
                  size='large'
                  tooltip='Not spam'
                />
              )}
            </>
          )}
          {label !== SystemLabels.Trash && (
            <IconButton
              dataTest={MailboxActionsDataTest.moveToTrashIcon}
              icon={Icon.Trash}
              onClick={(e) => {
                e.stopPropagation();
                void trashThreads(selectedThreadIDs, isDrafts);
                clearLastSelectedIndex();
              }}
              size='large'
              tooltip='Move to trash'
            />
          )}
          {label === SystemLabels.Trash && (
            <IconButton
              dataTest={MailboxActionsDataTest.moveToInboxIcon}
              icon={Icon.Inbox}
              onClick={(e) => {
                e.stopPropagation();
                void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], isDrafts, true);
                clearLastSelectedIndex();
              }}
              size='large'
              tooltip='Move to inbox'
            />
          )}
        </Toolbar>
      ) : (
        <>
          {!isDrafts && (
            <FilterButton onClick={() => setShowFilterSelect(true)} ref={filterButtonRef}>
              <IconText label={viewToText[view]} startIcon={Icon.Filter} type='paragraph' />
            </FilterButton>
          )}
          {showFilterSelect && (
            <Dropdown buttonRef={filterButtonRef} portal setShowDropdown={setShowFilterSelect}>
              {Object.keys(viewToText).map((viewKey) => (
                <DropdownItem
                  key={viewToText[viewKey]}
                  label={viewToText[viewKey]}
                  onClick={() => {
                    setView(Number(viewKey) as MailboxView);
                    setShowFilterSelect(false);
                  }}
                  value={viewToText[viewKey]}
                />
              ))}
            </Dropdown>
          )}
        </>
      )}
    </MailboxToolbar>
  );
};
