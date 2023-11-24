import { useFilteredThreadIDsLazyQuery } from 'skiff-front-graphql';
import {
  IndexedItemBase,
  MiniSearchResultBase,
  SearchClient,
  chronSortResults,
  isMiniSearchResultBase,
  isSkemailMiniSearchResult,
  smartSortResults
} from 'skiff-front-search';
import { AscDesc } from 'skiff-graphql';
import { filterExists, trimAndLowercase } from 'skiff-utils';

import { getSearchWorker } from '../../hooks/useSearchWorker';

import { SearchSortOrder } from './SearchProvider';
import {
  FieldNarrowingSearchFilter,
  MailboxSearchFilter,
  MailboxSearchFilterType,
  SearchItemType,
  SkemailSearchResult
} from './searchTypes';
import {
  getDateRangeFilter,
  getSearchStringFromMailboxFilter,
  getSystemLabelFilters,
  getUserLabelIDsFromFilters,
  intersectFilteredResultArrays
} from './searchUtils';

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

export const FROM_RELATED_FIELDS = ['fromAddress', 'from'];
export const TO_RELATED_FIELDS = ['toAddresses', 'to', 'ccAddresses', 'cc', 'bccAddresses', 'bcc'];
export const CONTENT_RELATED_FIELDS = ['subject', 'content'];

const SEARCH_FIELDS_BY_FILTER_TYPE: Record<FieldNarrowingSearchFilter, string[]> = {
  [MailboxSearchFilterType.FROM]: FROM_RELATED_FIELDS,
  [MailboxSearchFilterType.TO]: TO_RELATED_FIELDS,
  [MailboxSearchFilterType.SUBJECT]: ['subject'],
  [MailboxSearchFilterType.BODY]: ['content']
};

const sortSearchByOrder = (results: MiniSearchResultBase[], sortOrder?: SearchSortOrder) => {
  switch (sortOrder) {
    case SearchSortOrder.Relevance:
      return smartSortResults(results);
    case SearchSortOrder.Asc:
      return chronSortResults(results, AscDesc.Asc);
    case SearchSortOrder.Desc:
      return chronSortResults(results);
    default:
      return smartSortResults(results);
  }
}

