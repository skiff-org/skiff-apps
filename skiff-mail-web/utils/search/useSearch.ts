import { useContext } from 'react';

import { SearchCategory, SearchContext } from './SearchProvider';
import { SearchItemType, SearchResult, LabelSearchResult, UserSearchResult } from './searchTypes';
import { useLabelSearch } from './useLabelSearch';
import { useSkemailSearch } from './useSkemailSearch';
import { useUserSearch } from './useUserSearch';

/**
 * useSearch returns search function that takes in a search string
 * The search function takes into account the current category / applied search modifiers
 * (which it gets from SearchProvider) and dispatches the appropriate search calls in order to populate
 * the result.
 * For example, if the user already has a "in: INBOX" modifier applied, we will not show any more results
 * under `Narrow search`.
 *
 * it also returns the `searchResults`, which is an array of the results to be rendered.
 */
export const useSearch = () => {
  const { searchResults, category, setSearchResults, setQuery, fullView } = useContext(SearchContext);

  const { search: skemailSearch } = useSkemailSearch();
  const { search: labelSearch } = useLabelSearch();
  const { search: userSearch } = useUserSearch();

  const search = async (searchStr: string) => {
    setQuery(searchStr);
    setSearchResults(undefined);
    const newSearchResults: SearchResult[] = [];
    // Search results
    // depending on the category, could be a list of emails, labels, folders, users.
    let categorySearchResults: SearchResult[] = [];
    const searchResultHeader: SearchResult = {
      type: SearchItemType.HEADER,
      label: 'Search results'
    };
    if (category === SearchCategory.SKEMAIL) {
      const skemailResults = await skemailSearch(searchStr);
      if (skemailResults?.length) {
        categorySearchResults = [...skemailResults];
        if (!fullView) {
          categorySearchResults.unshift(searchResultHeader);
        }
      }
    } else if (category === SearchCategory.LABEL) {
      const labelResults: LabelSearchResult[] | undefined = labelSearch(searchStr);
      if (labelResults?.length) {
        categorySearchResults = [searchResultHeader, ...labelResults];
      }
    } else if (category === SearchCategory.USER) {
      const userResults: UserSearchResult[] | undefined = userSearch(searchStr);
      if (userResults?.length) {
        categorySearchResults = [searchResultHeader, ...userResults];
      }
    }
    newSearchResults.push(...categorySearchResults);
    setSearchResults(newSearchResults);
    return newSearchResults;
  };

  return { searchResults, search };
};
