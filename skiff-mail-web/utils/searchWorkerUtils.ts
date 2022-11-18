import dayjs from 'dayjs';
import { IconProps, Icon } from 'nightwatch-ui';
import { IndexedSkemail } from 'skiff-front-search';
import { UserLabelVariant } from 'skiff-graphql';
import { AddressObject } from 'skiff-graphql';
import { UserLabel as UserLabelOrFolder } from 'skiff-graphql';

import { ClientAttachment } from '../components/Attachments';
import {
  MAX_QUICK_ACTIONS_SHOWN,
  HEADER_ROW_HEIGHT,
  CHIP_SELECTION_ROW_HEIGHT,
  TITLE_ONLY_ROW_HEIGHT,
  SKEMAIL_ROW_HEIGHT
} from '../components/shared/CmdPalette/constants';
import { DATE_FILTERS } from '../constants/search.constants';
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

const RESULTS_HEADER = 'Search results';

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
export function combineSearchResults(
  query: string,
  actions: Array<SearchItem>,
  skemails: Array<SearchItem>,
  filters: Array<SearchItem>,
  filterRows: Array<SearchItem>,
  activeFilters: Array<SearchFilter>,
  contactList: Array<SearchCategory>,
  attachmentList: Array<SearchCategory>,
  labelList: Array<SearchCategory>,
  folderList: Array<SearchCategory>,
  filteredRecentSearches: Array<SearchItem>,
  showFilterBy?: boolean,
  showActionsToggle?: boolean
) {
  const searchResults: (SearchHeader | SearchItem)[] = [];
  const activeFilter = activeFilters.length > 0;
  const isActiveFilterByType = (categoryFilterType: FilterByType): boolean =>
    activeFilters.some(
      (currFilter) =>
        currFilter.filter.filterType === SearchFilterType.Category &&
        currFilter.filter.filterValue === categoryFilterType
    );
  const pushSearchItems = (header: string, itemsList: Array<SearchItem>, headerOptions?: Partial<SearchHeader>) => {
    if (itemsList.length > 0) {
      searchResults.push({
        itemType: SearchItemType.Header,
        subject: header,
        ...headerOptions
      } as SearchHeader);
      searchResults.push(...itemsList);
    }
  };
  const contactsFilter = isActiveFilterByType(FilterByType.People);
  const attachmentsFilter = isActiveFilterByType(FilterByType.Attachments);
  const labelsFilter = isActiveFilterByType(FilterByType.Labels);
  const foldersFilter = isActiveFilterByType(FilterByType.Folders);
  const isCategoryFilterActive = activeFilters.some(
    (currFilter) => currFilter.filter.filterType === SearchFilterType.Category
  );

  if (showFilterBy) {
    searchResults.push({
      itemType: SearchItemType.Header,
      subject: 'Filter by...'
    } as SearchHeader);
    searchResults.push(...filterRows);
  }

  if (!activeFilter && !query) {
    searchResults.push({
      itemType: SearchItemType.Header,
      subject: 'Search for...'
    } as SearchHeader);
    searchResults.push({
      itemType: SearchItemType.Category
    } as SearchCategory);
  }

  if (!activeFilter) {
    pushSearchItems('Recent searches', filteredRecentSearches);
  }

  if (!activeFilter) {
    pushSearchItems('Quick actions', actions, {
      headerItemType: SearchItemType.Action,
      showAllOptions: showActionsToggle,
      onClickText: actions.length > MAX_QUICK_ACTIONS_SHOWN ? 'View fewer' : 'View all'
    });
  }

  // Only show search suggestions for non category filter searches
  if (filters.length && !isCategoryFilterActive) {
    searchResults.push({
      itemType: SearchItemType.Header,
      subject: 'Narrow search'
    } as SearchHeader);
    searchResults.push(...filters);
  }

  if (skemails.length > 0) {
    const header = query.length || !!activeFilters.length ? RESULTS_HEADER : 'Recent messages';
    pushSearchItems(header, skemails, {
      headerItemType: SearchItemType.Skemail,
      showAllOptions: !!query.length, // Only show "View all" option if there is a search query
      onClickText: 'View all'
    });
  }

  if (contactsFilter) {
    pushSearchItems(RESULTS_HEADER, contactList);
  }

  if (attachmentsFilter) {
    pushSearchItems(RESULTS_HEADER, attachmentList);
  }

  if (labelsFilter) {
    pushSearchItems(RESULTS_HEADER, labelList);
  }

  if (foldersFilter) {
    pushSearchItems(RESULTS_HEADER, folderList);
  }
  return searchResults;
}

