import { Icon, IconProps } from '@skiff-org/skiff-ui';
import { IndexedSkemail } from 'skiff-front-search';
import { AddressObject, UserLabel as UserLabelOrFolder, UserLabelVariant } from 'skiff-graphql';

import { ClientAttachment } from '../components/Attachments';
import {
  CHIP_SELECTION_ROW_HEIGHT,
  HEADER_ROW_HEIGHT,
  SKEMAIL_ROW_HEIGHT,
  TITLE_ONLY_ROW_HEIGHT
} from '../components/shared/CmdPalette/constants';
import { AppRoutes } from '../constants/route.constants';
import { getSearchWorker } from '../hooks/useSearchWorker';

import { SYSTEM_LABELS } from './label';

export enum SearchItemType {
  Document = 'DOCUMENT', // document search result
  Action = 'ACTION', // quick action
  Header = 'HEADER', // header row to separate different sections
  Skemail = 'SKEMAIL', // skemail search result
  Filter = 'FILTER', // narrowing search results (ex: in: inbox, to: addressXYZ)
  FilterRow = 'FILTER_ROW', // row of filter chips (ex: row of date filters)
  Category = 'CATEGORY', // searching for a category (ex: searching for person, attachments)
  Query = 'QUERY' // showing a search result in the modal (ex: showing recent searches)
}

interface SearchItemBase {
  itemType: string;
  subject: string;
}

/**
 * A kind of abbreviated Skemail.
 */
export interface SearchSkemail extends SearchItemBase, IndexedSkemail {
  itemType: SearchItemType.Skemail;
}

export interface SearchAction extends SearchItemBase {
  itemType: SearchItemType.Action;
  iconProps: IconProps;
  onClick: () => void;
  cmdTooltip?: string;
}

export interface SearchHeader extends SearchItemBase {
  itemType: SearchItemType.Header;
  headerItemType?: SearchItemType;
  showAllOptions?: boolean;
  onClickText?: string;
}

export type SearchItem =
  | SearchAction
  | SearchSkemail
  | SearchFilter
  | SearchFilterRow
  | SearchHeader
  | SearchCategory
  | SearchQuery;

export type SearchIndexSymmetricKey = string;

/** Search Categories */

export enum SearchCategoryType {
  Contact = 'CONTACT',
  Attachments = 'ATTACHMENTS',
  Labels = 'LABELS',
  Folders = 'FOLDERS'
}

interface SearchCategoryBase {
  categoryType: SearchCategoryType;
}

export interface SearchContact extends SearchCategoryBase {
  categoryType: SearchCategoryType.Contact;
  address: string;
  displayName?: string | null;
}

export interface SearchAttachment extends SearchCategoryBase {
  categoryType: SearchCategoryType.Attachments;
  fileName: string;
  fileType: string;
  fileSize?: number;
  email: SearchSkemail;
  index: number;
  clientAttachments: ClientAttachment[];
}

export interface SearchLabelOrFolder extends SearchCategoryBase {
  color: IconProps['color'];
  variant: UserLabelVariant;
  name: string;
}

export interface SearchLabelCategory extends SearchLabelOrFolder {
  categoryType: SearchCategoryType.Labels;
  variant: UserLabelVariant.Plain;
}

export interface SearchFolderCategory extends SearchLabelOrFolder {
  categoryType: SearchCategoryType.Folders;
  variant: UserLabelVariant.Folder;
}

export interface SearchCategory extends SearchItemBase {
  itemType: SearchItemType.Category;
  categoryInfo?: SearchContact | SearchAttachment | SearchLabelCategory | SearchFolderCategory;
}

/** Search Filters */

export enum SearchFilterType {
  SystemLabel = 'SYSTEM_LABEL',
  UserLabel = 'USER_LABEL',
  // Filters through To/CC/BCC
  ToAddress = 'TO_ADDRESS',
  FromAddress = 'FROM_ADDRESS',
  FromMe = 'FROM_ME',
  HasAttachment = 'HAS_ATTACHMENT',
  Date = 'DATE',
  Category = 'CATEGORY'
}

export enum FilterByType {
  People = 'PEOPLE',
  Attachments = 'ATTACHMENTS',
  Labels = 'LABELS',
  Folders = 'FOLDERS'
}

