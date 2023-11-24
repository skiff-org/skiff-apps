import { Dropdown, InputField } from 'nightwatch-ui';
import { RefObject, useState } from 'react';
import { UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { ModalType } from '../../redux/reducers/modalTypes';

import { LABEL_DROPDOWN_WIDTH } from './LabelDropdownContent';
import MoveToLabelDropdownContent from './MoveToLabelDropdownContent';

interface MoveToLabelDropdownProps {
  open: boolean;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  onClose(): void;
  threadID?: string;
  variant?: UserLabelVariant;
  currentSystemLabels: string[];
  // whether user should be prompted to choose between selected threads or entire mailbox
  shouldOfferBulkAction?: boolean;
}

export const MoveToLabelDropdown: React.FC<MoveToLabelDropdownProps> = ({
  open,
  onClose,
  buttonRef,
  threadID,
  variant = UserLabelVariant.Plain,
  currentSystemLabels,
  shouldOfferBulkAction
}: MoveToLabelDropdownProps) => {
  const [highlightedIdx, setHighlightedIdx] = useState<number>(0);
  const [numItems, setNumItems] = useState<number>(0);
  const [search, setSearch] = useState('');

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
      inputField={<InputField onChange={(e) => setSearch(e.target.value)} value={search} />}
      keyboardNavControls={{
        setIdx: setHighlightedIdx,
        idx: highlightedIdx,
        numItems
      }}
      portal
      setShowDropdown={setShowDropdown}
      showDropdown={open}
      width={LABEL_DROPDOWN_WIDTH}
    >
      <MoveToLabelDropdownContent
        currentSystemLabels={currentSystemLabels}
        highlightedIdx={highlightedIdx}
        numItems={numItems}
        search={search}
        setHighlightedIdx={setHighlightedIdx}
        setNumItems={setNumItems}
        setShowDropdown={setShowDropdown}
        shouldOfferBulkAction={shouldOfferBulkAction}
        threadID={threadID}
        variant={variant}
      />
    </Dropdown>
  );
};
