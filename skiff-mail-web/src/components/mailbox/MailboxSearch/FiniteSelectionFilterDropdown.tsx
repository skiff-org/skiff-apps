import { Dropdown, DropdownItem, ThemeMode } from 'nightwatch-ui';
import { SetStateAction, useState } from 'react';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { useGetFF } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { IndexThreadContentUpdatedAtFlag } from 'skiff-utils';

import { splitUserLabelsByVariant, sortByName, userLabelFromGraphQL } from '../../../utils/label';
import {
  MailboxSearchFilter,
  MailboxSearchFilterType,
  FILTERABLE_SYSTEM_LABELS,
  FiniteSelectionFilterChip,
  EditableMailboxSearchFilterType
} from '../../../utils/search/searchTypes';
import { DROPDOWN_ANCHOR_GAP } from '../../Settings/Filters/Filters.constants';

import { getIconForFilterChip, getFilterChipForSearchFilter, PRESET_DATE_RANGES_IN_DAYS } from './MailboxSearch.utils';

interface FiniteSelectionFilterDropdownProps {
  // ref for the filter chip that parents this dropdown
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  // the filter being edited
  activeChip: FiniteSelectionFilterChip;
  // control open filter editing dropdown; only one at a time
  setOpenEditFilterDropdown: (type: SetStateAction<undefined | EditableMailboxSearchFilterType>) => void;
  // update active search filters with a new filter
  addFilter: (newFilter: MailboxSearchFilter) => void;
  openEditFilterValueDropdown?: EditableMailboxSearchFilterType;
}

/**
 * Dropdown used for search filters that have a finite number of items at any given time --
 * e.g. user labels or system labels. Such filters contrast with, e.g., address-related filters, which
 * allow for free text entry and allow the user the ability to create new items.
 */
export const FiniteSelectionFilterDropdown: React.FC<FiniteSelectionFilterDropdownProps> = ({
  activeChip,
  buttonRef,
  setOpenEditFilterDropdown,
  addFilter,
  openEditFilterValueDropdown
}: FiniteSelectionFilterDropdownProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const indexOnThreadContentUpdatedAt = useGetFF<IndexThreadContentUpdatedAtFlag>('indexThreadContentUpdatedAt');

  const { value, type } = activeChip;
  const { data } = useUserLabelsQuery();
  const { labels, folders } = splitUserLabelsByVariant(
    data?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );

  const getFilterOptions = (): MailboxSearchFilter[] => {
    switch (type) {
      case MailboxSearchFilterType.DATE:
        return PRESET_DATE_RANGES_IN_DAYS.map((daysAgo) => ({ type, range: { daysAgo } }));
      case MailboxSearchFilterType.SYSTEM_LABEL:
        return FILTERABLE_SYSTEM_LABELS.filter(
          (sysLabel) => indexOnThreadContentUpdatedAt || sysLabel !== SystemLabels.Imports
        ).map((filterableSystemLabel) => ({
          type,
          systemLabel: filterableSystemLabel
        }));
      case MailboxSearchFilterType.USER_PLAIN_LABEL:
        return labels.map((userLabel) => ({ type, userLabel }));
      case MailboxSearchFilterType.USER_FOLDER_LABEL:
        return folders.map((userFolder) => ({ type, userLabel: userFolder }));
    }
  };

  const isFilterOptionActive = (filterOption: MailboxSearchFilter) => {
    switch (filterOption.type) {
      case MailboxSearchFilterType.DATE:
        return type === filterOption.type && value?.daysAgo === filterOption.range.daysAgo;
      case MailboxSearchFilterType.SYSTEM_LABEL:
        return type === filterOption.type && value === filterOption.systemLabel;
      case MailboxSearchFilterType.USER_FOLDER_LABEL:
      case MailboxSearchFilterType.USER_PLAIN_LABEL:
        return type === filterOption.type && value?.value === filterOption.userLabel.value;
    }
  };

  const filterOptions = getFilterOptions();

  return (
    <Dropdown
      buttonRef={buttonRef}
      gapFromAnchor={DROPDOWN_ANCHOR_GAP}
      keyboardNavControls={{
        idx: highlightedIndex,
        setIdx: setHighlightedIndex,
        numItems: filterOptions.length
      }}
      minWidth={180}
      portal
      setShowDropdown={(open: boolean) => {
        if (open) {
          setOpenEditFilterDropdown(type);
        }
      }}
      showDropdown={openEditFilterValueDropdown === type}
    >
      {filterOptions.map((filter, idx) => {
        const chip = getFilterChipForSearchFilter(filter);
        return (
          <DropdownItem
            active={isFilterOptionActive(filter)}
            highlight={highlightedIndex === idx}
            key={chip.label}
            label={chip.label}
            onClick={() => addFilter(filter)}
            onHover={() => setHighlightedIndex(idx)}
            startElement={getIconForFilterChip(chip, ThemeMode.DARK)}
          />
        );
      })}
    </Dropdown>
  );
};
