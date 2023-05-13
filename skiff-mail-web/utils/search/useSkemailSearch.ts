import { trimAndLowercase } from 'skiff-utils';

import { getSearchWorker } from '../../hooks/useSearchWorker';

import { SearchItemType } from './searchTypes';

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

export const useSkemailSearch = () => {
  const workerSearch = async (query: string) => {
    const searchString = trimAndLowercase(query);
    if (!searchString) {
      return;
    }

    const searchWorker = getSearchWorker();
    const searchResults = (await searchWorker?.search(searchString, undefined, false, true)) ?? []; // sort results by updatedAt

    return searchResults.map((result) => ({
      type: SearchItemType.SKEMAIL_RESULT,
      ...result
    }));
  };

  return { search: workerSearch };
};
