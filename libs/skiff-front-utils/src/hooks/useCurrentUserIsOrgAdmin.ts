import { PermissionLevel } from 'skiff-graphql';

import useCurrentOrganization from './useCurrentOrganization';

export default function useCurrentUserIsOrgAdmin() {
  const { data: activeOrg } = useCurrentOrganization();
  return activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;
}
