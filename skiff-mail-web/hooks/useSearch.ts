import { useEffect, useRef, useState } from 'react';

import { SearchFilter, SearchSkemail } from '../utils/searchWorkerUtils';
import useDebouncedAsyncCallback from './useDebouncedCallback';
import { getSearchWorker } from './useSearchWorker';

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

export const useSearch = () => {
  const [skemails, setSkemails] = useState<Array<SearchSkemail>>([]);
  const [recentSkemails, setRecentSkemails] = useState<Array<SearchSkemail>>([]);

  // need a ref because search is triggered by setTimeout, which does not get the latest state
  // read more about it: https://stackoverflow.com/questions/55198517/react-usestate-why-settimeout-function-does-not-have-latest-state-value
  const [query, setQuery] = useState('');

  // Labels, other activeFilters that can be applied along with plain text
  const [activeFilters, setActiveFilters] = useState<Array<SearchFilter>>([]);

  const queryRef = useRef(query);

  const [loading, setLoading] = useState(false);

  const searchWorker = getSearchWorker();
  const [workerSearch] = useDebouncedAsyncCallback(async (curQuery: string) => {
    const searchResults = (await searchWorker?.search(curQuery, activeFilters)) || [];
    setSkemails(searchResults);
    setLoading(false);
  }, SEARCH_UPDATE_INTERVAL);

  const search = () => {
    setLoading(true);
    void workerSearch(queryRef.current || '');
  };

  const reset = () => {
    setQuery('');
    queryRef.current = '';
    search();
  };

  // Populate recent skemails for an empty query
  useEffect(() => {
    const getRecentSkemails = async () => {
      const res = await searchWorker?.search('');
      setRecentSkemails(res || []);
    };
    void getRecentSkemails();
  }, [searchWorker]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  return {
    query,
    loading,
    skemails: query || activeFilters.length ? skemails : recentSkemails,
    activeFilters,
    reset,
    search,
    setQuery,
    setActiveFilters
  };
};
