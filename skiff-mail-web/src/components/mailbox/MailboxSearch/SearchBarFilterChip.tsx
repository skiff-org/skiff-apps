import { Icon, Icons, Size, Typography, TypographyWeight, ThemeMode, getThemedColor } from 'nightwatch-ui';
import React, { useRef, SetStateAction, useEffect, useState } from 'react';
import { AddressObjectWithDisplayPicture } from 'skiff-front-utils';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import {
  MailboxSearchFilterType,
  EditableMailboxSearchFilterType,
  MailboxSearchFilter,
  MailboxSearchFilterChip
} from '../../../utils/search/searchTypes';
import { isEditableSearchFilterType } from '../../../utils/search/searchUtils';
import { ChipTypography, labelStyling } from '../../Settings/Filters/Chips/Chips.styles';
import { FilterChipCloseIcon } from '../../Settings/Filters/Chips/FilterConditionChip';
import {
  FILTER_CONDITION_CHIP_HEIGHT,
  FILTER_CONDITION_CHIP_EDGE_PADDING
} from '../../Settings/Filters/Filters.constants';

import { EditAddressFilterDropdown } from './EditAddressFilterDropdown';
import { FiniteSelectionFilterDropdown } from './FiniteSelectionFilterDropdown';
import {
  getIconForFilterChip,
  getLabelPrefixForSearchFilter,
  isEditableAddressFilterChip,
  isFiniteSelectionFilterChip
} from './MailboxSearch.utils';

export const FILTER_CHIP_MAX_WIDTH = 300;

const ChipContainer = styled.div<{ $emphasize?: boolean }>`
  display: flex;
  border: 1px solid var(--border-secondary);
  border-radius: 32px;
  align-items: center;
  box-sizing: border-box;
  height: ${FILTER_CONDITION_CHIP_HEIGHT}px;
  background: ${({ $emphasize }) => ($emphasize ? 'var(--bg-emphasis)' : 'var(--bg-l2-solid)')};
  user-select: none;
  max-width: ${FILTER_CHIP_MAX_WIDTH}px;
`;

const ValueLabel = styled.div<{ $canEdit: boolean; $emphasize?: boolean }>`
  ${labelStyling}
  display: flex;
  min-width: 32px;
  padding: 0 ${FILTER_CONDITION_CHIP_EDGE_PADDING}px;
  border-top-left-radius: 32px;
  border-bottom-left-radius: 32px;
  border-right: 1px
    ${({ $emphasize }) =>
      $emphasize ? getThemedColor('var(--border-primary)', ThemeMode.DARK) : 'var(--border-secondary)'}
    solid;
`;

const TypeLabel = styled.span<{ $emphasize?: boolean }>`
  color: ${({ $emphasize }) =>
    $emphasize ? getThemedColor('var(--text-primary)', ThemeMode.DARK) : 'var(--text-secondary)'};
  font-weight: 380;
`;

const InterDot = styled.span<{ $emphasize?: boolean }>`
  color: ${({ $emphasize }) =>
    $emphasize ? getThemedColor('var(--text-disabled)', ThemeMode.DARK) : 'var(--text-disabled)'};
  font-size: 22px;
  vertical-align: middle;
  margin: 0 4px;
  font-weight: 470;
`;

const ChipIcon = styled.div`
  padding-left: 4px;
`;

interface SearchBarFilterChipProps {
  chip: MailboxSearchFilterChip;
  // contacts to populate dropdown options
  contactList: AddressObjectWithDisplayPicture[];
  deleteChip: (type: MailboxSearchFilterType) => void;
  setOpenEditFilterDropdown: (type: SetStateAction<undefined | EditableMailboxSearchFilterType>) => void;
  setSearchFilters: (searchFilters: SetStateAction<MailboxSearchFilter[]>) => void;
  setPendingFilters: (types: SetStateAction<EditableMailboxSearchFilterType[]>) => void;
  openEditFilterValueDropdown?: EditableMailboxSearchFilterType;
}

