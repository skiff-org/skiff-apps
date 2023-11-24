import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import intersectionBy from 'lodash/intersectionBy';
import uniq from 'lodash/uniq';
import { MiniSearchResultBase } from 'skiff-front-search';
import { filterExists } from 'skiff-utils';

import {
  MatchInfo,
  MailboxSearchFilter,
  MailboxSearchFilterType,
  EditableMailboxSearchFilterType,
  EDITABLE_FILTER_TYPES,
  METADATA_FILTER_TYPES,
  MetadataFilterType,
  SearchResult,
  SkemailSearchResult,
  SearchItemType,
  FilterableSystemLabel
} from './searchTypes';

dayjs.extend(relativeTime);

export function normalizeQuery(searchStr: string): string {
  return searchStr.trim().toLowerCase();
}

type MergedMatchJustificationByID = Record<
  string,
  Pick<MiniSearchResultBase, 'match' | 'terms'> & { scores: number[] }
>;

/**
 * Merge two match objects.
 */
const mergeMatches = (existingMatch: MatchInfo, newMatch: MatchInfo): MatchInfo => {
  return Object.entries(newMatch).reduce(
    (acc, [term, fields]) => {
      acc[term] = Array.from(new Set([...(acc[term] || []), ...fields]));
      return acc;
    },
    { ...existingMatch }
  );
};

/**
 * Given a list of possibly duplicated results, where each duplicate has disparate info justifying its match for a given
 * set of search filters, merge the match info by ID, such that we can highlight all relevant info for a given email
 */
const mergeMatchJustification = (results: MiniSearchResultBase[]): MergedMatchJustificationByID => {
  return results.reduce((accumulator: MergedMatchJustificationByID, { match, id, score, terms }) => {
    const existingInfo = accumulator[id];
    if (existingInfo) {
      const { match: existingMatch, scores: existingScores, terms: existingTerms } = existingInfo;
      existingScores.push(score);
      return {
        ...accumulator,
        [id]: {
          ...existingInfo,
          match: mergeMatches(existingMatch, match),
          terms: uniq([...terms, ...existingTerms])
        }
      };
    }
    return {
      ...accumulator,
      [id]: { scores: [score], match, terms }
    };
  }, {});
};

export const intersectFilteredResultArrays = (
  filteredResultArrays: MiniSearchResultBase[][]
): MiniSearchResultBase[] => {
  // get the intersect of the results that matched any of the filters; note that this creates a problem:
  // the resulting array contains unique results whose matchInfo and scores correspond to only
  // *one* of the search filters. e.g. the matchInfo might specify a match on an address but
  // not a search string, even though the corresponding email was included because it matched on both;
  // we reverse this loss of information below
  const intersectedResults = intersectionBy(...filteredResultArrays, 'id');
  const intersectedIDs = intersectedResults.map((r) => r.id);

  // get all matching results, with no regard for duplication, given that each duplicate has a different reason for inclusion
  const allMatchingResults = filteredResultArrays.flat().filter((r) => intersectedIDs.includes(r.id));

  // aggregate the match criteria by ID
  const mergedMatchJustificationByID = mergeMatchJustification(allMatchingResults);

  // reconstitute the intersected results to include the aggregated match data
  return intersectedResults.map((r) => {
    const mergedJustification = mergedMatchJustificationByID[r.id];
    const scores = mergedJustification?.scores;
    const averageScoreAcrossMatches = scores?.length
      ? scores.reduce((total, num) => total + num, 0) / scores.length
      : 0;
    return {
      ...r,
      ...(mergedJustification
        ? {
            ...mergedJustification,
            score: averageScoreAcrossMatches
          }
        : {})
    };
  });
};

export const getSystemLabelFilters = (searchFilters: MailboxSearchFilter[]): FilterableSystemLabel[] => {
  return searchFilters
    .map((filter) => (filter.type === MailboxSearchFilterType.SYSTEM_LABEL ? filter.systemLabel : undefined))
    .filter(filterExists);
};

export const getUserLabelIDsFromFilters = (searchFilters: MailboxSearchFilter[]): string[] => {
  return searchFilters
    .map((filter) =>
      filter.type === MailboxSearchFilterType.USER_FOLDER_LABEL ||
      filter.type === MailboxSearchFilterType.USER_PLAIN_LABEL
        ? filter.userLabel.value
        : undefined
    )
    .filter(filterExists);
};

export const isSkemailSearchResult = (result: SearchResult): result is SkemailSearchResult =>
  result.type === SearchItemType.SKEMAIL_RESULT;

export const isEditableSearchFilterType = (type: MailboxSearchFilterType): type is EditableMailboxSearchFilterType =>
  EDITABLE_FILTER_TYPES.some((editableType) => editableType === type);

export const isMetadataFilterType = (type: MailboxSearchFilterType): type is MetadataFilterType =>
  METADATA_FILTER_TYPES.some((metadataType) => metadataType === type);

// some filters are associated with an attached search string that may differ / compound with the active input string in the search bar,
// while others merely narrow the target fields for that input string
export const getSearchStringFromMailboxFilter = (filter: MailboxSearchFilter, activeSearchInputString: string) => {
  switch (filter.type) {
    case MailboxSearchFilterType.FROM:
    case MailboxSearchFilterType.TO:
      return filter.addressObj.address;
    case MailboxSearchFilterType.SUBJECT:
    case MailboxSearchFilterType.BODY:
      return activeSearchInputString;
  }
};

export const getDateRangeFilter = (filters: MailboxSearchFilter[]) => {
  const dateFilter = filters?.find((searchFilter) => searchFilter.type === MailboxSearchFilterType.DATE);
  if (!dateFilter || dateFilter.type !== MailboxSearchFilterType.DATE) return; // redundant condition to keep typescript happy
  return dateFilter.range;
};
