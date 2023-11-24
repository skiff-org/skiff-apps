import { useEffect, useState } from 'react';
import { useGetSearchIndexProgressLazyQuery } from 'skiff-front-graphql';

const useGetSearchIndexProgressDate = (oldestDate: Date, newestData: Date) => {
  const [totalProgress, setTotalProgress] = useState(0);
  const [getSearchIndexProgress] = useGetSearchIndexProgressLazyQuery();

  useEffect(() => {
    const getProgress = async () => {
      const { data } = await getSearchIndexProgress({
        variables: {
          request: {
            oldestThreadUpdatedAtInIndex: oldestDate,
            newestThreadUpdatedAtInIndex: newestData
          }
        }
      });
      const { numThreadsIndexed } = data?.searchIndexProgress || {};
      if (!numThreadsIndexed) return;
      setTotalProgress(numThreadsIndexed);
    };
    void getProgress();
  }, []);

  return totalProgress;
};

export default useGetSearchIndexProgressDate;
