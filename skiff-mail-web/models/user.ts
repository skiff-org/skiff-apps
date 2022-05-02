import { PublicKeyWithSignature, PublicData, UserProfileDataFragment } from '../generated/graphql';

export type UserID = string;

// Duplicate from editor-mvp, consolidate after migration
export interface PrivateUserData {
  privateKey: string;
  signingPrivateKey: string;
  documentKey: string; // used to encrypt PrivateDocumentData
}
export interface User extends Omit<UserProfileDataFragment, 'publicKey' | 'publicData'> {
  privateUserData: PrivateUserData;
  publicKey: PublicKeyWithSignature;
  signingPublicKey: string;
  publicData?: PublicData; // make optional for safety
}
