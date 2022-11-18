import { useContext } from 'react';
import { trimAndLowercase } from 'skiff-utils';

import { getSearchWorker } from '../../hooks/useSearchWorker';

import { getFilterFromModifier } from './searchModifiers';
import { SearchContext } from './SearchProvider';
import { SkemailSearchResult, SearchItemType } from './searchTypes';

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

export const useSkemailSearch = () => {
  const { modifierType, modifierValue } = useContext(SearchContext);

  const workerSearch = async (query: string): Promise<SkemailSearchResult[] | undefined> => {
    const searchString = trimAndLowercase(query);
    if (!searchString) {
      return;
    }

    const filterFn = getFilterFromModifier(modifierType, modifierValue);
    const searchWorker = getSearchWorker();
    let searchResults = (await searchWorker?.search(searchString)) ?? [];
    if (filterFn) {
      searchResults = searchResults.filter(filterFn);
    }

    return searchResults.map((result) => ({
      type: SearchItemType.SKEMAIL_RESULT,
      ...result
    }));
  };

  return { search: workerSearch };
};
