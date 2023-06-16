import { PublicData, PublicKey, UserCalendar } from 'skiff-graphql';

import { UserProfileDataFragment } from '../../generated/graphql';
export type UserID = string;

/**
 * VerifiedKeys stores a map from other users' usernames to their public signing keys
 * and a timestamp for when that map was last changed
 */
export interface VerifiedKeys {
  lastVerifiedDate: string;
  keys: Record<string, string>;
}

/**
 * PrivateDocumentData stores a user's private (encrypted) data for their documents.
 * VerifiedKeys stores a map from other users' usernames to their public signing keys.
 * This map is needed for marking users as verified.
 * lastVerified is the ISO format string representing the last time the verifiedKeys
 * were changed.
 */
export interface PrivateDocumentData {
  verifiedKeys: VerifiedKeys;
  recoveryBrowserShare: string;
}

// Duplicate from editor-mvp, consolidate after migration
export interface PrivateUserData {
  privateKey: string;
  signingPrivateKey: string;
  documentKey: string; // used to encrypt PrivateDocumentData
}
export interface User extends Omit<UserProfileDataFragment, 'publicKey' | 'publicData'> {
  userID: UserID;
  username: string;
  privateUserData: PrivateUserData;
  passwordDerivedSecret: string;
  publicKey: PublicKey;
  privateDocumentData: PrivateDocumentData;
  signingPublicKey: string;
  rootOrgID: string;
  publicData?: PublicData; // make optional for safety
  encryptedMetamaskSecret?: string;
  walletAddress?: string;
  recoveryEmail?: string | null;
  unverifiedRecoveryEmail?: string | null;
  primaryCalendar?: {
    calendarID: string;
  };
  calendars?: UserCalendar[];
  defaultEmailAlias?: string;
  // jwt token, which is used for socket handshake
  jwt?: string;
}
