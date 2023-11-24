import { PermissionLevel } from 'skiff-graphql';

import useCurrentOrganization from './useCurrentOrganization';

export default function useCurrentUserIsOrgAdmin() {
  const { data: activeOrg } = useCurrentOrganization();
  const currPermissionLevel = activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel;
  if (!currPermissionLevel) return undefined;
  return activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;
}
