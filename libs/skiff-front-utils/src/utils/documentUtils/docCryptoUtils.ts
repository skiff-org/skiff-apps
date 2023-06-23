import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  createDetachedSignatureAsymmetric,
  createJSONWrapperDatagram,
  decryptSymmetric,
  encryptSymmetric,
  generateSymmetricKey,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric,
  verifyDetachedSignatureAsymmetric
} from '@skiff-org/skiff-crypto';
import {
  Document,
  GetPublicKeysDocument,
  GetPublicKeysQuery,
  GetPublicKeysQueryVariables,
  models
} from 'skiff-front-graphql';
import {
  AdditionalContext,
  DocumentDecryptedContents,
  DocumentDecryptedContentsChunk,
  EncryptedChunk,
  EncryptedContents,
  EncryptedMetadata,
  NwContentType,
  PermissionLevel,
  PublicKey,
  SignatureContext
} from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import {
  ChunkData,
  ClientPermissionEntry,
  GenericDocument,
  ParentKeysClaim,
  PDFDocument,
  RichTextDocument
} from '../../types';

import { ChunkDataDatagram } from './ChunkDataDatagram';

export const MetadataDatagram =
  createJSONWrapperDatagram<Document['decryptedMetadata']>('ddl://skiff/MetadataDatagram');

// TODO - shared among server and client - DEDUP
/**
 * Creates the data used by the server and client to sign encrypted session key.
 * @param {string} encryptedKey - Encrypted session key.
 * @param {permissionLevel} permissionLevel - Permission level for current user.
 * @param {string} expiryDate - The permission level's optional expiry date (stringified).
 * @returns {string} The encrypted session key data concatenated with additional signature context, including
 * the permissionLevel and optional expiryDate.
 */
export function createPermissionsAuthData(
  encryptedKey: string,
  permissionLevel: PermissionLevel,
  expiryDate?: Date | null
) {
  const dataArr = [encryptedKey, permissionLevel];
  if (expiryDate) {
    dataArr.push(expiryDate.toString());
  }
  return JSON.stringify(dataArr);
}

// TODO - shared among server and client - DEDUP
/**
 * Creates the data used by the server and client to sign chunks.
 * @param {number} chunkNumber - The chunk's sequence number inside document contents.
 * @param {encryptedContent} - The chunk's encrypted content.
 * @returns {string} The chunk data concatenated with additional signature context, including
 * the chunkNumber and optional expiryDate.
 */
export function createChunkAuthData(chunkNumber: number, encryptedContent: string) {
  const dataArr = [chunkNumber, encryptedContent];
  return JSON.stringify(dataArr);
}

/**
 * Sign an encrypted document private hierarchical key.
 * @param {string} encryptedPrivateHierarchicalKey - encrypted hierarchical key to sign.
 * @param {string} mySigningPrivateKey - Signing private key used to generate signatures.
 * @param {ClientPermissionEntry} permissionEntry - Current user's permission level, (optional) expiry date.
 * @returns {string} - signature for encryptedPrivateHierarchicalKey
 */
export function signEncryptedPrivateHierarchicalKey(
  encryptedPrivateHierarchicalKey: string,
  mySigningPrivateKey: string,
  permissionEntry: Pick<ClientPermissionEntry, 'permissionLevel' | 'expiryDate'>
): string {
  const dataToSign = createPermissionsAuthData(
    encryptedPrivateHierarchicalKey,
    permissionEntry.permissionLevel,
    permissionEntry.expiryDate
  );
  const signature = createDetachedSignatureAsymmetric(dataToSign, mySigningPrivateKey, SignatureContext.SessionKey);
  return signature;
}

export const encryptPrivateHierarchicalKeyForUser = (
  privateHierarchicalKey: string,
  receiverPublicKey: Pick<PublicKey, 'key'>,
  ownPrivateKey: string
) => stringEncryptAsymmetric(ownPrivateKey, receiverPublicKey, privateHierarchicalKey);

export function encryptParentKeysClaim(
  data: ParentKeysClaim,
  publicHierarchicalKeyOfParent: string,
  ownPrivateKey: string
) {
  return stringEncryptAsymmetric(ownPrivateKey, { key: publicHierarchicalKeyOfParent }, JSON.stringify(data));
}

/**
 * Decrypts document metadata.
 * @param {EncryptedMetadata} encryptedMetadata - Encrypted document metadata.
 * @param {string} sessionKey - Document symmetric encryption key.
 * @returns {Metadata} Decrypted document metadata.
 */
export function decryptMetadata(
  encryptedMetadata: EncryptedMetadata,
  sessionKey: string
): Document['decryptedMetadata'] {
  return decryptSymmetric(encryptedMetadata.encryptedMetadata, sessionKey, MetadataDatagram);
}

