import { gunzipSync, gzipSync } from 'fflate';
import * as IDB from 'idb-keyval';
import { debounce, isEqual, orderBy, uniqBy } from 'lodash';
import MiniSearch, { AsPlainObject } from 'minisearch';
import { Range } from 'semver';

import { AddressObject } from '../generated/graphql';
import { User, UserID } from '../models/user';
import { Datagram } from './crypto/v1/lib/aead/common';
import { utf8BytesToString, utf8StringToBytes } from './crypto/v1/lib/utf8';
import {
  decryptSymmetric,
  encryptSymmetric,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric
} from './crypto/v1/utils';
import {
  createSearchData,
  EncryptedSearchData,
  MINI_SEARCH_FIELDS,
  SearchAddressFilter,
  SearchData,
  SearchFilter,
  SearchFilterType,
  SearchSkemail
} from './searchWorkerUtils';
import { SkemailStorageTypes } from './storageUtils';
import { assertExists } from './typeUtils';

interface SearchDataState {
  searchData: SearchData;
  user: User;
}

let state: SearchDataState | null = null;

// same structure as editor IDB key, but different constant
function searchIndexStorageKey(userID: UserID): string {
  return `${userID}:${SkemailStorageTypes.SEARCH_INDEX}:`;
}

// JSON-ified Miniserach index
interface JSONSearchElements {
  plainObject: AsPlainObject;
  skemailMap: Record<string, SearchSkemail>;
}

/**
 * The current version of the search index to store in people's localStorage
 */
const emailIndexVersion = '0.3.0';
/**
 * The version constraint for search indices. If a search index doesn't match
 * the version constraint, we will delete it and reinitialize with the current
 * version
 */
const emailIndexVersionConstraint = new Range('0.3.*');

/**
 * Datagram for storing encrypted email search index.
 */
const EmailSearchIndexDatagram: Datagram<JSONSearchElements> = {
  type: 'ddl://skiff/EmailSearchIndexDatagram',
  version: emailIndexVersion,
  versionConstraint: emailIndexVersionConstraint,
  serialize(data) {
    return gzipSync(utf8StringToBytes(JSON.stringify(data)));
  },
  deserialize(data) {
    return JSON.parse(utf8BytesToString(gunzipSync(data)));
  }
};

/**
 * Encrypt email index and key using userData.
 */
function encryptSearchIndex(searchData: SearchData, user: User): EncryptedSearchData {
  const { searchIndex, symmetricKey } = searchData;
  const {
    publicKey,
    privateUserData: { privateKey }
  } = user;
  const serialized = {
    plainObject: searchIndex.miniSearch.toJSON(),
    skemailMap: searchData.searchIndex.skemailMap
  };
  const encryptedEmailIndex = encryptSymmetric(serialized, symmetricKey, EmailSearchIndexDatagram);

  const encryptedKey = stringEncryptAsymmetric(privateKey, publicKey, symmetricKey);

  return { encryptedKey, encryptedEmailIndex };
}

/**
 * Decrypt email index stored in IDB given user data.
 */
function decryptSearchIndex(encryptedSearchData: EncryptedSearchData, user: User): SearchData | null {
  const { encryptedEmailIndex, encryptedKey } = encryptedSearchData;

  const {
    publicKey,
    privateUserData: { privateKey }
  } = user;

  try {
    const symmetricKey = stringDecryptAsymmetric(privateKey, publicKey, encryptedKey);

    const serialized = decryptSymmetric(encryptedEmailIndex, symmetricKey, EmailSearchIndexDatagram);
    const { plainObject, skemailMap } = serialized;
    const miniSearch = MiniSearch.loadJSON(JSON.stringify(plainObject), {
      fields: MINI_SEARCH_FIELDS
    });

    return {
      symmetricKey,
      searchIndex: {
        miniSearch,
        skemailMap
      }
    };
  } catch (error: any) {
    // If decryption failed...
    // Print the error
    console.error(error);
    // And return null
    // Will cause new search index to be created
    return null;
  }
}

// Load search data from IDB
async function loadSearchData(user: User): Promise<SearchData | null> {
  const searchIndexKey = searchIndexStorageKey(user.userID);
  const encryptedSearchData: EncryptedSearchData | undefined = await IDB.get(searchIndexKey);

  if (encryptedSearchData) {
    return decryptSearchIndex(encryptedSearchData, user);
  }
  // remove from storage if failed
  await IDB.del(searchIndexKey);
  return null;
}