export const SearchBarFilterChip: React.FC<SearchBarFilterChipProps> = ({
  chip,
  openEditFilterValueDropdown,
  contactList,
  deleteChip,
  setOpenEditFilterDropdown,
  setSearchFilters,
  setPendingFilters
}: SearchBarFilterChipProps) => {
  const { type, value, label } = chip;

  const editFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [canShowDropdown, setCanShowDropdown] = useState(false);

  // highlight the active dropdown with special styling
  const emphasize = openEditFilterValueDropdown === type;
  const forceTheme = emphasize ? ThemeMode.DARK : undefined;
  const canEdit = isEditableSearchFilterType(type);
  const chipIcon = getIconForFilterChip(chip, forceTheme);
  const isAddressChip = isEditableAddressFilterChip(chip);
  const isFiniteSelectionChip = isFiniteSelectionFilterChip(chip);
  const prefix = getLabelPrefixForSearchFilter(type);

  // only show dropdown after initial render to ensure anchor is properly set
  useEffect(() => {
    setCanShowDropdown(true);
  }, []);

  const addFilter = (newFilter: MailboxSearchFilter) => {
    setOpenEditFilterDropdown(undefined);
    // once a filter is successfully populated, remove it from pending filters and close the dropdown
    setPendingFilters((pendingFilters) => pendingFilters.filter((pendingFilter) => pendingFilter !== newFilter.type));
    // add the populated filter to shared search state;
    setSearchFilters((searchFilters) => {
      const updatedSearchFilters: MailboxSearchFilter[] = [
        newFilter,
        ...searchFilters.filter((existingFilter) => existingFilter.type !== type)
      ];
      return updatedSearchFilters;
    });
  };

  return (
    <ChipContainer
      $emphasize={emphasize}
      onClick={() => {
        if (!canEdit) return;
        setOpenEditFilterDropdown((openFilterType) => (!openFilterType || openFilterType !== type ? type : undefined));
      }}
      ref={editFilterDropdownRef}
    >
      <ValueLabel $canEdit={canEdit} $emphasize={emphasize}>
        {chipIcon && <ChipIcon>{chipIcon}</ChipIcon>}
        <ChipTypography>
          <Typography
            color={value ? 'primary' : 'disabled'}
            forceTheme={forceTheme}
            weight={value ? TypographyWeight.MEDIUM : TypographyWeight.REGULAR}
          >
            {/** Forego prefix for chips with an icon, as icon is sufficient context */}
            {!chipIcon && (
              <>
                <TypeLabel $emphasize={emphasize}>{upperCaseFirstLetter(prefix)}</TypeLabel>
                <InterDot $emphasize={emphasize}>&middot;</InterDot>
              </>
            )}
            {label}
          </Typography>
        </ChipTypography>
      </ValueLabel>
      <FilterChipCloseIcon
        onClick={(e) => {
          e.stopPropagation(); // stop dropdown handler onClick in parent container
          deleteChip(type);
        }}
      >
        <Icons color='disabled' forceTheme={forceTheme} icon={Icon.Close} size={Size.SMALL} />
      </FilterChipCloseIcon>
      {canShowDropdown && (
        <>
          {isAddressChip && (
            <EditAddressFilterDropdown
              activeChip={chip}
              addFilter={addFilter}
              buttonRef={editFilterDropdownRef}
              contactList={contactList}
              openEditFilterValueDropdown={openEditFilterValueDropdown}
              setOpenEditFilterDropdown={setOpenEditFilterDropdown}
            />
          )}
          {isFiniteSelectionChip && (
            <FiniteSelectionFilterDropdown
              activeChip={chip}
              addFilter={addFilter}
              buttonRef={editFilterDropdownRef}
              openEditFilterValueDropdown={openEditFilterValueDropdown}
              setOpenEditFilterDropdown={setOpenEditFilterDropdown}
            />
          )}
        </>
      )}
    </ChipContainer>
  );
};
