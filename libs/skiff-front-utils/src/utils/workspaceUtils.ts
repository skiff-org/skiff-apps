import { GetOrganizationQueryResult } from 'skiff-front-graphql';
import { PermissionLevel } from 'skiff-graphql';

export const currentUserIsWorkspaceAdmin = (
  org: NonNullable<GetOrganizationQueryResult['data']>['organization'] | undefined
): boolean => {
  return org?.everyoneTeam?.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;
};
