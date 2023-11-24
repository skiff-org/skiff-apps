import { ACCENT_COLOR_VALUES, Icon, Icons, Size, ThemeMode, getThemedColor } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { DateRangeFilter, getDateRangeFromDaysAgo } from 'skiff-front-search';
import { upperCaseFirstLetter } from 'skiff-utils';

import { SYSTEM_LABELS } from '../../../utils/label';
import { SearchSortOrder } from '../../../utils/search/SearchProvider';
import {
  EditableAddressSearchFilterChip,
  EditableMailboxSearchFilterChip,
  EditableMailboxSearchFilterType,
  FINITE_SELECTION_FILTER_TYPES,
  FiniteSelectionFilterChip,
  MailboxSearchFilter,
  MailboxSearchFilterChip,
  MailboxSearchFilterType,
  PopulatedMailboxSearchFilterChip
} from '../../../utils/search/searchTypes';
import { UserLabelIconColorContainer } from '../../layout/SidebarItem';

const DAYS_IN_WEEK = 7;
const MIN_DAYS_IN_MONTH = 28;

// preset date filter ranges, ranging from 1 day ago to 1 year ago
export const PRESET_DATE_RANGES_IN_DAYS = [1, 2, 3, 7, 14, 21, 31, 62, 93, 186, 365];

export const getIconForFilterChip = (chip: MailboxSearchFilterChip, forceTheme?: ThemeMode) => {
  switch (chip.type) {
    case MailboxSearchFilterType.SYSTEM_LABEL:
      const icon = SYSTEM_LABELS.find((systemLabel) => systemLabel.value === chip.value)?.icon;
      if (!icon) return;
      return <Icons forceTheme={forceTheme} icon={icon} />;
    case MailboxSearchFilterType.USER_PLAIN_LABEL:
      const userLabel = chip.value;
      if (!userLabel) return;
      const color = userLabel.color
        ? (ACCENT_COLOR_VALUES[userLabel.color] as Array<string>)?.[1] || 'var(--bg-overlay-tertiary)'
        : 'var(--bg-overlay-tertiary)';
      return (
        <UserLabelIconColorContainer $color={forceTheme ? getThemedColor(color, forceTheme) : color}>
          <Icons color={userLabel.color} forceTheme={forceTheme} icon={Icon.Dot} size={Size.X_SMALL} />
        </UserLabelIconColorContainer>
      );
    case MailboxSearchFilterType.USER_FOLDER_LABEL:
      const userFolder = chip.value;
      if (!userFolder) return;
      return <Icons color={userFolder.color} forceTheme={forceTheme} icon={Icon.FolderSolid} />;
  }
};

export const getLabelPrefixForSearchFilter = (type: MailboxSearchFilterType, overflow?: boolean): string => {
  switch (type) {
    case MailboxSearchFilterType.FROM:
      return 'from';
    case MailboxSearchFilterType.TO:
      return 'to';
    case MailboxSearchFilterType.SUBJECT:
    case MailboxSearchFilterType.BODY:
    case MailboxSearchFilterType.SYSTEM_LABEL:
      return 'in';
    case MailboxSearchFilterType.DATE:
      return 'since';
    // use the shorter 'in' in the placeholder chip,
    // and the more distinguishing descriptor in the overflow dropdown
    case MailboxSearchFilterType.USER_PLAIN_LABEL:
      return overflow ? 'label' : 'in';
    case MailboxSearchFilterType.USER_FOLDER_LABEL:
      return overflow ? 'folder' : 'in';
  }
};

const getDateRangeLabel = ({ daysAgo }: DateRangeFilter, withoutSuffix?: boolean) => {
  // dayjs doesn't denominate in weeks, so we customize this case
  if (daysAgo >= DAYS_IN_WEEK && daysAgo < MIN_DAYS_IN_MONTH) {
    return `${pluralize('week', Math.floor(daysAgo / DAYS_IN_WEEK), true)}${withoutSuffix ? '' : ' ago'}`;
  }
  const { start, end } = getDateRangeFromDaysAgo(daysAgo);
  const timeAgo = end.to(start, withoutSuffix);
  // override dayjs' use of 'a' for singular time units
  if (timeAgo.startsWith('a')) {
    return '1' + timeAgo.slice(1);
  }
  return timeAgo;
};

export const getFilterChipPlaceholderLabel = (type: EditableMailboxSearchFilterType): string => {
  switch (type) {
    case MailboxSearchFilterType.FROM:
    case MailboxSearchFilterType.TO:
      return 'email';
    case MailboxSearchFilterType.DATE:
      return 'date';
    case MailboxSearchFilterType.SYSTEM_LABEL:
      return 'mailbox';
    case MailboxSearchFilterType.USER_PLAIN_LABEL:
      return 'label';
    case MailboxSearchFilterType.USER_FOLDER_LABEL:
      return 'folder';
  }
};