export const useSkemailSearch = () => {

  const [getFilteredThreadIDs] = useFilteredThreadIDsLazyQuery();

  const normalizeResults = (results: IndexedItemBase[]): SkemailSearchResult[] => {
    return results.filter(isSkemailMiniSearchResult).map((result) => ({
      type: SearchItemType.SKEMAIL_RESULT,
      emailID: result.id,
      ...result
    }));
  };


  const workerSearch = async (
    query: string,
    searchFilters?: MailboxSearchFilter[],
    autoSuggest?: boolean,
    searchSortOrder?: SearchSortOrder
  ): Promise<SkemailSearchResult[] | undefined> => {
    const searchString = trimAndLowercase(query);
    if (!searchString && !searchFilters?.length) {
      return;
    }
    const sortAndNormalizeResults = (results: MiniSearchResultBase[]) => normalizeResults(sortSearchByOrder(results, searchSortOrder));
    const searchWorker = getSearchWorker();
    const hasSearchFilters = !!searchFilters?.length;
    const dateRangeFilter = hasSearchFilters ? getDateRangeFilter(searchFilters) : undefined;
    // whether there is a filter that specifies which fields to search on (e.g. "From"), versus merely how to filter on metadata
    const hasFieldNarrowingSearchFilter = !!searchFilters?.some(
      (filter) => !!SEARCH_FIELDS_BY_FILTER_TYPE[filter.type]
    );

    const performSearch = async (queryString: string, fields?: string[]) => {
      const results =
        (await searchWorker?.search(
          queryString,
          SearchClient.SKEMAIL,
          fields ? { fields } : undefined,
          dateRangeFilter, // date range filtering function must be added to search options by the web worker
          false,
          autoSuggest,
          true // preferentially return results matching on all terms in query
        )) ?? [];
      return results.filter(isMiniSearchResultBase);
    };

    const getFilteredResults = async (filterType: FieldNarrowingSearchFilter) => {
      const filter = searchFilters?.find((searchFilter) => searchFilter.type === filterType);
      // we return undefined rather than an empty array, because we do not want to intersect an empty array *unless* there were really no results for this filter;
      // in other words, an empty array is reserved to mean: "filter was applied and nothing matched"
      if (!filter) return;
      // for some frontend filters, the query string is attached to the filter (i.e. addresses) and for others we use the input string in the search bar
      const filterSpecificSearchString = getSearchStringFromMailboxFilter(filter, query);
      // if there *is* a filter, but there is *not* a corresponding query string (e.g., they filtered "in Subject" with no search input), return undefined;
      // this means that if there are multiple filters applied and one of them matches nothing in principle, we will disregard it rather than return nothing
      if (!filterSpecificSearchString) return;
      return performSearch(filterSpecificSearchString, SEARCH_FIELDS_BY_FILTER_TYPE[filterType]);
    };

    if (!searchFilters?.length) {
      const defaultResults = await performSearch(searchString);
      return sortAndNormalizeResults(defaultResults);
    }
    const fromResults = await getFilteredResults(MailboxSearchFilterType.FROM);
    const toResults = await getFilteredResults(MailboxSearchFilterType.TO);
    const subjectResults = await getFilteredResults(MailboxSearchFilterType.SUBJECT);
    const bodyResults = await getFilteredResults(MailboxSearchFilterType.BODY);
    // get the results that match the search string — if provided and if content-related filters not specified — in the subject or body fields
    let basicSearchStringResults: MiniSearchResultBase[] | undefined = undefined;
    if (searchString && !subjectResults && !bodyResults) {
      basicSearchStringResults = await performSearch(
        searchString,
        // if any field-narrowing filters are provided, search for the search string only within content-related fields;
        // in other words, we no longer default to searching the string on all fields when a user has opted to narrow their search.
        // in the case that no field-narrowing filter is provided (e.g. user is filtering only on date or system label), we
        // search the string on all fields
        hasFieldNarrowingSearchFilter ? CONTENT_RELATED_FIELDS : undefined
      );
    }

    const filteredResultArrays = [fromResults, toResults, subjectResults, bodyResults, basicSearchStringResults].filter(
      filterExists
    );
    const intersectionWithMergedJustification = intersectFilteredResultArrays(filteredResultArrays);

    // no results matched provided filters
    if (!intersectionWithMergedJustification.length) return;

    const systemLabelFilters = getSystemLabelFilters(searchFilters);
    const userLabelIDFilters = getUserLabelIDsFromFilters(searchFilters);

    if (!systemLabelFilters.length && !userLabelIDFilters.length) {
      // *after* the match criteria have been aggregated, sort the results according to relevancy
      return sortAndNormalizeResults(intersectionWithMergedJustification);
    }

    // if there are backend-specific filters applied (e.g. labels), we apply them to the already filtered results
    const frontendFilteredThreads = intersectionWithMergedJustification.filter(isSkemailMiniSearchResult);
    const frontendFilteredThreadIDs = frontendFilteredThreads.map((result) => result.threadID);

    const { data, error } = await getFilteredThreadIDs({
      variables: {
        request: {
          threadIDs: frontendFilteredThreadIDs,
          systemLabels: systemLabelFilters,
          userLabelIDs: userLabelIDFilters
        }
      }
    });

    if (!data || error) {
      console.error('error in getting filtered threads', error);
      if (!data) return;
    }
    const backendFilteredThreadIDs = data.filteredThreadIDs.threadIDs;
    const backendFilteredResultIDs = frontendFilteredThreads
      .filter((thread) => backendFilteredThreadIDs.includes(thread.threadID))
      .map((result) => result.id);

    return sortAndNormalizeResults(
      intersectionWithMergedJustification.filter((result) => backendFilteredResultIDs.includes(result.id))
    );
  };
  return { search: workerSearch };
};
