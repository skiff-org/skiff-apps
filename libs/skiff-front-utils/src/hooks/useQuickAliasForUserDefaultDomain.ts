import { useGetQuickAliasRootDomainsForUserQuery } from 'skiff-front-graphql';

const useQuickAliasForUserDefaultDomain = () => {
  const { data, loading } = useGetQuickAliasRootDomainsForUserQuery();
  const rootDomains = data?.getQuickAliasRootDomainsForUser || [];
  const defaultDomain = rootDomains[0] || ''; // default is just first for now
  return { data: defaultDomain, loading };
};

export default useQuickAliasForUserDefaultDomain;
