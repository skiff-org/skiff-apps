import { fromByteArray, toByteArray } from 'base64-js';
import { utf8StringToBytes } from 'skiff-utils';
import nacl from 'tweetnacl';

// These following three enums are sourced from generated/graphql.ts
export enum AdditionalContext {
  LastChunk = 'LAST_CHUNK',
  NotLastChunk = 'NOT_LAST_CHUNK',
  NoContext = 'NO_CONTEXT'
}

export enum SignatureContext {
  DeleteAccount = 'DELETE_ACCOUNT',
  DeleteDoc = 'DELETE_DOC',
  DeleteRecoveryData = 'DELETE_RECOVERY_DATA',
  DisableMfa = 'DISABLE_MFA',
  DocumentChunk = 'DOCUMENT_CHUNK',
  DocumentData = 'DOCUMENT_DATA',
  DocumentMetadata = 'DOCUMENT_METADATA',
  DocumentParent = 'DOCUMENT_PARENT',
  EnrollMfa = 'ENROLL_MFA',
  LinksLinkKey = 'LINKS_LINK_KEY',
  LinksSessionKey = 'LINKS_SESSION_KEY',
  RecoveryData = 'RECOVERY_DATA',
  RegenerateMfaBackupCodes = 'REGENERATE_MFA_BACKUP_CODES',
  SessionKey = 'SESSION_KEY',
  SrpSalt = 'SRP_SALT',
  SrpVerifier = 'SRP_VERIFIER',
  UnshareDoc = 'UNSHARE_DOC',
  UpdateUserData = 'UPDATE_USER_DATA',
  UploadRecoveryEncryptedUserData = 'UPLOAD_RECOVERY_ENCRYPTED_USER_DATA',
  UploadRecoveryEncryptionPublicKey = 'UPLOAD_RECOVERY_ENCRYPTION_PUBLIC_KEY',
  UploadRecoveryServerShare = 'UPLOAD_RECOVERY_SERVER_SHARE',
  UploadRecoverySigningPublicKey = 'UPLOAD_RECOVERY_SIGNING_PUBLIC_KEY',
  UserData = 'USER_DATA',
  UserPublicKey = 'USER_PUBLIC_KEY',

  // Email related contexts
  EmailContent = 'EMAIL_CONTENT',

  MobileLogin = 'MOBILE_LOGIN'
}

/**
 * Standardized utility function to generate data to sign
 * Prevents signature re-interpretation.
 * @param {string} data - Core data signed. May contain multiple pieces of data concatenated
 * into a string.
 * @param {SignatureContext} signatureContext - Principal context for signature used to prevent
 * re-interpretation.
 * @param {AdditionalContext} additionalContext - Possible sub-context for signature.
 * @returns {string} Data to sign.
 */
function generateSignatureData(
  data: string,
  signatureContext: SignatureContext,
  additionalContext?: AdditionalContext
) {
  const secondContext = additionalContext || AdditionalContext.NoContext;
  const jsonData = [signatureContext, secondContext, data];
  return JSON.stringify(jsonData);
}

/**
 * Verifies signature on provided message given context and additional context.
 * @param {string} message - Message used to verify signature.
 * @param {string} signature - Signature to check.
 * @param {string} signingPublicKey - User's signing public key.
 * @param {SignatureContext} context - Signature context.
 * @param {AdditionalContext} additionalContext - Additional context for signature.
 * @returns {boolean} Whether signature is valid given context.
 */
export function verifyDetachedSignatureAsymmetric(
  message: string,
  signature: string,
  signingPublicKey: string,
  context: SignatureContext,
  additionalContext?: AdditionalContext
) {
  const dataToVerify = generateSignatureData(message, context, additionalContext);
  return nacl.sign.detached.verify(
    utf8StringToBytes(dataToVerify),
    toByteArray(signature),
    toByteArray(signingPublicKey)
  );
}

/**
 * Creates a detached signature from the given a message, signature, key, and context.
 * @param {string} message - Message to sign.
 * @param {string} signingPrivateKey - User's signing private key to create signature.
 * @param {SignatureContext} context - Signature context.
 * @param {AdditionalContext} additionalContext - Optional additional context for message and signature.
 * @returns {string} Signature generated on message with context, additionalContext, and signingPublicKey
 */
export function createDetachedSignatureAsymmetric(
  message: string,
  signingPrivateKey: string,
  context: SignatureContext,
  additionalContext?: AdditionalContext
): string {
  const dataToVerify = generateSignatureData(message, context, additionalContext);
  const bytes = nacl.sign.detached(utf8StringToBytes(dataToVerify), toByteArray(signingPrivateKey));
  return fromByteArray(bytes);
}