interface SearchFilterBase {
  filterType: SearchFilterType;
  filterValue: unknown;
}

/** Type describing SearchFilterTypes that correspond to a chip in the "Filter by..." section */
type UserFacingFilterByChipType = Exclude<
  SearchFilterType,
  | SearchFilterType.SystemLabel
  | SearchFilterType.UserLabel
  | SearchFilterType.ToAddress
  | SearchFilterType.Category
  | SearchFilterType.HasAttachment
  | SearchFilterType.Date
>;

/** Label Types */
export type SearchSystemLabel = string;
export type SearchUserLabel = string;

export type SearchLabel = SearchSystemLabel | SearchUserLabel;
// Combined for now, but we can separate in the future if we need to differentiate
export type SearchLabelType = SearchFilterType.SystemLabel | SearchFilterType.UserLabel;

/** Address Types */
export type SearchAddress = AddressObject;

export type SearchAddressType = SearchFilterType.ToAddress | SearchFilterType.FromAddress | SearchFilterType.FromMe;

export interface SearchDate {
  start: number;
  end: number;
}

export interface SearchLabelFilter extends SearchFilterBase {
  filterType: SearchLabelType;
  filterValue: SearchLabel;
}

export interface SearchAddressFilter extends SearchFilterBase {
  filterType: SearchAddressType;
  filterValue: SearchAddress;
}

export interface SearchAttachmentFilter extends SearchFilterBase {
  filterType: SearchFilterType.HasAttachment;
  filterValue: string;
}

export interface SearchDateFilter extends SearchFilterBase {
  filterType: SearchFilterType.Date;
  filterValue: SearchDate;
}

export interface SearchCategoryFilter extends SearchFilterBase {
  filterType: SearchFilterType.Category;
  filterValue: FilterByType;
}

export interface SearchFilter extends SearchItemBase {
  itemType: SearchItemType.Filter;
  subject: string;
  query?: string;
  filter: SearchAddressFilter | SearchLabelFilter | SearchAttachmentFilter | SearchDateFilter | SearchCategoryFilter;
}

export interface SearchFilterRow extends SearchItemBase {
  itemType: SearchItemType.FilterRow;
  subject: string;
  filters: SearchFilter[];
}

export interface SearchQuery extends SearchItemBase {
  itemType: SearchItemType.Query;
  subject: string;
  filters: SearchFilter[];
}

/**
 * Utility function: Searches for indexed skemails where either the
 * to or from addresses/names match the query value.
 */
const toFromFields = ['to', 'from'];
export async function toFromSearch(query: string) {
  return (await getSearchWorker()?.search(query, { fields: toFromFields })) || [];
}

/**
 * Utility function: Retrieves SearchItems whose subject include a query.
 */
export function filterByTitle(searchItems: Array<SearchAction>, query: string) {
  return searchItems.filter((doc) => doc.subject.toLowerCase().includes(query.toLowerCase()));
}

/**
 * Utility function: Combines quick actions and searched skemails into list needed
 * for VariableSizeList. Adds headers if necessary.
 * NOTE: Copied from editor MVP
 */
export function combineSearchResults(actions: Array<SearchItem>, showActionsToggle?: boolean) {
  const searchResults: (SearchHeader | SearchItem)[] = [];

  const pushSearchItems = (
    header: string | null,
    itemsList: Array<SearchItem>,
    headerOptions?: Partial<SearchHeader>
  ) => {
    if (itemsList.length > 0) {
      if (header) {
        searchResults.push({
          itemType: SearchItemType.Header,
          subject: header,
          ...headerOptions
        } as SearchHeader);
      }
      searchResults.push(...itemsList);
    }
  };

  pushSearchItems(null, actions, {
    headerItemType: SearchItemType.Action,
    showAllOptions: showActionsToggle
  });

  return searchResults;
}

export function getFilterPrefix(filterType: SearchFilterType) {
  switch (filterType) {
    case SearchFilterType.SystemLabel:
    case SearchFilterType.UserLabel:
      return 'In';
    case SearchFilterType.FromAddress:
      return 'From';
    case SearchFilterType.ToAddress:
      return 'To';
    default:
      return '';
  }
}

