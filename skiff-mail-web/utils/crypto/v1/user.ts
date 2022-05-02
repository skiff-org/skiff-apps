// eslint-disable-next-line max-classes-per-file
import { v4 as uuidv4 } from 'uuid';

import { PublicData, SignatureContext } from '../../../generated/graphql';
import { User } from '../../../models/user';
import { getStorageKey, SkemailStorageTypes } from '../../storageUtils';
import { createJSONWrapperDatagram } from './lib/datagramClasses';
import {
  createDetachedSignatureAsymmetric,
  decryptSymmetric,
  encryptSymmetric,
  generatePublicPrivateKeyPair,
  generateSymmetricKey,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric,
  verifyDetachedSignatureAsymmetric
} from './utils';

export type UserID = string;
export const USER_NOT_FOUND = 'A user';
type PublicKey = {
  key: string;
  signature: string;
};
/**
 * Data on another user stored in activeUsers.
 */
export interface UserProfileData {
  lastSeen?: Date;
  username?: string;
  publicData?: PublicData;
}

/**
 * Interface for document data stored inside a user's private document data.
 */
export interface StoredDocumentData {
  eventTime: number; // timestamp of last document event stored, used for unread status of document event
}

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
  documentData: { [docID: string]: StoredDocumentData };
  verifiedKeys: VerifiedKeys;
  recoveryBrowserShare: string;
}

/**
 * Empty document data.
 */
export const EMPTY_DOCUMENT_DATA: PrivateDocumentData = {
  documentData: {},
  verifiedKeys: {
    keys: {},
    lastVerifiedDate: ''
  },
  recoveryBrowserShare: ''
};

/**
 * PrivateUserData stores a user's sensitive account encryption/signing keys.
 */
export interface PrivateUserData {
  privateKey: string;
  signingPrivateKey: string;
  documentKey: string; // used to encrypt PrivateDocumentData
}

/**
 * Verify user's encryption and signing key pairs.
 * @param {User} userObj - User object containing keypairs.
 * @returns {Promise<boolean>} Whether keypairs validated.
 */
export async function validateKeyPairs(userObj: any): Promise<boolean> {
  const { privateUserData } = userObj;
  const { signingPrivateKey } = privateUserData;
  const { publicKey, signingPublicKey } = userObj;
  const { key, signature } = publicKey;
  // make sure encryption key is properly bound to signing key
  const encryptionKeyValid = await verifyDetachedSignatureAsymmetric(
    key,
    signature,
    signingPublicKey,
    SignatureContext.UserPublicKey
  );
  if (!encryptionKeyValid) {
    return false;
  }
  // ensure signing public and private keys are a valid keypair
  const testSignatureData = uuidv4();
  const testSignature = await createDetachedSignatureAsymmetric(
    testSignatureData,
    signingPrivateKey,
    SignatureContext.SessionKey // arbitrary signature context
  );
  const validSigningKeypair = await verifyDetachedSignatureAsymmetric(
    testSignatureData,
    testSignature,
    signingPublicKey,
    SignatureContext.SessionKey
  );
  return validSigningKeypair;
}

/**
 * PrivateUserDataDatagram stores a user's end-to-end encrypted user data.
 */
export const PrivateUserDataDatagram = createJSONWrapperDatagram<PrivateUserData>(
  'ddl://skiff/PrivateUserDataDatagram'
);

/**
 * PrivateDocumentDataDatagram stores a user's end-to-end encrypted document data.
 */
export const PrivateDocumentDataDatagram = createJSONWrapperDatagram<PrivateDocumentData>(
  'ddl://skiff/PrivateDocumentDataDatagram'
);

/**
 * SessionCacheData stores cached session data, used to perform auto-login
 */
export interface SessionCacheData {
  user: User;
}

/**
 * SessionCacheDataDatagram stores a user's full userObj
 */
export const SessionCacheDataDatagram = createJSONWrapperDatagram<SessionCacheData>(
  'ddl://skiff/SessionCaceDataDatagram'
);

/**
 * Encrypt a user's `privateUserData`.
 * @param {PrivateUserData} privateUserData - User's PrivateUserData object.
 * @param {string} passwordDerivedSecret - Password-derived secret for encryption.
 * @returns {string} Encrypted private user data.
 */
export function encryptPrivateUserData(privateUserData: PrivateUserData, passwordDerivedSecret: string): string {
  // Encrypt the private user data and return it
  return encryptSymmetric(privateUserData, passwordDerivedSecret, PrivateUserDataDatagram);
}

/**
 * Encrypt private user data with asymmetric encryption, producing encryptedRecoveryData.
 * @param {string} privateUserData - Private user data to encrypt.
 * @param {string} userEncryptionPrivateKey - User encryption private key.
 * @param {PublicKey} recoveryEncryptionPublicKey - Recovery encryption public key.
 * @returns {Promise<{string}>} Returns a promise that resolves to encrypted recovery data.
 */
export async function encryptPrivateUserDataRecovery(
  privateUserData: PrivateUserData,
  userEncryptionPrivateKey: string,
  recoveryEncryptionPublicKey: PublicKey
): Promise<string> {
  const encryptedRecoveryData = await stringEncryptAsymmetric(
    userEncryptionPrivateKey,
    recoveryEncryptionPublicKey,
    JSON.stringify(privateUserData)
  );
  return encryptedRecoveryData;
}

