import { FC } from 'react';
import { useDispatch } from 'react-redux';
import { UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { useGetCachedThreads } from '../../utils/cache/cache';
import { UserLabelFolder, isLabelActive, isPlainLabel } from '../../utils/label';
import { ThreadNavigationIDs } from '../Thread/Thread.types';

import LabelDropdownContent from './LabelDropdownContent';

export interface MoveToLabelDropdownContentProps {
  currentSystemLabels: string[];
  variant: UserLabelVariant;
  setShowDropdown: (open: boolean) => void;
  highlightedIdx?: number;
  // Thread and email to make active after current thread is moved to folder
  nextThreadAndEmail?: ThreadNavigationIDs;
  // If threadID is not passed in, it will apply labels to all selected threads
  threadID?: string;
  setHighlightedIdx?: (idx?: number) => void;
  setNumItems?: (length: number) => void;
}

const MoveToLabelDropdownContent: FC<MoveToLabelDropdownContentProps> = ({
  currentSystemLabels,
  variant,
  setShowDropdown,
  highlightedIdx,
  nextThreadAndEmail,
  threadID,
  setHighlightedIdx,
  setNumItems
}) => {
  const dispatch = useDispatch();
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const threadIDs = threadID ? [threadID] : selectedThreadIDs;
  const threadFragments = useGetCachedThreads(threadIDs);
  const { applyUserLabel, removeUserLabel, moveThreads, setActiveThreadID } = useThreadActions();

  const moveThreadsToFolder = async (label: UserLabelFolder) => {
    await moveThreads(threadIDs, label, currentSystemLabels, !nextThreadAndEmail);
    setShowDropdown(false);
    if (nextThreadAndEmail) {
      setActiveThreadID(nextThreadAndEmail);
    }
  };

  return (
    <LabelDropdownContent
      addLabelOrFolder={async (label) => {
        if (isPlainLabel(label)) {
          await applyUserLabel(threadIDs, [label]);
        } else {
          await moveThreadsToFolder(label);
        }
        dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: [] }));
      }}
      highlightedIdx={highlightedIdx}
      isLabelActive={(label) => isLabelActive(label, threadFragments)}
      onSelectFolder={(label) => {
        void moveThreadsToFolder(label);
      }}
      onSelectLabel={async (label) => {
        if (isLabelActive(label, threadFragments)) {
          await removeUserLabel(threadIDs, [label]);
        } else {
          const { rejectedForDelinquency } = await applyUserLabel(threadIDs, [label]);
          if (rejectedForDelinquency) {
            if (!!setShowDropdown) {
              setShowDropdown(false);
            }
          }
        }
      }}
      setHighlightedIdx={setHighlightedIdx}
      setNumItems={setNumItems}
      setShowDropdown={setShowDropdown}
      threadIDs={threadIDs}
      variant={variant}
    />
  );
};

export default MoveToLabelDropdownContent;
