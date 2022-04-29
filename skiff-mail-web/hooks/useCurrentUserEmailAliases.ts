import { useGetCurrentUserEmailAliasesQuery } from '../generated/graphql';

export function useCurrentUserEmailAliases() {
  const { data } = useGetCurrentUserEmailAliasesQuery();
  return data?.currentUser?.emailAliases ?? [];
}
