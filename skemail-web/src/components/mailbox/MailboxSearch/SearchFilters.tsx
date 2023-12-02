import partition from 'lodash/partition';
import { Dropdown, DropdownItem, Icon, Icons, Size } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useCallback, useEffect, useRef, useState } from 'react';
import { contactToAddressObject, useGetAllContactsWithOrgMembers } from 'skiff-front-utils';
import styled from 'styled-components';

import {
  EditableMailboxSearchFilterType,
  MailboxSearchFilterChip,
  MailboxSearchFilterType,
  PopulatedMailboxSearchFilterChip
} from '../../../utils/search/searchTypes';
import { isEditableSearchFilterType } from '../../../utils/search/searchUtils';
import { useSearch } from '../../../utils/search/useSearch';
import {
  AddConditionIcon as AddFilterIcon,
  AddConditionLabel as AddFilterLabel
} from '../../Settings/Filters/FilterConditionChips';

import { SearchSortOrder } from '../../../utils/search/SearchProvider';
import { getFilterChipForSearchFilter, getPendingFilterChips } from './MailboxSearch.utils';
import { OverflowSearchFilterDropdown } from './OverflowSearchFilterDropdown';
import { FILTER_CHIP_MAX_WIDTH, SearchBarFilterChip } from './SearchBarFilterChip';
import { SearchFilterTypeDropdown } from './SearchFilterTypeDropdown';

const CHIP_HEIGHT = 24;
const CHIP_PADDING = 4;
const CHIP_BORDER_RADIUS = 32;
const ADD_FILTER_CHIP_CONTAINER_WIDTH = 108;
const FILTER_CHIP_CONTAINER_GAP = 8;

const SearchSortOrderLabels: Record<SearchSortOrder, string> = {
  [SearchSortOrder.Relevance]: 'Relevance',
  [SearchSortOrder.Asc]: 'Oldest',
  [SearchSortOrder.Desc]: 'Newest'
};

const SearchFilterActions = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  justify-content: flex-end;
  gap: 8px;
`;

const FilterChips = styled.div`
  max-width: 100%;
  min-width: 100%; // used to ensure resize observer accureately reports available space for inline filters
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: hidden;
  flex-wrap: nowrap;
  gap: ${FILTER_CHIP_CONTAINER_GAP}px;
`;

const ChipContainer = styled.div<{ $solid?: boolean }>`
  display: flex;
  flex-shrink: 0;
  padding: ${CHIP_PADDING}px;
  border: ${({ $solid }) => ($solid ? '1px solid var(--border-primary)' : '1px dashed var(--border-primary);')};
  border-radius: ${CHIP_BORDER_RADIUS}px;
  align-items: center;
  max-width: ${ADD_FILTER_CHIP_CONTAINER_WIDTH};
  cursor: pointer;
  box-sizing: border-box;
  height: ${CHIP_HEIGHT}px;

  &:hover {
    background: var(--bg-overlay-secondary);
  }
`;

const OverflowChipsContainer = styled.div`
  display: flex;
  padding: ${CHIP_PADDING}px;
  border: 1px solid var(--border-secondary);
  border-radius: ${CHIP_BORDER_RADIUS}px;
  align-items: center;
  width: fit-content;
  cursor: pointer;
  box-sizing: border-box;
  height: ${CHIP_HEIGHT}px;

  &:hover {
    background: var(--bg-overlay-secondary);
  }
