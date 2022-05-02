import { Range } from 'semver';

import { EncryptedDataOutput, PublicKey } from '../../../generated/graphql';
import {
  AttachmentBody,
  AttachmentHeader,
  AttachmentMetadataBody,
  AttachmentMetadataHeader,
  MailHTMLBody,
  MailHTMLHeader,
  MailSubjectBody,
  MailSubjectHeader,
  MailTextAsHTMLBody,
  MailTextAsHTMLHeader,
  MailTextBody,
  MailTextHeader,
  RawMimeBody,
  RawMimeHeader
} from '../../../generated/protos/com/skiff/skemail/encrypted/encrypted_data';
import { Datagram } from './aead/common';
import { createProtoWrapperDatagram } from './datagramClasses';
import {
  createDetachedSignatureAsymmetric,
  decryptSymmetric,
  encryptSymmetric,
  SignatureContext,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric
} from './utils';

// Datagram for encrypting/decrypting raw mime bodies.
export const RawMimeDatagram = createProtoWrapperDatagram(
  'skemail.rawMime',
  RawMimeHeader,
  RawMimeBody,
  '0.1.0',
  new Range('0.1.*')
);

// Datagram for encrypting/decrypting attachments.
export const AttachmentDatagram = createProtoWrapperDatagram(
  'skemail.attachment',
  AttachmentHeader,
  AttachmentBody,
  '0.1.0',
  new Range('0.1.*')
);
// Datagram for encrypting/decrypting attachment metadata.
export const AttachmentMetadataDatagram = createProtoWrapperDatagram(
  'skemail.attachmentMetadata',
  AttachmentMetadataHeader,
  AttachmentMetadataBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailSubjectDatagram = createProtoWrapperDatagram(
  'skemail.mailSubject',
  MailSubjectHeader,
  MailSubjectBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailTextDatagram = createProtoWrapperDatagram(
  'skemail.mailText',
  MailTextHeader,
  MailTextBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailHtmlDatagram = createProtoWrapperDatagram(
  'skemail.mailHtml',
  MailHTMLHeader,
  MailHTMLBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailTextAsHTMLDatagram = createProtoWrapperDatagram(
  'skemail.MailTextAsHTML',
  MailTextAsHTMLHeader,
  MailTextAsHTMLBody,
  '0.1.0',
  new Range('0.1.*')
);

export type SessionKey = string;

/**
 * Encrypt document session key.
 * @param {string} sessionKey - Document session key to encrypt.
 * @param {string} myPrivateKey - Encryption private key used to encrypt session key.
 * @param {PublicKey} myPublicKey - Current user's encryption public key.
 * @param {PublicKey} theirPublicKey - Other user's encryption public key.
 * @returns {EncryptedKey} Returns the encrypted document session key.
 */
export function encryptSessionKey(
  sessionKey: SessionKey,
  myPrivateKey: string,
  myPublicKey: PublicKey,
  theirPublicKey: PublicKey
) {
  const newKey = stringEncryptAsymmetric(myPrivateKey, theirPublicKey, sessionKey);
  const encryptedKey = {
    encryptedKey: newKey,
    encryptedBy: myPublicKey
  };
  return encryptedKey;
}

/**
 * Decrypts the provided document session key.
 * @param {string} encryptedSessionKey - Encrypted copy of the document session key.
 * @param {string} myPrivateKey - Current user's encryption private key.
 * @param {PublicKey} theirPublicKey - User who encrypted key's encryption public key.
 * @returns {SessionKey} Returns the document session key.
 */
export function decryptSessionKey(
  encryptedSessionKey: string,
  myPrivateKey: string,
  theirPublicKey: Pick<PublicKey, 'key'>
): SessionKey {
  const decryptedKey = stringDecryptAsymmetric(myPrivateKey, theirPublicKey, encryptedSessionKey);
  return decryptedKey;
}

/**
 * Sign an encrypted document session key.
 * @param {string} encryptedKey - encryptedKey field of the EncryptedKey document
 * session key to sign.
 * @param {string} mySigningPrivateKey - Signing private key used to generate signatures.
 * @param {ClientPermissionEntry} permissionEntry - Current user's permission level, (optional) expiry date.
 * @returns {Promise<{string}>} Returns a promise that resolves to a signature for encryptedKey
 */
export function signEncryptedSessionKey(encryptedKey: string, mySigningPrivateKey: string): string {
  return createDetachedSignatureAsymmetric(encryptedKey, mySigningPrivateKey, SignatureContext.SessionKey);
}

/**
 * Encrypt a datagram.
 * @param {Datagram} datagram - Datagram to encrypt.
 * @param {EmailHeader} header - Datagram header.
 * @param {EmailBody} body - Datagram body.
 * @param {string} sessionKey - Symmetric document encryption key.
 * @param {PublicKey} publicKey - User's public key (to indicate user who encrypted).
 * @param {string} signingPrivateKey - User's signing private key to generate signature.
 * @returns {EncryptedDataOutput} Promise that resolves to encrypted data.
 */
export function encryptDatagram<Header, Body>(
  datagram: Datagram<Header, Body>,
  header: Header,
  body: Body,
  sessionKey: string
): EncryptedDataOutput {
  const encData = encryptSymmetric(header, body, sessionKey, datagram);
  return {
    encryptedData: encData
  };
}

/**
 * Decrypt a datagram.
 * @param {Datagram} datagram - Datagram to decrypt.
 * @param {string} encryptedDatagram - Encrypted datagram header.
 * @param {string} sessionKey - Symmetric document encryption key.
 * @returns {{header: Header, body: Body, metadata: AADMeta}} Decrypted header, body, and other metadata from the datagram.
 */
export function decryptDatagram<Header, Body>(
  datagram: Datagram<Header, Body>,
  sessionKey: string,
  encryptedDatagram: string
) {
  return decryptSymmetric(encryptedDatagram, sessionKey, datagram);
}
