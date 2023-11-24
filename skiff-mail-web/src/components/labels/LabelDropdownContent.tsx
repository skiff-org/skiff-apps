import { DISPLAY_SCROLLBAR_CSS, DropdownItem, Icon, Icons, ThemeMode } from 'nightwatch-ui';
import { FC, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { trimAndLowercase } from 'skiff-utils';
import styled from 'styled-components';

import { useAvailableUserLabels } from '../../hooks/useAvailableLabels';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import {
  Label,
  NONE_LABEL,
  RESTRICTED_DRAG_AND_DROP_LABELS,
  SYSTEM_LABELS,
  SystemLabel,
  UserLabelFolder,
  UserLabelPlain,
  isFolder,
  isNoneLabel,
  isPlainLabel,
  isSystemLabel
} from '../../utils/label';

import { FolderLabelDropdownItem, PlainLabelDropdownItem, SystemLabelDropdownItem } from './LabelDropdownItem';

export const LABEL_DROPDOWN_WIDTH = 280;

const Container = styled.div`
  width: 100%;
`;

const ScrollContainer = styled.div<{ $themeMode: ThemeMode }>`
  max-height: 200px;
  overflow-y: auto;
  ${DISPLAY_SCROLLBAR_CSS}
`;

interface LabelDropdownContentProps {
  search: string;
  variant: UserLabelVariant;
  isLabelActive: (label: Label) => boolean;
  setShowDropdown: (open: boolean) => void;
  // Add the selected labels to threads if applicable
  addLabelOrFolder?: (label: UserLabelPlain | UserLabelFolder) => Promise<void>;
  highlightedIdx?: number;
  includeSystemLabels?: boolean;
  // Total number of scrollable items - necessary for keyboard navigation
  numItems?: number;
  threadIDs?: string[];
  // Additional actions to perform after closing the create label modal
  onCloseCreateLabelOrFolderModal?: (userLabel?: UserLabelPlain | UserLabelFolder) => void;
  onDeleteLabel?: (label: UserLabelPlain | UserLabelFolder) => void;
  onSelectFolder?: (folder: UserLabelFolder) => void;
  onSelectLabel?: (label: UserLabelPlain) => Promise<void> | UserLabelPlain[];
  onSelectNone?: () => void;
  onSelectSystemLabel?: (systemLabel: SystemLabel) => void;
  setHighlightedIdx?: (idx: number) => void;
  // Sets the total number of scrollable items - necessary for keyboard navigation
  setNumItems?: (length: number) => void;
}

const LabelDropdownContent: FC<LabelDropdownContentProps> = ({
  search,
  variant,
  isLabelActive,
  setShowDropdown,
  addLabelOrFolder,
  highlightedIdx,
  includeSystemLabels = false,
  numItems = 0,
  threadIDs,
  onCloseCreateLabelOrFolderModal,
  onDeleteLabel,
  onSelectFolder,
  onSelectLabel,
  onSelectNone,
  onSelectSystemLabel,
  setHighlightedIdx,
  setNumItems
}) => {
  const dispatch = useDispatch();
  const openEditFolderModal = () =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.CreateOrEditLabelOrFolder,
        threadIDs,
        folder: variant === UserLabelVariant.Folder,
        initialName: search,
        addLabelOrFolder,
        onClose: onCloseCreateLabelOrFolderModal
      })
    );

  const { existingLabels: existingUserLabels, availableLabels: availableUserLabels } = useAvailableUserLabels(
    variant === UserLabelVariant.Plain ? isPlainLabel : isFolder
  );
  const allUserLabels = [...existingUserLabels, ...availableUserLabels];
  // Filter out all Systems labels you cannot drag threads to + Inbox, which is
  // redundant since for the most part all emails start out in Inbox
  const allAvailableSystemLabels = includeSystemLabels
    ? SYSTEM_LABELS.filter(
        (label) =>
          !RESTRICTED_DRAG_AND_DROP_LABELS.has(label.value as SystemLabels) && label.value !== SystemLabels.Inbox
      )
    : [];

  const getFilteredAndSortedLabels = () => {
    const sortByName = (l1: Label, l2: Label) => l1.name.localeCompare(l2.name);
    // Sort labels by name
    let systemLabels = allAvailableSystemLabels.sort(sortByName);
    let userLabels = allUserLabels.sort(sortByName);
    let noneLabel = onSelectNone ? [NONE_LABEL] : [];
    if (search) {
      // Filter labels by the search term
      const filterNameMatch = (item: Label) => item.name.toLowerCase().includes(trimAndLowercase(search));
      systemLabels = systemLabels.filter(filterNameMatch);
      userLabels = userLabels.filter(filterNameMatch);
      noneLabel = noneLabel.filter(filterNameMatch);
    }
    // Order system labels in front of user labels
    const allLabels = [...noneLabel, ...systemLabels, ...userLabels];
    return allLabels;
  };

  const filteredLabels = getFilteredAndSortedLabels();

  useEffect(() => {
    // The added 1 is for the "Add label / folder" button
    setNumItems?.(filteredLabels.length + 1);
  }, [filteredLabels.length, setNumItems]);

  const onAddClick = useCallback(() => {
    setShowDropdown(false);
    openEditFolderModal();
  }, [openEditFolderModal, setShowDropdown]);

  return (
    <Container>
      {filteredLabels.length > 0 && (
        <ScrollContainer $themeMode={ThemeMode.DARK}>
          {filteredLabels.map((label, index) => {
            // If 'highlightedIdx' is undefined, that means keyboard navigation is inactive
            // and in order to reflect that in the DropdownItem, we need to pass undefined to the 'highlight' prop
            const isHighlighted = highlightedIdx !== undefined ? index === highlightedIdx : undefined;
            const onHover = () => setHighlightedIdx?.(index);
            if (isFolder(label) && onSelectFolder) {
              return (
                <FolderLabelDropdownItem
                  active={isFolder(label) && isLabelActive(label)}
                  highlight={isHighlighted}
                  key={label.value}
                  label={label}
                  onClick={() => onSelectFolder(label)}
                  onDeleteLabel={onDeleteLabel}
                  onHover={onHover}
                />
              );
            } else if (isPlainLabel(label) && onSelectLabel) {
              return (
                <PlainLabelDropdownItem
                  active={isLabelActive(label)}
                  highlight={isHighlighted}
                  key={label.value}
                  label={label}
                  onClick={async () => {
                    await onSelectLabel(label);
                  }}
                  onDeleteLabel={onDeleteLabel}
                  onHover={onHover}
                />
              );
            } else if (isSystemLabel(label) && onSelectSystemLabel) {
              return (
                <SystemLabelDropdownItem
                  active={isLabelActive(label)}
                  highlight={isHighlighted}
                  key={label.value}
                  label={label}
                  onClick={() => onSelectSystemLabel(label)}
                  onHover={onHover}
                />
              );
            } else if (isNoneLabel(label) && onSelectNone) {
              // None label option
              return (
                <DropdownItem
                  active={isLabelActive(label)}
                  highlight={isHighlighted}
                  key={label.value}
                  label={label.value}
                  onClick={onSelectNone}
                  onHover={onHover}
                  startElement={<Icons forceTheme={ThemeMode.DARK} icon={label.icon} />}
                />
              );
            }
            return <></>;
          })}
        </ScrollContainer>
      )}
      {filteredLabels.every((label) => label.name.toLowerCase() !== search.toLowerCase()) && (
        <DropdownItem
          highlight={highlightedIdx !== undefined ? highlightedIdx === numItems - 1 : undefined}
          icon={Icon.Plus}
          label={search ? `"${search}"` : `Add ${variant === UserLabelVariant.Plain ? 'label' : 'folder'}`}
          onClick={onAddClick}
          onHover={() => setHighlightedIdx?.(numItems - 1)}
        />
      )}
    </Container>
  );
};

export default LabelDropdownContent;
