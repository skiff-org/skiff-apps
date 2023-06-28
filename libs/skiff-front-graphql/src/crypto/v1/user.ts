import { ApolloClient, ApolloQueryResult, FetchResult, NormalizedCacheObject } from '@apollo/client';
import { Signed } from '@spliterati/threshold';
import { encode as encodeBase64 } from '@stablelib/base64';
// eslint-disable-next-line max-classes-per-file
import {
  generateSymmetricKey,
  generatePublicPrivateKeyPair,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric,
  decryptSymmetric,
  encryptSymmetric,
  createJSONWrapperDatagram,
  createDetachedSignatureAsymmetric,
  verifyDetachedSignatureAsymmetric,
  createPasswordDerivedSecret,
  PrivateUserDataDatagram,
  PrivateUserData,
  generateHash
} from '@skiff-org/skiff-crypto';
import { LoginSrpRequest, PublicData, RequestStatus, SignatureContext } from 'skiff-graphql';
import { assertExists, StorageTypes, getStorageKey } from 'skiff-utils';
import { v4 as uuidv4 } from 'uuid';

import {
  GetUserMfaDocument,
  GetUserMfaQuery,
  GetUserMfaQueryVariables,
  DisableMfaDocument,
  DisableMfaMutation,
  DisableMfaMutationVariables,
  EnrollMfaDocument,
  EnrollMfaMutation,
  EnrollMfaMutationVariables,
  GetRecoveryDataDocument,
  GetRecoveryDataQuery,
  RegenerateMfaBackupCodesDocument,
  RegenerateMfaBackupCodesMutation,
  UpdateDocumentDataDocument,
  UpdateDocumentDataMutation,
  UploadRecoveryDataDocument,
  UploadRecoveryDataMutation,
  RegenerateMfaBackupCodesMutationVariables,
  UploadRecoveryDataMutationVariables
} from '../../../generated/graphql';
import { User } from '../../models/user';

