import { useMemo } from 'react';
import { useGetCurrentUserCustomDomainsQuery } from 'skiff-front-graphql';
import { CustomDomainStatus } from 'skiff-utils';

const useAvailableCustomDomains = () => {
  const { data } = useGetCurrentUserCustomDomainsQuery();
  const domains = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.getCurrentUserCustomDomains.domains
      .filter((domain) => domain.verificationStatus === CustomDomainStatus.VERIFIED)
      .map(({ domain }) => domain);
  }, [data]);
  return domains;
};

export default useAvailableCustomDomains;