//Util function to get icon associated with each cateogory filter
export const getIconFromFilterValue = (filterValue: string | AddressObject | SearchDate) => {
  switch (filterValue) {
    case FilterByType.People:
      return Icon.UserCircle;
    case FilterByType.Attachments:
      return Icon.PaperClip;
    case FilterByType.Labels:
      return Icon.Tag;
    case FilterByType.Folders:
      return Icon.Folder;
    default:
      return Icon.Dot;
  }
};

const getLabelOrFolderColorFromFilterValue = (userLabels: UserLabelOrFolder[], filterValue: string) =>
  userLabels.find((label) => label.labelName.toLowerCase() === filterValue.toLowerCase())?.color;

/**
 * Utility function to get icon and color pairings for associated filter chips
 */
export const getIconFromFilter = (
  filter: SearchAddressFilter | SearchLabelFilter | SearchAttachmentFilter | SearchCategoryFilter | SearchDateFilter,
  userLabels: UserLabelOrFolder[]
) => {
  const { filterType, filterValue } = filter;
  switch (filterType) {
    case SearchFilterType.FromMe:
      return {
        icon: Icon.UserCircle
      };
    case SearchFilterType.SystemLabel:
      const systemIcon = SYSTEM_LABELS.find((label) => label.value === filterValue)?.icon;
      return {
        icon: systemIcon ?? Icon.Dot
      };
    case SearchFilterType.HasAttachment:
      return {
        icon: Icon.PaperClip
      };
    case SearchFilterType.UserLabel:
      const userLabelIcon =
        userLabels.find((label) => label.labelName.toLowerCase() === filterValue.toLowerCase())?.variant ===
        UserLabelVariant.Folder
          ? Icon.Folder
          : Icon.Tag;
      return {
        icon: userLabelIcon,
        color: getLabelOrFolderColorFromFilterValue(userLabels, filterValue)
      };
    case SearchFilterType.Category:
      return {
        icon: getIconFromFilterValue(filterValue),
        color: getLabelOrFolderColorFromFilterValue(userLabels, filterValue)
      };
    case SearchFilterType.Date:
      return {
        icon: Icon.Clock
      };
    default:
      return {
        icon: Icon.Dot
      };
  }
};

const excludedFiltersByFilterType: Record<UserFacingFilterByChipType, SearchFilterType[]> = {
  [SearchFilterType.FromMe]: [SearchFilterType.FromAddress],
  [SearchFilterType.FromAddress]: [SearchFilterType.FromMe]
};

/**
 * Utility function to get the set of filters that will be hidden because the conflict with a set of filters
 */
export function getFilterTypesToHide(filters: SearchFilter[]) {
  const filterTypesToHide: SearchFilterType[] = filters.map((filter) => filter.filter.filterType);
  filters.forEach((filter) => {
    const conflictingFiltersOfFilter = excludedFiltersByFilterType[filter.filter.filterType] ?? [];
    filterTypesToHide.push(...conflictingFiltersOfFilter);
  });
  return filterTypesToHide;
}

export const hideFilters = (
  filters: Array<SearchFilter>,
  filterTypesToHide: Array<SearchFilterType>
): Array<SearchFilter> => {
  const SEARCH_PATH = `/mail/${AppRoutes.SEARCH}`;
  return filters.filter(
    (filter) => !filterTypesToHide.includes(filter.filter.filterType) && filter.filter.filterValue !== SEARCH_PATH
  );
};

export const getRowHeightFromSearchItem = (searchItem: SearchItem) => {
  if (searchItem.itemType === SearchItemType.Header) {
    return HEADER_ROW_HEIGHT;
  }
  if (
    (searchItem.itemType === SearchItemType.Category && !searchItem.categoryInfo) ||
    (searchItem.itemType === SearchItemType.Filter && !searchItem.filter)
  ) {
    return CHIP_SELECTION_ROW_HEIGHT;
  }
  if (searchItem.itemType === SearchItemType.Skemail) {
    return SKEMAIL_ROW_HEIGHT;
  }
  return TITLE_ONLY_ROW_HEIGHT;
};
