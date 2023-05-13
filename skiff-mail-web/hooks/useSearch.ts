import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedAsyncCallback } from 'skiff-front-utils';

import { getSearchWorker } from './useSearchWorker';

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

// The number of to and from results to show if  query length is less than MIN_SPECIFIED_QUERY_LENGTH
export const UNSPECIFIED_TO_FROM_LENGTH = 2;

export const useSearch = () => {
  const [resultThreadEmailIds, setResultThreadEmailIds] = useState<Array<{ emailID: string; threadID: string }>>([]);

  // need a ref because search is triggered by setTimeout, which does not get the latest state
  // read more about it: https://stackoverflow.com/questions/55198517/react-usestate-why-settimeout-function-does-not-have-latest-state-value
  const [query, setQuery] = useState('');
  const queryRef = useRef(query);

  const [loading, setLoading] = useState(false);

  const [workerSearch] = useDebouncedAsyncCallback(async (currentQuery: string) => {
    if (!currentQuery) {
      setResultThreadEmailIds([]);
      return;
    }
    const searchIds = (await getSearchWorker()?.search(currentQuery, { fuzzy: 0 }, false, true)) || []; // sort
    // set to threadID/emailID pairs
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    setResultThreadEmailIds(searchIds.map((elem) => ({ emailID: elem.id, threadID: elem.threadID })));

    setLoading(false);
  }, SEARCH_UPDATE_INTERVAL);

  const search = () => {
    setLoading(true);
    void workerSearch(query);
  };

  const reset = () => {
    setQuery('');
    queryRef.current = '';
    void workerSearch('');
  };

  // Search specifically for `currentQuery`, while updating state.
  // Useful in the case where we need to ensure searching for a
  // specific result and cannot wait for a rerender.
  const searchForQuery = useCallback(
    (currentQuery: string) => {
      setQuery(currentQuery);
      queryRef.current = currentQuery;
      void workerSearch(currentQuery);
    },
    [workerSearch]
  );

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  return {
    query,
    loading,
    resultThreadEmailIds,
    reset,
    search,
    setQuery,
    searchForQuery
  };
};