/**
 * Encrypts a chunk of document contents data.
 * @param {ChunkData} chunkData - Information stored inside chunk to encrypt.
 * @param {string} sessionKey - Document symmetric encryption key.
 * @param {PublicKey} publicKey - User's public key.
 * @param {string} signingPrivateKey - The user's signing private key (used to generate signatures).
 * @param {number} chunkNumber - The chunk's sequence number in the overall document.
 * @param {boolean} isLastChunk - Whether this is the latest/last chunk in the document.
 * @returns {Promise<EncryptedChunk>} Returns a promise that will resolve to the encrypted document contents chunk.
 */
export function encryptChunk(
  chunkData: ChunkData,
  sessionKey: string,
  signingPublicKey: string,
  signingPrivateKey: string,
  chunkNumber: number,
  isLastChunk: boolean
) {
  const encData = encryptSymmetric(chunkData, sessionKey, ChunkDataDatagram); // encrypt it
  const additionalContext = isLastChunk ? AdditionalContext.LastChunk : AdditionalContext.NotLastChunk;
  const dataToSign = createChunkAuthData(chunkNumber, encData);
  const signature = createDetachedSignatureAsymmetric(
    dataToSign,
    signingPrivateKey,
    SignatureContext.DocumentChunk,
    additionalContext
  );
  const chunk: EncryptedChunk = {
    chunkNumber,
    content: encData,
    signedBy: signingPublicKey,
    signature
  };
  return chunk;
}

/**
 * Encrypts document contents. Iterates through array of contents and encrypts each chunk.
 * @param {Contents} contents - Unencrypted document contents.
 * @param {string} sessionKey - Document symmetric encryption key.
 * @param {string} signingPublicKey - Public key for validating contents.
 * @param {string} signingPrivateKey - User's signing private key to authenticate contents.
 * @returns {EncryptedContents} Returns the encrypted document contents.
 */
export function encryptContents(
  contents: DocumentDecryptedContents,
  sessionKey: string,
  signingPublicKey: string,
  signingPrivateKey: string
): EncryptedContents {
  const contentChunks = contents.contentsArr;
  const encryptedChunks = contentChunks.map((contentChunkElem, index: number) => {
    const isLastChunk = index === contentChunks.length - 1;
    return encryptChunk(
      contentChunkElem.chunkData as ChunkData,
      sessionKey,
      signingPublicKey,
      signingPrivateKey,
      contentChunkElem.chunkNumber,
      isLastChunk
    );
  });

  return { contentsArr: encryptedChunks };
}

export const encryptSessionKey = (sessionKey: string, publicHierarchicalKey: string, ownPrivateKey: string) =>
  stringEncryptAsymmetric(ownPrivateKey, { key: publicHierarchicalKey }, sessionKey);

/**
 * Encrypts document metadata.
 * @param {Metadata} metadata - Decrypted document metadata to encrypt.
 * @param {string} sessionKey - Symmetric document encryption key.
 * @param {PublicKey} publicKey - User's public key (to indicate user who encrypted).
 * @param {string} signingPrivateKey - User's signing private key to generate signature.
 * @returns {EncryptedMetadata} Promise that resolves to encrypted document metadata.
 */
export function encryptMetadata(
  metadata: Document['decryptedMetadata'],
  sessionKey: string,
  signingPublicKey: string,
  signingPrivateKey: string
): EncryptedMetadata {
  const encData = encryptSymmetric(metadata, sessionKey, MetadataDatagram);
  const signature = createDetachedSignatureAsymmetric(encData, signingPrivateKey, SignatureContext.DocumentMetadata);
  return {
    encryptedMetadata: encData,
    signature,
    signedBy: signingPublicKey
  };
}

/**
 * Decrypts document contents by decrypting each content chunk.
 * @param {EncryptedContents} encryptedContents - Encrypted document contents.
 * @param {string} sessionKey - Symmetric document encryption key.
 * @returns {Contents} Decrypted document contents.
 */
export function decryptContents(encryptedContents: EncryptedContents, sessionKey: string) {
  const decryptedArr = encryptedContents.contentsArr.map((elem) => {
    const decryptedChunkData: ChunkData = decryptSymmetric(elem.content, sessionKey, ChunkDataDatagram);
    const curChunk: DocumentDecryptedContentsChunk = {
      chunkData: decryptedChunkData,
      chunkNumber: elem.chunkNumber
    };
    return curChunk;
  });
  return { contentsArr: decryptedArr };
}

/**
 * Decrypts the provided document session key.
 * @param {string} encryptedSessionKey - Encrypted copy of the document session key.
 * @param {string} myPrivateKey - Current user's encryption private key.
 * @param {PublicKey} theirPublicKey - User who encrypted key's encryption public key.
 * @returns {string} Returns the document session key.
 */
export function decryptSessionKey(
  encryptedSessionKey: string,
  myPrivateKey: string,
  theirPublicKey: Pick<PublicKey, 'key'>
): string {
  const decryptedKey = stringDecryptAsymmetric(myPrivateKey, theirPublicKey, encryptedSessionKey);
  return decryptedKey;
}