const filterAddresses = (addressFilter: SearchAddressFilter, results: IndexedSkemail[]) => {
  const { filterType, filterValue: address } = addressFilter;
  switch (filterType) {
    // "To" filter returns anything in To/CC/BCC
    case SearchFilterType.ToAddress:
      return results.filter((result) =>
        [...result.toAddresses, ...result.ccAddresses, ...result.bccAddresses].includes(address.address)
      );
    case SearchFilterType.FromMe:
    case SearchFilterType.FromAddress:
      return results.filter((result) => result.fromAddress === address.address);
    default:
      console.error('Address filter type not supported');
      return results;
  }
};

export const filterSearchResults = (searchResults: IndexedSkemail[], filters: SearchFilter[]) => {
  // Original, unfiltered results
  let results = searchResults;
  filters.forEach((filterItem) => {
    const { filter } = filterItem;
    const { filterType, filterValue } = filter;
    // Labels
    if (filterType === SearchFilterType.SystemLabel || filterType === SearchFilterType.UserLabel) {
      // Check if the label filter is in EITHER system or user labels,
      // in the future we can separate these for greater flexibility if desired
      results = results.filter((res) => res.userLabels.includes(filterValue) || res.systemLabels.includes(filterValue));
      // Addresses
    } else if (
      filterType === SearchFilterType.ToAddress ||
      filterType === SearchFilterType.FromAddress ||
      filterType === SearchFilterType.FromMe
    ) {
      results = filterAddresses(filter, results);
    } else if (filterType === SearchFilterType.HasAttachment) {
      results = results.filter((res) => !!res.attachments?.length);
    } else if (filterType === SearchFilterType.Date) {
      const now = dayjs();
      results = results.filter((res) => {
        const resDate = dayjs(res.createdAt);
        // we use filterValue.end - 1 because isBefore is a strict check so emails from a particular day are not marked as isBefore that day
        return (
          resDate.isAfter(now.subtract(filterValue.start, 'day'), 'day') &&
          resDate.isBefore(now.subtract(filterValue.end - 1, 'day'), 'day')
        );
      });
    }
  });

  return results;
};

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

export const hideFilters = (filters, filterTypesToHide) => {
  return filters.filter((filter) => !filterTypesToHide.includes(filter.filter.filterType));
};

/**
 * Utility function to get the rows of chips under "Filter by..."
 */
export function getFilterRows(filterTypesToHide: SearchFilterType[], defaultEmailAlias: string | undefined) {
  const hasAttachmentFilter: SearchFilter = {
    itemType: SearchItemType.Filter,
    subject: 'Has attachment',
    filter: { filterType: SearchFilterType.HasAttachment, filterValue: 'Has attachment' }
  };
  const fromMeFilter: SearchFilter[] = defaultEmailAlias
    ? [
        {
          itemType: SearchItemType.Filter,
          subject: 'From me',
          filter: {
            filterType: SearchFilterType.FromMe,
            filterValue: { address: defaultEmailAlias }
          }
        }
      ]
    : [];

  const firstFilterRow: SearchFilterRow = {
    itemType: SearchItemType.FilterRow,
    subject: '', // Subject does not matter for filter rows so we use an empty subject
    filters: hideFilters([hasAttachmentFilter, ...fromMeFilter], filterTypesToHide)
  };

  const dateFilters: SearchFilter[] = DATE_FILTERS.map((dateFilterValue): SearchFilter => {
    const { subject, start, end } = dateFilterValue;
    return {
      itemType: SearchItemType.Filter,
      subject,
      filter: {
        filterType: SearchFilterType.Date,
        filterValue: {
          start,
          end
        }
      }
    };
  });
  const secondFilterRow: SearchFilterRow = {
    itemType: SearchItemType.FilterRow,
    subject: '', // Subject does not matter for filter rows so we use an empty subject
    filters: hideFilters(dateFilters, filterTypesToHide)
  };
  const filterRows = [firstFilterRow, secondFilterRow].filter((row) => !!row.filters.length);
  return filterRows;
}

export function isActiveCategoryFilter(activeFilters: Array<SearchFilter>) {
  return activeFilters.some((filter) => filter.filter.filterType === SearchFilterType.Category);
}

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
