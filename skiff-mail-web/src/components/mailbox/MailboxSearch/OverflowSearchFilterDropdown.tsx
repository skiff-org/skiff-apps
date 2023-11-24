import { Divider, Dropdown, ThemeMode } from 'nightwatch-ui';
import { FilterSelectMetadataItem } from 'skiff-front-utils';

import { MailboxSearchFilterType, PopulatedMailboxSearchFilterChip } from '../../../utils/search/searchTypes';
import { DROPDOWN_ANCHOR_GAP } from '../../Settings/Filters/Filters.constants';

import { OverflowSearchFilter } from './OverflowSearchFilter';

interface OverflowSearchFilterDropdownProps {
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  overflowFilters: PopulatedMailboxSearchFilterChip[];
  showDropdown: boolean;
  numActiveFilters: number;
  setShowDropdown: (open: boolean) => void;
  removeFilter: (type: MailboxSearchFilterType) => void;
  clearAllFilters: () => void;
}

export const OverflowSearchFilterDropdown: React.FC<OverflowSearchFilterDropdownProps> = ({
  overflowFilters,
  buttonRef,
  showDropdown,
  numActiveFilters,
  setShowDropdown,
  removeFilter,
  clearAllFilters
}: OverflowSearchFilterDropdownProps) => {
  return (
    <Dropdown
      buttonRef={buttonRef}
      gapFromAnchor={DROPDOWN_ANCHOR_GAP}
      portal
      setShowDropdown={setShowDropdown}
      showDropdown={showDropdown}
      width={284}
    >
      <FilterSelectMetadataItem clearAllFilters={clearAllFilters} numActiveFilters={numActiveFilters} />
      <Divider forceTheme={ThemeMode.DARK} width={276} />
      {overflowFilters.map((filter) => (
        <OverflowSearchFilter filter={filter} key={filter.label} removeFilter={() => removeFilter(filter.type)} />
      ))}
    </Dropdown>
  );
};
