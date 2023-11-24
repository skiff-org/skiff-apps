import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { UserLabelVariant } from 'skiff-graphql';

import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { UserLabelFolder, UserLabelPlain, isLabelActive, isPlainLabel } from '../../utils/label';
import { BulkAction } from '../../utils/mailboxActionUtils';

import LabelDropdownContent from './LabelDropdownContent';

export interface MoveToLabelDropdownContentProps {
  currentSystemLabels: string[];
  search: string;
  variant: UserLabelVariant;
  setShowDropdown: (open: boolean) => void;
  highlightedIdx?: number;
  numItems?: number;
  // If threadID is not passed in, it will apply labels to all selected threads
  threadID?: string;
  setHighlightedIdx?: (idx: number) => void;
  setNumItems?: (length: number) => void;
  // whether user should be prompted to choose between selected threads or entire mailbox
  shouldOfferBulkAction?: boolean;
}

const MoveToLabelDropdownContent: FC<MoveToLabelDropdownContentProps> = ({
  currentSystemLabels,
  search,
  variant,
  setShowDropdown,
  highlightedIdx,
  numItems,
  threadID,
  setHighlightedIdx,
  setNumItems,
  shouldOfferBulkAction
}) => {
  const dispatch = useDispatch();
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const threadIDs = threadID ? [threadID] : selectedThreadIDs;
  const threadFragments = useGetCachedThreads(threadIDs);
  const { applyUserLabel, removeUserLabel, moveThreads } = useThreadActions();
  const labelInfo = useRouterLabelContext();

  const moveThreadsToFolder = async (label: UserLabelFolder) => {
    if (shouldOfferBulkAction && labelInfo?.value) {
      setShowDropdown(false);
      return dispatch(
        skemailMailboxReducer.actions.setPendingMailboxAction({
          type: BulkAction.MOVE_FOLDER,
          destinationFolder: label,
          originLabelValue: labelInfo?.value
        })
      );
    }
    void moveThreads(threadIDs, label, currentSystemLabels);
    setShowDropdown(false);
  };

  const handleApplyUserLabel = async (label: UserLabelPlain) => {
    if (shouldOfferBulkAction && labelInfo?.value) {
      setShowDropdown(false);
      dispatch(
        skemailMailboxReducer.actions.setPendingMailboxAction({
          type: BulkAction.APPLY_LABEL,
          labeToApplyOrRemove: label,
          originLabelValue: labelInfo?.value
        })
      );
    } else {
      const { rejectedForDelinquency } = await applyUserLabel(threadIDs, [label]);
      if (rejectedForDelinquency) {
        setShowDropdown(false);
      }
    }
  };

  const handleRemoveUserLabel = async (label: UserLabelPlain) => {
    if (shouldOfferBulkAction) {
      setShowDropdown(false);
      dispatch(
        skemailMailboxReducer.actions.setPendingMailboxAction({
          type: BulkAction.REMOVE_LABEL,
          labeToApplyOrRemove: label,
          // this is the one mailbox action for which the origin need not be
          // modeled as the current mailbox; i.e. you can remove all labels and empty
          // out the associated mailbox without being in that mailbox
          originLabelValue: label.value
        })
      );
    } else {
      await removeUserLabel(threadIDs, [label]);
    }
  };

  return (
    <LabelDropdownContent
      addLabelOrFolder={async (label) => {
        if (isPlainLabel(label)) {
          await handleApplyUserLabel(label);
        } else {
          await moveThreadsToFolder(label);
        }
      }}
      highlightedIdx={highlightedIdx}
      isLabelActive={(label) => isLabelActive(label, threadFragments)}
      numItems={numItems}
      onSelectFolder={(label) => {
        void moveThreadsToFolder(label);
      }}
      onSelectLabel={async (label) => {
        if (isLabelActive(label, threadFragments)) {
          await handleRemoveUserLabel(label);
        } else {
          await handleApplyUserLabel(label);
        }
      }}
      search={search}
      setHighlightedIdx={setHighlightedIdx}
      setNumItems={setNumItems}
      setShowDropdown={setShowDropdown}
      threadIDs={threadIDs}
      variant={variant}
    />
  );
};

export default MoveToLabelDropdownContent;
