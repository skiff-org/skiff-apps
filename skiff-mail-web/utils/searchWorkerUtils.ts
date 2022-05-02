import { IconProps } from '@skiff-org/skiff-ui';
import MiniSearch from 'minisearch';

import { AddressObject } from '../generated/graphql';
import { generateSymmetricKey } from './crypto/v1/utils';

export enum SearchItemType {
  Document = 'DOCUMENT',
  Action = 'ACTION',
  Header = 'HEADER',
  Skemail = 'SKEMAIL',
  Filter = 'FILTER'
}

interface SearchItemBase {
  itemType: string;
  subject: string;
}

/**
 * A kind of abbreviated Skemail.
 */
export interface SearchSkemail extends SearchItemBase {
  itemType: SearchItemType.Skemail;
  id: string;
  threadID: string;
  content: string;
  createdAt: number;
  to: AddressObject[];
  cc: AddressObject[];
  bcc: AddressObject[];
  from: AddressObject;
  systemLabels: string[];
  userLabels: string[];
  read: boolean;
}

export interface SearchAction extends SearchItemBase {
  itemType: SearchItemType.Action;
  iconProps: IconProps;
  onClick: () => void;
  cmdTooltip?: string;
}

export interface SearchHeader extends SearchItemBase {
  itemType: SearchItemType.Header;
}

export type SearchItem = SearchAction | SearchSkemail | SearchFilter | SearchHeader;

export type SearchIndexSymmetricKey = string;

/** Search Filters */

export enum SearchFilterType {
  SystemLabel = 'SYSTEM_LABEL',
  UserLabel = 'USER_LABEL',
  // Filters through To/CC/BCC
  ToAddress = 'TO_ADDRESS',
  FromAddress = 'FROM_ADDRESS'
}

interface SearchFilterBase {
  filterType: SearchFilterType;
  filterValue: unknown;
}

/** Label Types */
export type SearchSystemLabel = string;
export type SearchUserLabel = string;

export type SearchLabel = SearchSystemLabel | SearchUserLabel;
// Combined for now, but we can separate in the future if we need to differentiate
export type SearchLabelType = SearchFilterType.SystemLabel | SearchFilterType.UserLabel;

/** Address Types */
export type SearchAddress = AddressObject;

export type SearchAddressType = SearchFilterType.ToAddress | SearchFilterType.FromAddress;

export interface SearchLabelFilter extends SearchFilterBase {
  filterType: SearchLabelType;
  filterValue: SearchLabel;
}

export interface SearchAddressFilter extends SearchFilterBase {
  filterType: SearchAddressType;
  filterValue: SearchAddress;
}

export interface SearchFilter extends SearchItemBase {
  itemType: SearchItemType.Filter;
  subject: string;
  filter: SearchAddressFilter | SearchLabelFilter;
}

interface SearchElements {
  miniSearch: MiniSearch<SearchSkemail>;
  skemailMap: Record<string, SearchSkemail>; // record of indexed items for add/removal
}

/**
 * A search index and the symmetric key that will encrypt it for preservation in
 * localStorage
 */
export interface SearchData {
  symmetricKey: SearchIndexSymmetricKey;
  searchIndex: SearchElements;
}

/**
 * The information used to serialize a search index.
 * Contains an asymmetric key-encrypted symmetric key, and an encrypted,
 * serialized index, which is encrypted with that key.
 */
export interface EncryptedSearchData {
  encryptedKey: string;
  encryptedEmailIndex: string;
}

/**
 * The fields to index in the search index.
 */
export const MINI_SEARCH_FIELDS = ['subject', 'content', 'to', 'cc', 'bcc', 'from'];

/**
 * This function creates a search index and symmetric key
 * @return {SearchData} a new search index and symmetric key
 */
export function createSearchData(): SearchData {
  const miniSearch = new MiniSearch({
    fields: MINI_SEARCH_FIELDS,
    storeFields: ['subject', 'lastUpdated'] // fields to return with search results
  });
  return {
    symmetricKey: generateSymmetricKey(),
    searchIndex: {
      miniSearch,
      skemailMap: {}
    }
  };
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
  actions: Array<SearchItem>,
  skemails: Array<SearchItem>,
  filters: Array<SearchItem>
) {
  const searchResults: (SearchHeader | SearchItem)[] = [];

  if (actions.length > 0) {
    searchResults.push({
      itemType: SearchItemType.Header,
      subject: 'Quick actions'
    } as SearchHeader);
  }
  searchResults.push(...actions);

  if (filters.length > 0) {
    searchResults.push({
      itemType: SearchItemType.Header,
      subject: 'Narrow Search'
    } as SearchHeader);
  }
  searchResults.push(...filters);

  if (skemails.length > 0) {
    searchResults.push({
      itemType: SearchItemType.Header,
      subject: 'Search Results'
    } as SearchHeader);
  }
  searchResults.push(...skemails);

  return searchResults;
}