export type UserID = string;
export const USER_NOT_FOUND = 'A user';
type PublicKey = {
  key: string;
  signature?: string;
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

/**
 * Empty document data.
 */
export const EMPTY_DOCUMENT_DATA: PrivateDocumentData = {
  verifiedKeys: {
    keys: {},
    lastVerifiedDate: ''
  },
  recoveryBrowserShare: ''
};

/**
 * Verify user's encryption and signing key pairs.
 * @param {User} userObj - User object containing keypairs.
 * @returns {boolean} Whether keypairs validated.
 */
export function validateKeyPairs(userObj: User): boolean {
  const { privateUserData } = userObj;
  const { signingPrivateKey } = privateUserData;
  const { publicKey, signingPublicKey } = userObj;
  const { key, signature } = publicKey;
  if (!signature) {
    return false;
  }
  // make sure encryption key is properly bound to signing key
  const encryptionKeyValid = verifyDetachedSignatureAsymmetric(
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
  const testSignature = createDetachedSignatureAsymmetric(
    testSignatureData,
    signingPrivateKey,
    SignatureContext.SessionKey // arbitrary signature context
  );
  const validSigningKeypair = verifyDetachedSignatureAsymmetric(
    testSignatureData,
    testSignature,
    signingPublicKey,
    SignatureContext.SessionKey
  );
  return validSigningKeypair;
}

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
 * @returns {string} Returns encrypted recovery data.
 */
export function encryptPrivateUserDataRecovery(
  privateUserData: PrivateUserData,
  userEncryptionPrivateKey: string,
  recoveryEncryptionPublicKey: PublicKey
): string {
  const encryptedRecoveryData = stringEncryptAsymmetric(
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
export function decryptPrivateUserDataRecovery(
  encryptedRecoveryData: string,
  recoveryEncryptionPrivateKey: string,
  userEncryptionPublicKey: PublicKey
): PrivateUserData {
  const userData = stringDecryptAsymmetric(
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
 * @returns {User} - User objcet.
 */
export function generateInitialUserObject(username: string, masterSecret: string, salt: string): User {
  // Generate the key by using the KDF on the user's password
  const passwordDerivedSecret = createPasswordDerivedSecret(masterSecret, salt);
  // This includes the public+private keypair and an empty documents map.
  const { publicKey, privateKey, signingPublicKey, signingPrivateKey } = generatePublicPrivateKeyPair();
  const privateUserData: PrivateUserData = {
    privateKey,
    signingPrivateKey,
    documentKey: generateSymmetricKey()
  };

  const publicKeySignature = createDetachedSignatureAsymmetric(
    publicKey,
    signingPrivateKey,
    SignatureContext.UserPublicKey
  );

  // a signing public key type that just has a key field
  const publicKeyObj = {
    key: publicKey,
    signature: publicKeySignature
  };

  const user: User = {
    username,
    publicKey: publicKeyObj,
    signingPublicKey,
    passwordDerivedSecret,
    privateUserData,
    userID: '', // set in login
    publicData: {},
    privateDocumentData: EMPTY_DOCUMENT_DATA,
    rootOrgID: ''
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
  const userID = sessionCacheData.user.userID;
  localStorage.setItem(getStorageKey(StorageTypes.LATEST_USER_ID), userID);
  localStorage.setItem(`${getStorageKey(StorageTypes.SESSION_CACHE)}:${userID}`, encryptedUserObj);
}

/**
 * decrypt userObj from local storage
 * @param {string} cacheKey - session cache key
 * @param {string} sessionCache - encrypted sessioncache from local storage
 * @returns {User} - decrypted user
 */
export function decryptSessionCacheData(encryptedSessionCacheData: string, cacheKey: string) {
  const decrypted = decryptSymmetric(encryptedSessionCacheData, cacheKey, SessionCacheDataDatagram);
  assertExists(decrypted, 'Failed to restore login: invalid encrypted session');
  return decrypted;
}

/**
 * Decrypt privateDocumentData with `documentKey`.
 * @param {string} encryptedDocumentData - Encrypted document data.
 * @param {PrivateUserData} privateUserData - User's private user data, including document key.
 * @returns {PrivateDocumentData} Decrypted document data.
 */
export function decryptPrivateDocumentData(encryptedDocumentData: string, privateUserData: PrivateUserData) {
  const { documentKey } = privateUserData;
  const privateDocumentData = decryptSymmetric(encryptedDocumentData, documentKey, PrivateDocumentDataDatagram);
  // supports backwards compatibility if verifiedKeys is undefined
  if (!privateDocumentData.verifiedKeys) {
    privateDocumentData.verifiedKeys = {
      keys: {},
      lastVerifiedDate: ''
    };
  }
  // backwards compatibility for if verifiedKeys is in the old format (without lastVerifiedDate)
  if (!('keys' in privateDocumentData.verifiedKeys)) {
    privateDocumentData.verifiedKeys = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      keys: privateDocumentData.verifiedKeys.keys,
      lastVerifiedDate: ''
    };
  }
  return privateDocumentData;
}

/**
 * Fetches the user's encrypted recovery data. If the user is logged in, the emailPasscode parameter
 * isn't necessary, but if the user isn't logged in, they are used
 * to verify the user's identity. This function is also used to send emails and verify passcodes
 * during the account recovery process (see user.ts in the backend for more details).
 * @param {string} username - Username to fetch recovery data.
 * @param {string} emailPasscode - Email passcode used to validate access to recovery data.
 * @returns {Promise<string>} Encrypted user recovery data.
 */
export async function getRecoveryDataFromUsername(
  client: ApolloClient<NormalizedCacheObject>,
  username: string,
  emailPasscode?: string,
  isNotLoggedIn?: boolean
): Promise<string | undefined> {
  const response: ApolloQueryResult<GetRecoveryDataQuery> = await client.query({
    query: GetRecoveryDataDocument,
    variables: {
      request: {
        username,
        emailPasscode,
        isNotLoggedIn
      }
    },
    fetchPolicy: 'network-only'
  });
  return response.data?.user?.encryptedRecoveryData as string | undefined;
}

/**
 * Encrypt a user's privateDocumentData with their `documentKey`.
 * @param {User} userData - User data, including document key and document data.
 * @returns {string} Encrypted document data.
 */
export function encryptPrivateDocumentData(userData: User) {
  const { privateUserData, privateDocumentData } = userData;
  const documentKey: string = privateUserData.documentKey;
  return encryptSymmetric(privateDocumentData, documentKey, PrivateDocumentDataDatagram);
}

/**
 * Upload a user's private encrypted document data.
 * @param {User} userData - User object.
 */
export async function uploadDocumentData(userData: User, client: ApolloClient<NormalizedCacheObject>) {
  const encryptedDocumentData: string = encryptPrivateDocumentData(userData);
  // Get signature
  const signature: string = createDetachedSignatureAsymmetric(
    encryptedDocumentData,
    userData.privateUserData.signingPrivateKey,
    SignatureContext.DocumentData
  );
  // Send request to server
  const docDataResponse: FetchResult<UpdateDocumentDataMutation> = await client.mutate({
    mutation: UpdateDocumentDataDocument,
    variables: {
      request: {
        encryptedDocumentData,
        signature
      }
    }
  });
  const status: RequestStatus | undefined = docDataResponse.data?.updateDocumentData.status;
  if (!status || status !== RequestStatus.Saved) {
    throw new Error('Server did not save doc data');
  }
}

/**
 * Formats a SSS share for storage, by base64-encoding the share.
 * @param {Uint8Array} share - The raw SSS share outputted by spliterati.
 * @returns {string} Encoded and formatted share, for storage.
 */
function formatShare(share: Uint8Array): string {
  const shareEncoded = encodeBase64(share);
  return shareEncoded;
}

/**
 * Uploads/deletes the user's encrypted recovery data. The encryptedRecoveryData
 * parameter is not necessary when a user is attempting to delete their recovery data.
 * @param {User} userData - User data
 * @returns {Promise<{recoveryPaperShare: string, recoveryBrowserShare: string}>} New recovery paper share,
 *    and new recovery browser share, after generating and uploading recovery information.
 */
export async function uploadRecoveryData(
  userData: User,
  client: ApolloClient<NormalizedCacheObject>
): Promise<{
  recoveryPaperShare: string;
  recoveryBrowserShare: string;
}> {
  const { privateUserData } = userData;

  const numShardsRequired = 2;
  const numShardsTotal = 3;

  // Generate and sign new recovery data
  const { signingPublicKey, encryptionPublicKey, shards } = Signed.generate(numShardsRequired, numShardsTotal);
  const recoverySigningPublicKeyEncoded = encodeBase64(signingPublicKey);
  const recoveryEncryptionPublicKeyEncoded = encodeBase64(encryptionPublicKey);

  // recoverySigningPublicKey is the public key component of the keypair used
  // to sign SSS shards. Upon share re-combination, spliterati verifies attached
  // signatures of each shard to confirm that the shard is correct. This is
  // important, since otherwise it's impossible to know which shard is outdated
  // or has been corrupted.
  const signingPrivateKey = privateUserData.signingPrivateKey;
  const signingSignature = createDetachedSignatureAsymmetric(
    recoverySigningPublicKeyEncoded,
    signingPrivateKey,
    SignatureContext.UploadRecoverySigningPublicKey
  );
  const recoverySigningPublicKey: PublicKey = {
    key: recoverySigningPublicKeyEncoded,
    signature: signingSignature
  };

  // recoveryEncryptionPublicKey is the public key component of the keypair whose
  // private key was split by SSS. It is used to asymmetrically encrypt
  // the user secrets to create encryptedRecoveryData. Recombining numShardsRequired
  // SSS shares produces recoveryEncryptionPrivateKey, which is used during recovery
  // to asymmetrically decrypt encryptedRecoveryData.
  const encryptionSignature = createDetachedSignatureAsymmetric(
    recoveryEncryptionPublicKeyEncoded,
    signingPrivateKey,
    SignatureContext.UploadRecoveryEncryptionPublicKey
  );
  const recoveryEncryptionPublicKey: PublicKey = {
    key: recoveryEncryptionPublicKeyEncoded,
    signature: encryptionSignature
  };

  /*
   * While encryptedRecoveryData and recoveryServerShare contain internal
   * signatures (as they use authenticated encryption), there is no exposed
   * way to verify only a signature without performing authenticated decryption.
   *
   * In order to verify mutation authenticity, we follow the codebase pattern
   * of creating detached signatures of uploaded blobs using signingPrivateKey.
   * These signatures are verified within the server mutation handler, and
   * then discarded.
   */

  const encryptedRecoveryData = encryptPrivateUserDataRecovery(
    privateUserData,
    privateUserData.privateKey,
    recoveryEncryptionPublicKey
  );

  const encryptedRecoveryDataSignature = createDetachedSignatureAsymmetric(
    encryptedRecoveryData,
    privateUserData.signingPrivateKey,
    SignatureContext.RecoveryData
  );

  // shards[0] == recoveryServerShare
  // shards[1] == recoveryBrowserShare
  // shards[2] == recoveryPaperShare
  // recoveryBrowserShare and recoveryPaperShare are returned;
  // recoveryServerShare is uploaded to the server and discarded.
  const recoveryServerShare = formatShare(shards[0]);
  const recoveryBrowserShare = formatShare(shards[1]);
  const recoveryPaperShare = formatShare(shards[2]);

  // Compute hashes for browser share and paper share
  const browserShareHash = generateHash(recoveryBrowserShare);
  const paperShareHash = generateHash(recoveryPaperShare);

  const recoveryServerShareSignature = createDetachedSignatureAsymmetric(
    recoveryServerShare,
    privateUserData.signingPrivateKey,
    SignatureContext.UploadRecoveryServerShare
  );

  // First, upload recovery data
  const uploadResponse = await client.mutate<UploadRecoveryDataMutation, UploadRecoveryDataMutationVariables>({
    mutation: UploadRecoveryDataDocument,
    variables: {
      request: {
        encryptedRecoveryData,
        encryptedRecoveryDataSignature,
        recoverySigningPublicKey,
        recoveryEncryptionPublicKey,
        recoveryServerShare,
        recoveryServerShareSignature,
        browserShareHash,
        paperShareHash
      }
    }
  });

  const status: RequestStatus | undefined = uploadResponse.data?.uploadRecoveryData.status;
  if (!status || status !== RequestStatus.Success) {
    throw new Error('Server failed to upload encrypted recovery data');
  }

  // Second, return browser and paper shares for storage
  return {
    recoveryBrowserShare,
    recoveryPaperShare
  };
}

/**
 * Determines whether MFA is enabled on a user's account. If enabled, returns the encrypted MFA secret,
 * which must be authenticated before disabling MFA.
 * @param {User} userID - UserID for checking enabled/disabled.
 * @returns {boolean | string} Returns false if disabled; otherwise returns _encrypted_ MFA secret.
 */
export async function checkMFAEnabled(client: ApolloClient<NormalizedCacheObject>, userID: UserID) {
  const response = await client.query<GetUserMfaQuery, GetUserMfaQueryVariables>({
    query: GetUserMfaDocument,
    variables: {
      request: {
        userID
      }
    },
    fetchPolicy: 'network-only'
  });
  assertExists(response.data?.user, 'getUserMfa failed');
  return response.data?.user;
}

interface DisableMfaRequestVariables {
  client: ApolloClient<NormalizedCacheObject>;
  loginSrpRequest: LoginSrpRequest;
  disableTotp: boolean;
  credentialID?: string;
}

/**
 * Disables multifactor authentication on a user account.
 * @param {User} userData - User data to sign key to disable MFA.
 * @param {string} mfaKey - Current MFA encryption key.
 * @returns {boolean} Success/failure.
 */
export async function disableMfa(request: DisableMfaRequestVariables) {
  const { client, loginSrpRequest, disableTotp, credentialID } = request;
  const response = await client.mutate<DisableMfaMutation, DisableMfaMutationVariables>({
    mutation: DisableMfaDocument,
    variables: {
      request: {
        loginSrpRequest,
        disableTotp,
        credentialID
      }
    }
  });
  if (!response.data) {
    return false;
  }
  const { status } = response.data.disableMfa;
  return status === RequestStatus.Success;
}

/**
 * Enroll user in MFA.
 * @param {User} userData - User data to upload.
 * @param {string} dataMFA - New MFA secret for user.
 * @returns {{ status, backupCodes }} Status from enrollment and backup MFA codes received from server
 */
export async function enrollMfa(
  client: ApolloClient<NormalizedCacheObject>,
  userData: User,
  dataMFA: string,
  loginSrpRequest: LoginSrpRequest
) {
  // Get signature
  const signature = createDetachedSignatureAsymmetric(
    dataMFA,
    userData.privateUserData.signingPrivateKey,
    SignatureContext.EnrollMfa
  );

  // Send request to server
  const mfaResponse = await client.mutate<EnrollMfaMutation, EnrollMfaMutationVariables>({
    mutation: EnrollMfaDocument,
    variables: {
      request: {
        dataMFA,
        signature,
        loginSrpRequest
      }
    }
  });

  if (!mfaResponse.data) {
    return { status: RequestStatus.Rejected, backupCodes: [] };
  }

  return mfaResponse.data.enrollMfa;
}

/**
 * Regenerate a user's MFA backup codes
 * @param {User} userData - User's data
 * @returns {{ status, backupCodes }} Request status and backup MFA codes received from server
 */
export async function regenerateMfaBackupCodes(
  client: ApolloClient<NormalizedCacheObject>,
  userData: User,
  loginSrpRequest: LoginSrpRequest
): Promise<{ status: RequestStatus; backupCodes: string[] } | undefined> {
  const signature = createDetachedSignatureAsymmetric(
    userData.username, // data to sign is user's own username
    userData.privateUserData.signingPrivateKey,
    SignatureContext.RegenerateMfaBackupCodes
  );

  const response = await client.mutate<RegenerateMfaBackupCodesMutation, RegenerateMfaBackupCodesMutationVariables>({
    mutation: RegenerateMfaBackupCodesDocument,
    variables: {
      request: {
        signature,
        loginSrpRequest
      }
    }
  });

  return response.data?.regenerateMfaBackupCodes;
}
