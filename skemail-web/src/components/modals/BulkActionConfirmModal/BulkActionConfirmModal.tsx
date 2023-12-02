import {
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { ThreadActionResponse } from '../../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import {
  BulkAction,
  MailboxActionInfo,
  getAction,
  getActionTarget,
  getCurrentMailboxName,
  getSuccessMessage
} from '../../../utils/mailboxActionUtils';

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const HighlightText = styled.span`
  color: var(--text-link);
`;

const CustomHeaderAndDescription = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
  width: 100%;
  padding-bottom: 12px;
`;

interface BulkActionConfirmModalProps {
  numSelectedThreads: number;
  numBulkThreads: number;
  onCancel: () => void;
  // success handler for actions
  // that can be completed synchronously
  onSuccess: (successMessage: string) => void;
  onChoose: () => void;
  open: boolean;
  mailboxActionInfo?: MailboxActionInfo;
  bulkThreadAction?: () => Promise<ThreadActionResponse>;
  selectedThreadAction?: () => Promise<ThreadActionResponse>;
}

const BulkActionConfirmModal = ({
  mailboxActionInfo,
  numSelectedThreads,
  numBulkThreads,
  open,
  onCancel,
  onSuccess,
  onChoose,
  bulkThreadAction,
  selectedThreadAction
}: BulkActionConfirmModalProps) => {
  // state
  const [selectedThreadActionInProgress, setSelectedThreadActionInProgress] = useState(false);
  const [bulkThreadActionInProgress, setBulkThreadActionInProgress] = useState(false);
  const actionInProgress = selectedThreadActionInProgress || bulkThreadActionInProgress;

  // hooks
  const label = useRouterLabelContext();
  const { enqueueToast } = useToast();
  const dispatch = useDispatch();

  const isRemovingLabel = mailboxActionInfo?.type === BulkAction.REMOVE_LABEL;
  const isPermDeletingTrash = mailboxActionInfo?.type === BulkAction.PERMANENTLY_DELETE;
  const isToggleRead = mailboxActionInfo?.type === BulkAction.TOGGLE_READ;

  // copy
  const action = !!mailboxActionInfo ? getAction(mailboxActionInfo.type) : '';
  const pastTenseAction = !!mailboxActionInfo ? getAction(mailboxActionInfo.type, true) : '';
  const actionTarget = !!mailboxActionInfo ? getActionTarget(mailboxActionInfo) : '';

  const getTitleCopy = () => {
    if (!label) {
      return '';
    }
    return `${isPermDeletingTrash ? `Permanently ${action}` : upperCaseFirstLetter(action)}${
      isRemovingLabel ? ` '${mailboxActionInfo.labeToApplyOrRemove.name}' label from` : ''
    } all emails in ${getCurrentMailboxName(label)}${actionTarget}?`;
  };

  const getDescription = () =>
    // leading space because it will be prepended with the number of affected threads
    ` ${pluralize('email', numBulkThreads)} will ${isRemovingLabel ? 'have labels' : 'be'} ${pastTenseAction}${
      isPermDeletingTrash ? ' forever' : ''
    }${isToggleRead ? ` as ${mailboxActionInfo.resultingReadState ? 'read' : 'unread'}` : ''}.`;

  const finishThreadAction = (completed: boolean, mailboxAction: BulkAction, bulk?: boolean) => {
    if (completed) {
      onSuccess(getSuccessMessage(mailboxAction, bulk));
    } else {
      enqueueToast({
        title: `Failed to ${action} ${isRemovingLabel ? 'labels' : 'emails'}`,
        body: 'Please refresh and try again.'
      });
    }
  };

  const handleBulkThreadAction = async () => {
    if (!bulkThreadAction || !mailboxActionInfo) return;
    setBulkThreadActionInProgress(true);
    const { bulkJobID, completed } = await bulkThreadAction();
    if (bulkJobID && !completed && !(mailboxActionInfo.type === BulkAction.TOGGLE_READ)) {
      // feedback on completion will be shown in mailbox header
      dispatch(skemailMailboxReducer.actions.setInProgressBulkAction({ bulkJobID, bulkAction: mailboxActionInfo }));
    } else {
      // we're done; either bulk action is complete or we were
      // expecting a jobID and didn't get one
      finishThreadAction(completed, mailboxActionInfo.type, true);
    }
    onChoose();
    setBulkThreadActionInProgress(false);
  };

  const handleSelectedThreadAction = async () => {
    if (!selectedThreadAction || !mailboxActionInfo) return;
    setSelectedThreadActionInProgress(true);
    // feedback on completion for selectedThreadAction is immediate
    const { completed } = await selectedThreadAction();
    finishThreadAction(completed, mailboxActionInfo.type);
    onChoose();
    setSelectedThreadActionInProgress(false);
  };

  const showSelectedThreadOption = numSelectedThreads > 0;

  return (
    <Dialog customContent hideCloseButton onClose={onCancel} open={open}>
      <CustomHeaderAndDescription>
        <Typography maxWidth='100%' size={TypographySize.H4} weight={TypographyWeight.MEDIUM} wrap>
          {getTitleCopy()}
        </Typography>
        <Typography color='secondary'>
          <HighlightText>{numBulkThreads.toLocaleString()}</HighlightText>
          {getDescription()}
        </Typography>
      </CustomHeaderAndDescription>
      <ButtonRow>
        {showSelectedThreadOption && (
          <Button disabled={actionInProgress} onClick={onCancel} type={Type.SECONDARY}>
            Cancel
          </Button>
        )}
        <ButtonGroup>
          <ButtonGroupItem
            disabled={actionInProgress}
            label={`${upperCaseFirstLetter(action)} all (${numBulkThreads.toLocaleString()})`}
            loading={bulkThreadActionInProgress}
            onClick={handleBulkThreadAction}
            type={isPermDeletingTrash ? Type.DESTRUCTIVE : undefined}
          />
          {/**This button is repurposed as cancel for contexts when only only bulk option is given */}
          <ButtonGroupItem
            disabled={actionInProgress}
            label={
              showSelectedThreadOption
                ? `${upperCaseFirstLetter(action)} selected (${numSelectedThreads.toLocaleString()})`
                : 'Cancel'
            }
            loading={selectedThreadActionInProgress}
            onClick={showSelectedThreadOption ? handleSelectedThreadAction : onCancel}
          />
        </ButtonGroup>
      </ButtonRow>
    </Dialog>
  );
};
export default BulkActionConfirmModal;
