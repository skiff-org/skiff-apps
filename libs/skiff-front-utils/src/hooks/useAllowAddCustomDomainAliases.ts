import { useFlags } from 'launchdarkly-react-client-sdk';
import { useGetOrganizationQuery } from 'skiff-front-graphql';
import { PermissionLevel } from 'skiff-graphql';

import { useRequiredCurrentUserData } from '../apollo';

export const useAllowAddCustomDomainAliases = () => {
  const { rootOrgID } = useRequiredCurrentUserData();

  const featureFlags = useFlags();
  const targetedOrgs = (featureFlags.adminOnlyCustomDomainAliasOrgs as string[]) || [];

  const { data: activeOrg } = useGetOrganizationQuery({
    variables: { id: rootOrgID }
  });

  return (
    !targetedOrgs.includes(rootOrgID) ||
    activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin
  );
};

export default useAllowAddCustomDomainAliases;