export const getFilterChipForSearchFilter = (
  filter: MailboxSearchFilter,
  withoutDateSuffix?: boolean
): PopulatedMailboxSearchFilterChip => {
  const { type } = filter;
  switch (type) {
    case MailboxSearchFilterType.FROM:
    case MailboxSearchFilterType.TO:
      return {
        type,
        value: filter.addressObj,
        label: filter.addressObj.name ?? filter.addressObj.address
      };
    case MailboxSearchFilterType.SUBJECT:
    case MailboxSearchFilterType.BODY:
      return { type, value: type, label: upperCaseFirstLetter(type) };
    case MailboxSearchFilterType.DATE:
      // no "ago" suffix to conserve space in populated chip
      return { type, value: filter.range, label: getDateRangeLabel(filter.range, withoutDateSuffix) };
    case MailboxSearchFilterType.SYSTEM_LABEL:
      return {
        type,
        value: filter.systemLabel,
        label: SYSTEM_LABELS.find((systemLabel) => systemLabel.value === filter.systemLabel)?.name || ''
      };
    case MailboxSearchFilterType.USER_FOLDER_LABEL:
      return { type, value: filter.userLabel, label: filter.userLabel.name };
    case MailboxSearchFilterType.USER_PLAIN_LABEL:
      return { type, value: filter.userLabel, label: filter.userLabel.name };
  }
};

export const getSearchFilterTypeLabel = (type: MailboxSearchFilterType) => {
  switch (type) {
    case MailboxSearchFilterType.SYSTEM_LABEL:
      return 'Mailbox';
    case MailboxSearchFilterType.USER_PLAIN_LABEL:
      return 'Label';
    case MailboxSearchFilterType.USER_FOLDER_LABEL:
      return 'Folder';
    default:
      return upperCaseFirstLetter(type);
  }
};

const areChipsEqual = (
  prevChip: PopulatedMailboxSearchFilterChip,
  currChip: PopulatedMailboxSearchFilterChip
): boolean => {
  if (prevChip.type !== currChip.type) return false;
  switch (prevChip.type) {
    case MailboxSearchFilterType.BODY:
    case MailboxSearchFilterType.SUBJECT:
    case MailboxSearchFilterType.SYSTEM_LABEL:
      return prevChip.value === currChip.value;
    case MailboxSearchFilterType.DATE:
      return currChip.type === MailboxSearchFilterType.DATE && prevChip.value.daysAgo === currChip.value.daysAgo;
    case MailboxSearchFilterType.FROM:
      return currChip.type === MailboxSearchFilterType.FROM && prevChip.value.address === currChip.value.address;
    case MailboxSearchFilterType.TO:
      return currChip.type === MailboxSearchFilterType.TO && prevChip.value.address === currChip.value.address;
    case MailboxSearchFilterType.USER_FOLDER_LABEL:
      return currChip.type === MailboxSearchFilterType.USER_FOLDER_LABEL && prevChip.value === currChip.value;
    case MailboxSearchFilterType.USER_PLAIN_LABEL:
      return currChip.type === MailboxSearchFilterType.USER_PLAIN_LABEL && prevChip.value === currChip.value;
  }
};

export const didSearchFiltersChange = (
  searchFilters: MailboxSearchFilter[],
  prevSearchFilters?: MailboxSearchFilter[]
) => {
  if (prevSearchFilters === undefined) return false;
  if (searchFilters.length !== prevSearchFilters.length) {
    return true;
  }
  return searchFilters.some(
    (filter) =>
      !prevSearchFilters?.some((prevFilter) =>
        areChipsEqual(getFilterChipForSearchFilter(prevFilter), getFilterChipForSearchFilter(filter))
      )
  );
};

export const didSearchOrderChange = (searchSortOrder: SearchSortOrder, prevSearchSortOrder?: SearchSortOrder) => {
  if (prevSearchSortOrder === undefined) return false;
  return searchSortOrder !== prevSearchSortOrder;
};

export const isEditableAddressFilterChip = (chip: MailboxSearchFilterChip): chip is EditableAddressSearchFilterChip =>
  chip.type === MailboxSearchFilterType.TO || chip.type === MailboxSearchFilterType.FROM;

export const isFiniteSelectionFilterChip = (chip: MailboxSearchFilterChip): chip is FiniteSelectionFilterChip =>
  FINITE_SELECTION_FILTER_TYPES.some((finiteType) => finiteType === chip.type);

export const canFiltersBeAppliedWithoutQuery = (filters: MailboxSearchFilter[]) =>
  filters.some((filter) => filter.type === MailboxSearchFilterType.FROM || filter.type === MailboxSearchFilterType.TO);

export const getPendingFilterChips = (
  pendingTypes: EditableMailboxSearchFilterType[]
): EditableMailboxSearchFilterChip[] => {
  return pendingTypes.map((pendingType) => ({
    type: pendingType,
    label: getFilterChipPlaceholderLabel(pendingType)
  }));
};