/**
 * Decrypt a user's `privateUserData`.
 * @param {string} encryptedUserData - User's encrypted PrivateUserData object (as a string).
 * @param {string} passwordDerivedSecret - Password-derived secret for encryption.
 * @returns {PrivateUserData} Decrypted private user data.
 */
export function decryptPrivateUserData(encryptedUserData: string, passwordDerivedSecret: string): PrivateUserData {
  // Decrypt the private user data with the passwordDerivedSecret
  return decryptSymmetric(encryptedUserData, passwordDerivedSecret, PrivateUserDataDatagram);
}

/**
 * Decrypt private user data with asymmetric encryption, to decrypt encryptedRecoveryData.
 * @param {string} encryptedRecoveryData - Private user data to decrypt.
 * @param {string} recoveryEncryptionPrivateKey - Recovery encryption private key.
 * @param {PublicKey} userEncryptionPublicKey - User encryption public key.
 * @returns {Promise<{PrivateUserData}>} Returns a promise that resolves to decrypted private user data.
 */
export async function decryptPrivateUserDataRecovery(
  encryptedRecoveryData: string,
  recoveryEncryptionPrivateKey: string,
  userEncryptionPublicKey: PublicKey
): Promise<PrivateUserData> {
  const userData = await stringDecryptAsymmetric(
    recoveryEncryptionPrivateKey,
    userEncryptionPublicKey,
    encryptedRecoveryData
  );
  return JSON.parse(userData);
}

/**
 * Generates an initial user object given username and masterSecret, which is transformed
 * into a password derived secret using HKDF.
 * @param {string} username - User's username.
 * @param {string} masterSecret - Master secret.
 * @param {string} salt - Salt for use in creating passwor derived secret.
 * @returns {Promise<User>} - User objcet.
 */
export async function generateInitialUserObject(username: string, _masterSecret: string, _salt: string): Promise<User> {
  // This includes the public+private keypair and an empty documents map.
  const { publicKey, privateKey, signingPublicKey, signingPrivateKey } = generatePublicPrivateKeyPair();
  const privateUserData: PrivateUserData = {
    privateKey,
    signingPrivateKey,
    documentKey: generateSymmetricKey()
  };

  const publicKeySignature = await createDetachedSignatureAsymmetric(
    publicKey,
    signingPrivateKey,
    SignatureContext.UserPublicKey
  );

  // a signing public key type that just has a key field
  const publicKeyObj: PublicKey = {
    key: publicKey,
    signature: publicKeySignature
  };

  const user: User = {
    username,
    publicKey: publicKeyObj,
    signingPublicKey,
    privateUserData,
    userID: '', // set in login
    publicData: {}
  };

  return user;
}

/**
 * Add signingPublicKey of verified user to the verifiedKeys object in privateDocumentData.
 * @param {PrivateDocumentData} privateDocumentData - Document data, verified keys for logged-in user
 * @param {string} userID - userID for user to verify.
 * @param {string} signingPublicKey - Signing public key for user to verify.
 */
export function addSigningPublicKeyToVerifiedKeys(
  privateDocumentData: PrivateDocumentData,
  userID: string,
  signingPublicKey: string
): PrivateDocumentData {
  // eslint-disable-next-line no-param-reassign
  privateDocumentData.verifiedKeys.keys[userID] = signingPublicKey;
  privateDocumentData.verifiedKeys.lastVerifiedDate = new Date().toISOString();
  return privateDocumentData;
}

/**
 * Delete verifiedKey of input user from the verifiedKeys object in privateDocumentData.
 * @param {PrivateDocumentData} privateDocumentData - Document data, verified keys for logged-in user
 * @param {string} userID - userID of other user to remove verification from
 */
export function removeSigningPublicKeyFromVerifiedKeys(
  privateDocumentData: PrivateDocumentData,
  userID: string
): PrivateDocumentData {
  // eslint-disable-next-line no-param-reassign
  delete privateDocumentData.verifiedKeys.keys[userID];
  privateDocumentData.verifiedKeys.lastVerifiedDate = new Date().toISOString();
  return privateDocumentData;
}

/**
 * Encrypt and store userObj in localStorage
 * @param {User} userObj - user object
 * @param {string} cacheKey - session cache key
 */
export function writeSessionCacheData(sessionCacheData: SessionCacheData, cacheKey: string) {
  console.log('Write cache', cacheKey);
  const encryptedUserObj = encryptSymmetric(sessionCacheData, cacheKey, SessionCacheDataDatagram);

  // TODO - resolve compatibility with editor
  localStorage.setItem(getStorageKey(SkemailStorageTypes.SESSION_CACHE), encryptedUserObj);
}

/**
 * decrypt userObj from local storage
 * @param {string} cacheKey - session cache key
 * @param {string} sessionCache - encrypted sessioncache from local storage
 * @returns {User} - decrypted user
 */
export function decryptSessionCacheData(encryptedSessionCacheData: string, cacheKey: string): SessionCacheData | null {
  console.log('Decrypt cache', encryptedSessionCacheData, cacheKey);
  return decryptSymmetric(encryptedSessionCacheData, cacheKey, SessionCacheDataDatagram);
}
