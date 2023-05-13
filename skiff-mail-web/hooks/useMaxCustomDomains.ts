import { useEffect, useState } from 'react';
import { getMaxCustomDomains } from 'skiff-utils';

import { getTierName } from '../utils/userUtils';

export const useMaxCustomDomains = () => {
  const [maxCustomDomains, setMaxCustomDomains] = useState<number | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMaxCustomDomains = async () => {
      setLoading(true);
      try {
        const tier = await getTierName();
        const fetchedMaxCustomDomain = getMaxCustomDomains(tier);
        setMaxCustomDomains(fetchedMaxCustomDomain);
      } catch (e) {
        console.error('Failed to retrieve users max custom domains', e);
      }

      setLoading(false);
    };
    void fetchMaxCustomDomains();
  }, []);

  return { maxCustomDomains, loading };
};
