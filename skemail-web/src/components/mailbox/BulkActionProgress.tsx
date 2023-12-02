import { CircularProgress, Size } from 'nightwatch-ui';
import React, { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { BulkAction } from '../../utils/mailboxActionUtils';

// if progress has shown for more than allowed time, stop showing indicator;
// something may have gone wrong in retrieving job status from BullMQ
// (a failure that does not *necessarily* indicate failure of the corresponding job)
// and we don't want to block further bulk actions by misreporting an in-progress action
const MAX_RENDER_TIME_MS = 180_000; // 3 minutes

const ProgressContainer = styled.div`
  padding-left: 8px; //same as gap in Mailbox Actions, besides which this is sometimes displayed
`;

const BulkActionProgress: React.FC = () => {
  const dispatch = useDispatch();

  const clearInProgressBulkAction = useCallback(() => {
    dispatch(skemailMailboxReducer.actions.setInProgressBulkAction(undefined));
  }, [dispatch]);

  const inProgressBulkAction = useAppSelector((state) => state.mailbox.inProgressBulkAction);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (inProgressBulkAction) {
      timer = setTimeout(() => {
        clearInProgressBulkAction();
      }, MAX_RENDER_TIME_MS);
    }
    return () => {
      // timeout cleared when the inProgressAction becomes null on completion
      clearTimeout(timer);
    };
  }, [clearInProgressBulkAction, inProgressBulkAction]);

  const getToolTip = () => {
    if (!inProgressBulkAction) return '';
    switch (inProgressBulkAction?.bulkAction.type) {
      case BulkAction.APPLY_LABEL:
        return 'Applying labels';
      case BulkAction.MOVE_FOLDER:
        return `Moving to ${inProgressBulkAction.bulkAction.destinationFolder.name}`;
      case BulkAction.ARCHIVE:
        return 'Moving to Archive';
      case BulkAction.MOVE_TO_INBOX:
        return 'Moving to Inbox';
      case BulkAction.REMOVE_LABEL:
        return 'Removing labels';
      case BulkAction.TRASH:
        return 'Moving to Trash';
      case BulkAction.PERMANENTLY_DELETE:
        return 'Emptying Trash';
    }
  };

  return (
    <>
      {inProgressBulkAction && !inProgressBulkAction.isFinishing && (
        <ProgressContainer>
          <CircularProgress size={Size.SMALL} spinner tooltip={getToolTip()} />
        </ProgressContainer>
      )}
    </>
  );
};
export default BulkActionProgress;
