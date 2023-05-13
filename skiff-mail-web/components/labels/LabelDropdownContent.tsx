import { DISPLAY_SCROLLBAR_CSS, DropdownItem, Icon, Icons, InputField, ThemeMode } from 'nightwatch-ui';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
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

export const LABEL_DROPDOWN_CONTAINER_WIDTH = 280;

const Container = styled.div`
  width: ${LABEL_DROPDOWN_CONTAINER_WIDTH}px;
  padding: 4px;
  box-sizing: border-box;
`;

const InputFieldContainer = styled.div`
  width: 100%;
  margin-bottom: 2px;
`;

const ScrollContainer = styled.div<{ $themeMode: ThemeMode }>`
  max-height: 200px;
  overflow-y: auto;
  ${DISPLAY_SCROLLBAR_CSS}
`;

interface LabelDropdownContentProps {
  variant: UserLabelVariant;
  isLabelActive: (label: Label) => boolean;
  setShowDropdown: (open: boolean) => void;
  // Add the selected labels to threads if applicable
  addLabelOrFolder?: (label: UserLabelPlain | UserLabelFolder) => Promise<void>;
  highlightedIdx?: number;
  includeSystemLabels?: boolean;
  threadIDs?: string[];
  // Additional actions to perform after closing the create label modal
  onCloseCreateLabelOrFolderModal?: (userLabel?: UserLabelPlain | UserLabelFolder) => void;
  onDeleteLabel?: (label: UserLabelPlain | UserLabelFolder) => void;
  onSelectFolder?: (folder: UserLabelFolder) => void;
  onSelectLabel?: (label: UserLabelPlain) => Promise<void> | UserLabelPlain[];
  onSelectNone?: () => void;
  onSelectSystemLabel?: (systemLabel: SystemLabel) => void;
  setHighlightedIdx?: (idx?: number) => void;
  // Sets the total number of scrollable items - necessary for keyboard navigation
  setNumItems?: (length: number) => void;
}

const LabelDropdownContent: FC<LabelDropdownContentProps> = ({
  variant,
  isLabelActive,
  setShowDropdown,
  addLabelOrFolder,
  highlightedIdx,
  includeSystemLabels = false,
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
  const theme = ThemeMode.DARK;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');

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

  const [isOptionsSubMenuOpen, setIsOptionsSubMenuOpen] = useState(false);

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
    if (!!setNumItems) setNumItems(filteredLabels.length);
  }, [filteredLabels.length, setNumItems]);

  const handleEnter = useCallback(async () => {
    if (isOptionsSubMenuOpen || highlightedIdx === undefined) return;
    const label = filteredLabels[highlightedIdx];
    if (!label) return;

    if (isNoneLabel(label)) {
      if (onSelectNone) onSelectNone();
      return;
    }

    if (isSystemLabel(label)) {
      if (onSelectSystemLabel) onSelectSystemLabel(label);
      return;
    }

    const isActive = isLabelActive(label);
    switch (label.variant) {
      case UserLabelVariant.Folder:
        if (isActive) return;
        if (onSelectFolder) onSelectFolder(label);
        break;
      case UserLabelVariant.Plain:
        if (onSelectLabel) await onSelectLabel(label);
        break;
    }
  }, [
    filteredLabels,
    highlightedIdx,
    isLabelActive,
    isOptionsSubMenuOpen,
    onSelectFolder,
    onSelectLabel,
    onSelectNone,
    onSelectSystemLabel
  ]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') void handleEnter();
    },
    [handleEnter]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <Container ref={containerRef}>
      <InputFieldContainer>
        <InputField
          autoFocus
          borderRadius={6}
          forceTheme={theme}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder='Search'
          value={search}
        />
      </InputFieldContainer>
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
                  onClick={() => {
                    onSelectFolder(label);
                  }}
                  onDeleteLabel={onDeleteLabel}
                  onHover={onHover}
                  setIsOptionsSubMenuOpen={setIsOptionsSubMenuOpen}
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
                  setIsOptionsSubMenuOpen={setIsOptionsSubMenuOpen}
                />
              );
            } else if (isSystemLabel(label) && onSelectSystemLabel) {
              return (
                <SystemLabelDropdownItem
                  active={isLabelActive(label)}
                  highlight={isHighlighted}
                  key={label.value}
                  label={label}
                  onClick={() => {
                    onSelectSystemLabel(label);
                  }}
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
                  onClick={() => {
                    onSelectNone();
                  }}
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
          icon={Icon.Plus}
          label={search ? `"${search}"` : `Add ${variant === UserLabelVariant.Plain ? 'label' : 'folder'}`}
          onClick={() => {
            setShowDropdown(false);
            openEditFolderModal();
          }}
          onHover={() => setHighlightedIdx?.(undefined)}
        />
      )}
    </Container>
  );
};

export default LabelDropdownContent;
