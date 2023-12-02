import { Dropdown, DropdownItem, Icon, Icons, IconText, Typography, TypographySize } from 'nightwatch-ui';
import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGetNumMailboxThreadsQuery } from 'skiff-front-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useIsFullScreenThreadOpen } from '../../../hooks/useIsFullScreenThreadOpen';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { BulkAction, MailboxActionInfo, MailboxMultiSelectFilter } from '../../../utils/mailboxActionUtils';
import Checkbox from '../../Checkbox';
import BulkActionConfirmModal from '../../modals/BulkActionConfirmModal/BulkActionConfirmModal';

import { useMailboxActions } from './useMailboxActions';

const MailboxToolbar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 16px;
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
const Separator = styled.div`
  width: 1.5px;
  height: 16px;
  background: var(--border-secondary);
`;

export const MailboxActionsDataTest = {
  moveToTrashIcon: 'move-to-trash-icon',
  undoTrashIcon: 'undo-trash-icon'
};

interface MailboxActionsProps {
  // selected threads
  threads: MailboxThreadInfo[];
  // path label
  label: string;
  // clear the lastSelectedIndex state used for multi-select in mailbox
  clearLastSelectedIndex: () => void;
  // force refetch messages
  onRefresh: () => Promise<void>;
}

/**
 * Mailbox Actions
 *
 * Component for rendering actions that modify items in the Mailbox (e.g. delete, move, mark as reads).
 * This component appears in the Mailbox header and can modify mulitple selections at once
 *
 */