`;

export const SearchFilters = () => {
  // state
  const [showAddFilterDropdown, setShowAddFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showOverflowFilterDropdown, setShowOverflowFilterDropdown] = useState(false);
  const [filterChipContainerWidth, setFilterChipContainerWidth] = useState(0);
  // pending filters have yet to be filled out with a value, e.g. a "To" filter with no associated address
  const [pendingFilters, setPendingFilters] = useState<EditableMailboxSearchFilterType[]>([]);
  const [openEditFilterDropdownType, setOpenEditFilterDropdownType] = useState<
    EditableMailboxSearchFilterType | undefined
  >();
  const filterChipsContainerRef = useRef<HTMLDivElement>(null);
  const addFilterChipRef = useRef<HTMLDivElement>(null);
  const sortChipRef = useRef<HTMLDivElement>(null);
  const overflowFilterRef = useRef<HTMLDivElement>(null);

  // hooks
  const { setSearchFilters, searchFilters, searchSortOrder, setSearchSortOrder } = useSearch();
  const { contactsWithOrgMembers } = useGetAllContactsWithOrgMembers();
  const contactList = contactsWithOrgMembers.map(contactToAddressObject) ?? [];

  const clearFilters = useCallback(() => {
    setSearchFilters([]);
    setPendingFilters([]);
  }, [setSearchFilters]);

  const removeFilter = useCallback(
    (type: MailboxSearchFilterType) => {
      setSearchFilters((prevSearchFilters) => prevSearchFilters.filter((filter) => filter.type !== type));
      setPendingFilters((prevPendingFilters) => prevPendingFilters.filter((filter) => filter !== type));
    },
    [setSearchFilters]
  );

  // sorted filters
  const populatedSearchFilterChips: PopulatedMailboxSearchFilterChip[] = searchFilters.map((appliedFilter) =>
    getFilterChipForSearchFilter(appliedFilter, true)
  );
  const activeAndPendingFilterTypes = [...populatedSearchFilterChips.map((filter) => filter.type), ...pendingFilters];
  const isInUse = (type: MailboxSearchFilterType) => activeAndPendingFilterTypes.includes(type);
  const [inUseFilterTypes, availableFilterTypes] = partition(Object.values(MailboxSearchFilterType), isInUse);

  const totalNumberChips = pendingFilters.length + (!!availableFilterTypes ? 1 : 0) + populatedSearchFilterChips.length;

  const worstCasePerChipWidth =
    FILTER_CHIP_MAX_WIDTH + ((totalNumberChips - 1) * FILTER_CHIP_CONTAINER_GAP) / totalNumberChips;

  // calculate available space for displaying populated filter chips inline
  const availableSpaceForInlineChips =
    filterChipContainerWidth -
    (!!availableFilterTypes ? ADD_FILTER_CHIP_CONTAINER_WIDTH : 0) -
    (!!pendingFilters ? pendingFilters.length * worstCasePerChipWidth : 0);

  const maxNumInlineFilterChips = Math.floor(availableSpaceForInlineChips / worstCasePerChipWidth);

  // only populated chips are bumped to the overflow dropdown
  const inlineFilterChips = populatedSearchFilterChips.slice(0, maxNumInlineFilterChips);
  const overflowFilterChips = populatedSearchFilterChips.slice(maxNumInlineFilterChips);

  // filter chips to be shown in toolbar, composed of already active (but still editable) filters and pending filters
  const toolbarFilterChips: MailboxSearchFilterChip[] = [
    ...getPendingFilterChips(pendingFilters),
    ...inlineFilterChips
  ];

  // whether to show a chip for reviewing additional filters that don't fit in-line
  const showOverflowChip = !!overflowFilterChips.length;

  const containerRef = filterChipsContainerRef.current;

  useEffect(() => {
    if (!containerRef) return;

    const resizeObserver = new ResizeObserver(() => {
      setFilterChipContainerWidth(containerRef.clientWidth);
    });
    resizeObserver.observe(containerRef);
    return () => resizeObserver.unobserve(containerRef);
  }, [containerRef]);

  // reset overflow dropdown state when overflow filters are cleared en masse,
  // one-by-one, or via mailbox resizing
  useEffect(() => {
    if (!showOverflowChip) {
      setShowOverflowFilterDropdown(false);
    }
  }, [showOverflowChip]);

  const handleFilterSelect = (type: MailboxSearchFilterType) => {
    // If the filter type is editable, update the pending filters
    if (isEditableSearchFilterType(type)) {
      setPendingFilters((filters) => {
        if (!filters.includes(type)) {
          return [...filters, type];
        }
        return filters;
      });
      // Auto-open the value-setting dropdown for the new pending filter
      setOpenEditFilterDropdownType(type);
      // Otherwise, update the active search filters
    } else {
      setSearchFilters((activeSearchFilters) => {
        // If the filter type isn't already in the active filters, add it to the front
        const doesFilterExist = activeSearchFilters.some((activeFilter) => activeFilter.type === type);
        if (!doesFilterExist) {
          return [{ type }, ...searchFilters];
        }
        return activeSearchFilters;
      });
    }
  };

  return (
    <SearchFilterActions>
      <FilterChips ref={filterChipsContainerRef}>
        {!!availableFilterTypes.length && (
          <ChipContainer onClick={() => setShowAddFilterDropdown((prev) => !prev)} ref={addFilterChipRef}>
            <AddFilterLabel color='secondary'>Add filter</AddFilterLabel>
            <AddFilterIcon>
              <Icons color='disabled' icon={Icon.Plus} size={Size.X_SMALL} />
            </AddFilterIcon>
            <SearchFilterTypeDropdown
              buttonRef={addFilterChipRef}
              inUseFilterTypes={inUseFilterTypes}
              onClickFilterType={handleFilterSelect}
              setShowDropdown={setShowAddFilterDropdown}
              showDropdown={showAddFilterDropdown}
            />
          </ChipContainer>
        )}
        {toolbarFilterChips.map((chip) => (
          <SearchBarFilterChip
            chip={chip}
            contactList={contactList}
            deleteChip={() => removeFilter(chip.type)}
            key={chip.type}
            openEditFilterValueDropdown={openEditFilterDropdownType}
            setOpenEditFilterDropdown={setOpenEditFilterDropdownType}
            setPendingFilters={setPendingFilters}
            setSearchFilters={setSearchFilters}
          />
        ))}
      </FilterChips>
      {showOverflowChip && (
        <OverflowChipsContainer onClick={() => setShowOverflowFilterDropdown((prev) => !prev)} ref={overflowFilterRef}>
          <AddFilterLabel color='secondary'>{`${overflowFilterChips.length} ${
            availableFilterTypes.length || toolbarFilterChips.length
              ? 'more'
              : pluralize('filter', overflowFilterChips.length)
          }`}</AddFilterLabel>
          <AddFilterIcon>
            <Icons
              color='disabled'
              icon={showOverflowFilterDropdown ? Icon.ChevronUp : Icon.ChevronDown}
              size={Size.X_SMALL}
            />
          </AddFilterIcon>
          <OverflowSearchFilterDropdown
            buttonRef={overflowFilterRef}
            clearAllFilters={clearFilters}
            numActiveFilters={searchFilters.length}
            overflowFilters={overflowFilterChips}
            removeFilter={removeFilter}
            setShowDropdown={setShowOverflowFilterDropdown}
            showDropdown={showOverflowFilterDropdown}
          />
        </OverflowChipsContainer>
      )}
      <ChipContainer $solid onClick={() => setShowSortDropdown((prev) => !prev)} ref={sortChipRef}>
        <AddFilterLabel color='secondary'>{SearchSortOrderLabels[searchSortOrder]}</AddFilterLabel>
        <AddFilterIcon>
          <Icons color='disabled' icon={showSortDropdown ? Icon.ChevronUp : Icon.ChevronDown} size={Size.X_SMALL} />
        </AddFilterIcon>
        <Dropdown
          gapFromAnchor={6}
          portal
          buttonRef={sortChipRef}
          showDropdown={showSortDropdown}
          setShowDropdown={setShowSortDropdown}
        >
          {[SearchSortOrder.Relevance, SearchSortOrder.Desc, SearchSortOrder.Asc].map((sortOrder) => {
            return (
              <DropdownItem
                key={sortOrder}
                label={SearchSortOrderLabels[sortOrder]}
                active={sortOrder === searchSortOrder}
                onClick={() => {
                  setSearchSortOrder(sortOrder);
                  setShowSortDropdown(false);
                }}
              />
            );
          })}
        </Dropdown>
      </ChipContainer>
    </SearchFilterActions>
  );
};

export default SearchFilters;
