import { PermissionLevel } from 'skiff-graphql';
import { PaywallErrorCode } from 'skiff-utils';

export interface ShareDocWithUsersReturn {
  shareSucceeded?: boolean;
  paywallErrorCode?: PaywallErrorCode;
}

export interface ShareDocWithUsersRequest {
  userEmailOrID: string;
  permissionLevel: PermissionLevel;
}

export type ExpireEntry = {
  newDate: Date | null;
  collabUserID: string;
  permissionLevel: PermissionLevel;
};