export const MailboxActions = ({ threads, label, clearLastSelectedIndex, onRefresh }: MailboxActionsProps) => {
  /** State */
  const [showSelectAll, setShowSelectAll] = useState(false);
  const selectFilter = useAppSelector((state) => state.mailbox.multiSelectFilter);
  const inProgressBulkAction = useAppSelector((state) => state.mailbox.inProgressBulkAction);

  const isFullScreenThreadOpen = useIsFullScreenThreadOpen();

  const { data: numThreadsUnderLabelData } = useGetNumMailboxThreadsQuery({
    variables: {
      label
    }
  });

  const numThreadsUnderLabel = numThreadsUnderLabelData?.numMailboxThreads ?? 0;

  /** Redux */
  const dispatch = useDispatch();
  const setPendingMailboxAction = useCallback(
    (mailboxActionInfo: MailboxActionInfo | undefined) => {
      dispatch(skemailMailboxReducer.actions.setPendingMailboxAction(mailboxActionInfo));
    },
    [dispatch]
  );
  const setSelectFilter = useCallback(
    (newFilter: MailboxMultiSelectFilter | undefined) => {
      dispatch(skemailMailboxReducer.actions.setMultiSelectFilter(newFilter));
    },
    [dispatch]
  );

  const setSelectedThreadIDs = useCallback(
    (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs })),
    [dispatch]
  );

  const checkboxRef = useRef<HTMLDivElement>(null);

  const pendingMailboxAction = useAppSelector((state) => state.mailbox.pendingMailboxAction);
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const someThreadsAreSelected = selectedThreadIDs.length > 0;

  const clearAndCloseBulkConfirmModal = useCallback(() => {
    setPendingMailboxAction(undefined);
  }, [setPendingMailboxAction]);

  const {
    mailboxActions,
    mailboxActionOnSuccess,
    handleApplyUserLabel,
    handleMoveToInbox,
    handleMoveToUserFolder,
    handleRemoveUserLabel,
    handleArchiveThreads,
    handlePermDeleteThreads,
    handleTrashThreads,
    handleToggleRead
  } = useMailboxActions({
    threads,
    label,
    clearLastSelectedIndex,
    onRefresh,
    withID: true
  });

  const allRenderedThreadsAreSelected = selectedThreadIDs.length === threads.length;

  const getThreadActionHandler = (bulk?: boolean) => {
    if (!pendingMailboxAction) return;
    switch (pendingMailboxAction.type) {
      case BulkAction.TRASH:
        return () => handleTrashThreads(bulk);
      case BulkAction.ARCHIVE:
        return () => handleArchiveThreads(bulk);
      case BulkAction.TOGGLE_READ:
        return () => handleToggleRead(bulk);
      case BulkAction.APPLY_LABEL:
        return () => handleApplyUserLabel(pendingMailboxAction.labeToApplyOrRemove, bulk);
      case BulkAction.REMOVE_LABEL:
        return () => handleRemoveUserLabel(pendingMailboxAction.labeToApplyOrRemove, bulk);
      case BulkAction.MOVE_FOLDER:
        return () => handleMoveToUserFolder(pendingMailboxAction.destinationFolder, bulk);
      case BulkAction.MOVE_TO_INBOX:
        return () => handleMoveToInbox(bulk);
      case BulkAction.PERMANENTLY_DELETE:
        return () => handlePermDeleteThreads(bulk);
    }
  };

  // soft-close modal (preserve pending action until action completion to control loading state)
  // and refresh select state after choice is made; bulk action progress will be shown in mailbox header
  const onChooseBulkActionOrSelectedThreads = () => {
    setSelectFilter(undefined);
    setSelectedThreadIDs([]);
    clearLastSelectedIndex();
    dispatch(skemailMailboxReducer.actions.removeSelectedThreadID(selectedThreadIDs));
  };

  const bulkThreadAction = getThreadActionHandler(true);
  const selectedThreadAction = getThreadActionHandler();

  return (
    <MailboxToolbar>
      {!isFullScreenThreadOpen && (
        <>
          <CheckboxContainer
            onClick={() => {
              setShowSelectAll(true);
            }}
            ref={checkboxRef}
          >
            <Checkbox
              checked={someThreadsAreSelected}
              indeterminate={someThreadsAreSelected && !allRenderedThreadsAreSelected}
              onClick={(e) => {
                e.stopPropagation();
                if (someThreadsAreSelected) {
                  setSelectFilter(undefined);
                  setSelectedThreadIDs([]);
                } else {
                  setSelectFilter(MailboxMultiSelectFilter.ALL);
                }
                clearLastSelectedIndex();
              }}
            />
            <Icons color='disabled' icon={showSelectAll ? Icon.ChevronUp : Icon.ChevronDown} />
          </CheckboxContainer>
          <Dropdown buttonRef={checkboxRef} portal setShowDropdown={setShowSelectAll} showDropdown={showSelectAll}>
            {(Object.values(MailboxMultiSelectFilter) as Array<MailboxMultiSelectFilter>).map((filter) => {
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
                setSelectFilter(undefined);
                setShowSelectAll(false);
                setSelectedThreadIDs([]);
              }}
              value='None'
            />
          </Dropdown>
          {someThreadsAreSelected && (
            <Toolbar>
              {mailboxActions.map((action) => (
                <IconText {...action} color='secondary' key={action.key} label={undefined} startIcon={action.icon} />
              ))}
              <Separator />
              <Typography color='disabled' mono size={TypographySize.SMALL} uppercase>
                {`${selectedThreadIDs.length} selected`}
              </Typography>
            </Toolbar>
          )}
        </>
      )}
      <BulkActionConfirmModal
        bulkThreadAction={bulkThreadAction}
        mailboxActionInfo={pendingMailboxAction ?? undefined}
        numBulkThreads={numThreadsUnderLabel}
        numSelectedThreads={selectedThreadIDs.length}
        onCancel={clearAndCloseBulkConfirmModal}
        onChoose={onChooseBulkActionOrSelectedThreads}
        onSuccess={mailboxActionOnSuccess}
        open={!inProgressBulkAction && !!pendingMailboxAction && !!bulkThreadAction && !!selectedThreadAction}
        selectedThreadAction={selectedThreadAction}
      />
    </MailboxToolbar>
  );
};