/**
 * Return a symmetric key for document encryption.
 * @returns {string} Random symmetric key used for document encryption.
 */
export function generateSessionKey(): string {
  return generateSymmetricKey();
}

/**
 * Validate a fetched public key from the server
 * @param {string} userID - UserID whose public key should be fetched.
 * @param {Record<UserID, string>} verifiedKeys - Verified keys for logged-in user. Optional paramater (for sign in use case).
 * @returns {{ signingPublicKey: string, publicKey: PublicKey } | null} Returns a user's public key and signing public key
 * or returns null if either:
 *  1) user does not exist or cannot have documents shared with them, or
 *  2) user's signing public key does not match stored copy. In this case, an error is logged.
 */
export function validatePublicKey(
  userID: string,
  user: Pick<models.User, 'signingPublicKey' | 'publicKey'>,
  verifiedKeys?: Record<string, string>
): {
  signingPublicKey: string;
  publicKey: PublicKey;
} | null {
  if (!user) {
    console.log('fetchPublicKey: user does not exist');
    return null;
  }

  const { signingPublicKey, publicKey } = user;
  if (!signingPublicKey || !publicKey) {
    return null;
  }

  // Check if we've stored a verified key for input userID.
  // If so, check that fetched signingPublicKey matches previously verified key.
  // Shouldn't fail if user is unverified
  if (verifiedKeys) {
    const userInVerifiedKeys = Object.keys(verifiedKeys).includes(userID);
    if (userInVerifiedKeys && verifiedKeys[userID] !== signingPublicKey) {
      console.error('FetchPublicKey: signingPublicKey does not match the stored verified copy');
      return null;
    }
  }

  const { key, signature } = publicKey;
  assertExists(signature);
  const signatureValid = verifyDetachedSignatureAsymmetric(
    key,
    signature,
    signingPublicKey,
    SignatureContext.UserPublicKey
  );
  if (!signatureValid) {
    console.error('fetchPublicKey: invalid signature');
    return null;
  }
  return { signingPublicKey, publicKey };
}

/**
 * Fetches an array of publicKeys given a list of usernames.
 * @param {Array<string>} usernames - Users whose public keys should be fetched.
 * @param {Record<string, string>} verifiedKeys - Verified keys for logged-in user.
 * @returns {Array<string> | null} - Returns array of public key in the same order as the
 * usernames argument, or undefined if some user's public key cannot be fetched.
 */
export async function fetchPublicKeysFromUserIDs(
  client: ApolloClient<NormalizedCacheObject>,
  userIDs: Array<string>,
  verifiedKeys: Record<string, string>
) {
  if (userIDs.length === 0) {
    return [];
  }
  const userDataResponse = await client.query<GetPublicKeysQuery, GetPublicKeysQueryVariables>({
    query: GetPublicKeysDocument,
    variables: {
      request: {
        userIDs
      }
    }
  });

  const { users } = userDataResponse.data;

  // Return null if a public key could not be found for any user
  if (!users) {
    return null;
  }

  // Array of promises
  const validKeysObjects = users.map((user) => ({
    userID: user.userID,
    ...validatePublicKey(user.userID, user, verifiedKeys)
  }));

  const someKeyInvalid = validKeysObjects.some((key) => !key);
  if (someKeyInvalid) {
    return null;
  }

  // Return just public keys
  return validKeysObjects.map(({ publicKey }) => publicKey);
}

/**
 * Create decrypted document contents after doc created.
 * @param {NwContentType} type - Document type.
 * @param {string} docContent - Optional document initial content.
 * @returns {DocumentDecryptedContents} Contents array.
 */
export function createDecryptedContents(type: NwContentType, docContent?: string) {
  const decryptedContents = {
    contentsArr: [] as NonNullable<DocumentDecryptedContents['contentsArr']>
  };
  if (type === NwContentType.RichText) {
    const initialDocumentChunkData: RichTextDocument = {
      documentData: docContent || '',
      hasPassword: false,
      watermark: ''
    };
    decryptedContents.contentsArr.push({
      chunkNumber: 0,
      chunkData: initialDocumentChunkData
    });
  } else if (type === NwContentType.Pdf) {
    const initialDocumentChunkData: PDFDocument = {
      documentData: '', // placeholder for post cache upload
      hasPassword: false,
      uploadedToCache: false // will be set after upload
    };
    decryptedContents.contentsArr.push({
      chunkNumber: 0,
      chunkData: initialDocumentChunkData
    });
  } else if (type === NwContentType.File) {
    const initialDocumentChunkData: GenericDocument = {
      documentData: '', // placeholder for post cache upload
      hasPassword: false,
      uploadedToCache: false
    };
    decryptedContents.contentsArr.push({
      chunkNumber: 0,
      chunkData: initialDocumentChunkData
    });
  }
  return decryptedContents;
}
