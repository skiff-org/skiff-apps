import { Dropdown, InputField } from 'nightwatch-ui';
import { RefObject, useState } from 'react';
import React from 'react';
import { UserLabelVariant } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { ModalType } from '../../redux/reducers/modalTypes';
import { Label, SystemLabel, UserLabelFolder, UserLabelPlain } from '../../utils/label';

import LabelDropdownContent, { LABEL_DROPDOWN_WIDTH } from './LabelDropdownContent';

interface SelectLabelDropdownProps {
  open: boolean;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  onClose(): void;
  isLabelActive: (label: Label) => boolean;
  variant?: UserLabelVariant;
  onSelectFolderOrSystemLabel?: (folder: UserLabelFolder | SystemLabel | undefined) => void;
  onSelectLabel?: (label: UserLabelPlain) => Promise<void> | UserLabelPlain[];
  // Additional actions to perform after closing the create label modal
  onCloseCreateLabelOrFolderModal?: (userLabel?: UserLabelPlain | UserLabelFolder) => void;
  includeSystemLabels?: boolean;
  onDeleteLabel?: (label: UserLabelPlain | UserLabelFolder) => void;
  userAnchor?: { x: number; y: number };
}

export const SelectLabelDropdown: React.FC<SelectLabelDropdownProps> = ({
  open,
  onClose,
  buttonRef,
  variant = UserLabelVariant.Plain,
  onSelectFolderOrSystemLabel,
  onSelectLabel,
  isLabelActive,
  onCloseCreateLabelOrFolderModal,
  includeSystemLabels,
  onDeleteLabel,
  userAnchor
}: SelectLabelDropdownProps) => {
  // Current hovered dropdown item
  const [highlightedIdx, setHighlightedIdx] = useState<number>(0);
  // Total number of dropdown items - needed for enabling keyboard navigation
  const [numItems, setNumItems] = useState<number>(0);
  // Search field value
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
      customAnchor={userAnchor}
      inputField={<InputField onChange={(e) => setSearch(e.target.value)} value={search} />}
      keyboardNavControls={{
        idx: highlightedIdx,
        setIdx: setHighlightedIdx,
        numItems
      }}
      noPadding
      portal
      setShowDropdown={setShowDropdown}
      showDropdown={open}
      width={LABEL_DROPDOWN_WIDTH}
    >
      <LabelDropdownContent
        highlightedIdx={highlightedIdx}
        includeSystemLabels={includeSystemLabels}
        isLabelActive={isLabelActive}
        numItems={numItems}
        onCloseCreateLabelOrFolderModal={onCloseCreateLabelOrFolderModal}
        onDeleteLabel={onDeleteLabel}
        onSelectFolder={onSelectFolderOrSystemLabel}
        onSelectLabel={onSelectLabel}
        // allow selecting a None option for folders, since it is a single select dropdown
        onSelectNone={
          onSelectFolderOrSystemLabel && variant === UserLabelVariant.Folder
            ? () => {
                onSelectFolderOrSystemLabel(undefined);
              }
            : undefined
        }
        onSelectSystemLabel={onSelectFolderOrSystemLabel}
        search={search}
        setHighlightedIdx={setHighlightedIdx}
        setNumItems={setNumItems}
        setShowDropdown={setShowDropdown}
        variant={variant}
      />
    </Dropdown>
  );
};