// Save search data to IDB; debounced
const saveSearchData = debounce(
  async (curState: SearchDataState) => {
    await IDB.set(searchIndexStorageKey(curState.user.userID), encryptSearchIndex(curState.searchData, curState.user));
  },
  5_000,
  {
    maxWait: 30_000 // save every 30s max
  }
);

// Setup search index by either loading from IDB or creating a new one
export async function setup(user: User) {
  state = {
    searchData: (await loadSearchData(user)) || createSearchData(),
    user
  };

  void saveSearchData(state);
}

// Check if the skemail is indexed with current value
export function isIndexedWithCurrentValues(searchSkemail: SearchSkemail) {
  if (!state) return false;
  const { searchIndex } = state.searchData;
  if (!(searchSkemail.id in searchIndex.skemailMap)) return false;
  const indexedSkemail = searchIndex.skemailMap[searchSkemail.id];
  return isEqual(searchSkemail, indexedSkemail);
}

// Add to search index and save
export async function add(searchSkemail: SearchSkemail) {
  assertExists(state);
  const { searchIndex } = state.searchData;
  if (searchSkemail.id in searchIndex.skemailMap) {
    const indexedSkemail = searchIndex.skemailMap[searchSkemail.id];
    if (isEqual(searchSkemail, indexedSkemail)) {
      return;
    } else {
      searchIndex.miniSearch.remove(indexedSkemail);
    }
  }
  searchIndex.miniSearch.add(searchSkemail);
  searchIndex.skemailMap[searchSkemail.id] = searchSkemail;
  void saveSearchData(state);
}

// Remove from search index and skemailMap
export async function remove(skemailID: string) {
  assertExists(state);
  const docObj = state.searchData.searchIndex.skemailMap[skemailID];
  if (!docObj) return;
  try {
    state.searchData.searchIndex.miniSearch.remove(docObj);
  } catch (error) {
    console.error(error);
  }
  delete state.searchData.searchIndex.skemailMap[skemailID];
}

/*
 * Check if an array of address objs contains an equivalent address
 */
const includesAddress = (addresses: AddressObject[], targetAddress: AddressObject) =>
  // Open question: Do we want to just return on equal names as well
  addresses.some((addr) => addr.address === targetAddress.address);

const filterAddresses = (addressFilter: SearchAddressFilter, results: SearchSkemail[]) => {
  const { filterType, filterValue: address } = addressFilter;
  switch (filterType) {
    // "To" filter returns anything in To/CC/BCC
    case SearchFilterType.ToAddress:
      return results.filter((result) => includesAddress([...result.to, ...result.cc, ...result.bcc], address));
    case SearchFilterType.FromAddress:
      return results.filter((result) => result.from.address === address.address);
    default:
      console.error('Address filter type not supported');
      return results;
  }
};

const filterResults = (searchResults: SearchSkemail[], filters: SearchFilter[]) => {
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
    } else if (filterType === SearchFilterType.ToAddress || filterType === SearchFilterType.FromAddress) {
      results = filterAddresses(filter, results);
    }
  });

  return results;
};

// Get most recent search results
const getRecentSkemailsFromIndex = (filters: SearchFilter[]) => {
  if (!state) return [];
  const skemailMap = state.searchData.searchIndex.skemailMap;
  const orderedSkemails = orderBy(Object.values(skemailMap), ['createdAt'], ['desc']);
  return filterResults(orderedSkemails, filters).slice(0, 20);
};

// Run search query and filter results
export async function search(query: string, filters: SearchFilter[] = []): Promise<SearchSkemail[]> {
  assertExists(state);
  if (!query) {
    return getRecentSkemailsFromIndex(filters);
  }
  const skemailMap = state.searchData.searchIndex.skemailMap;

  const searchResults = state.searchData.searchIndex.miniSearch.search(query, {
    fuzzy: true,
    prefix: true
  });

  const skemails = uniqBy(searchResults, (doc) => doc.id)
    .map((res) => skemailMap[res.id])
    .filter(Boolean)
    .map((item) => item!);

  const filteredResults = filterResults(skemails, filters);

  const subjectResults = filteredResults.filter((result) => result.subject.toLowerCase().includes(query.toLowerCase()));

  const orderedResults = [...subjectResults, ...filteredResults.filter((result) => !subjectResults.includes(result))];

  return orderedResults;
}

export async function teardown() {
  state = null;
}
