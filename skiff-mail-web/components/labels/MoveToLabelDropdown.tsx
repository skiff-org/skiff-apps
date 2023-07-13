import { Dropdown } from '@skiff-org/skiff-ui';
import { RefObject, useState } from 'react';
import { UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { ModalType } from '../../redux/reducers/modalTypes';
import { ThreadNavigationIDs } from '../Thread/Thread.types';

import MoveToLabelDropdownContent from './MoveToLabelDropdownContent';

interface MoveToLabelDropdownProps {
  open: boolean;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  onClose(): void;
  threadID?: string;
  variant?: UserLabelVariant;
  currentSystemLabels: string[];
  // Thread and email to make active after current thread is moved to folder
  nextThreadAndEmail?: ThreadNavigationIDs;
}

export const MoveToLabelDropdown: React.FC<MoveToLabelDropdownProps> = ({
  open,
  onClose,
  buttonRef,
  threadID,
  variant = UserLabelVariant.Plain,
  currentSystemLabels,
  nextThreadAndEmail
}: MoveToLabelDropdownProps) => {
  const [highlightedIdx, setHighlightedIdx] = useState<number | undefined>(0);
  const [numItems, setNumItems] = useState<number | undefined>(undefined);

  const { openModal } = useAppSelector((state) => state.modal);
  const editModalOpen = openModal?.type === ModalType.CreateOrEditLabelOrFolder;
  const setShowDropdown = (dropdownOpen: boolean) => {
    if (!dropdownOpen && !editModalOpen) {
      onClose();
    }
  };

  return (
    <Dropdown
      buttonRef={buttonRef}
      gapFromAnchor={12}
      highlightedIdx={highlightedIdx}
      noPadding
      numChildren={numItems}
      portal
      setHighlightedIdx={setHighlightedIdx}
      setShowDropdown={setShowDropdown}
      showDropdown={open}
    >
      <MoveToLabelDropdownContent
        currentSystemLabels={currentSystemLabels}
        highlightedIdx={highlightedIdx}
        nextThreadAndEmail={nextThreadAndEmail}
        setHighlightedIdx={setHighlightedIdx}
        setNumItems={setNumItems}
        setShowDropdown={setShowDropdown}
        threadID={threadID}
        variant={variant}
      />
    </Dropdown>
  );
};
