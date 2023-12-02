// eslint-disable-next-line max-classes-per-file
import { decode as decodeBase64, encode as encodeBase64 } from '@stablelib/base64';

import { AADMeta, Datagram, TypedBytes } from './aead/common';
import TaggedSecretBox from './aead/secretbox';

/**
 * Symmetric encryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption) returning raw data without encoding
 *
 * @param header - The object header being serialized
 * @param body - The object body being serialized
 * @param symmetricKey - The base64-encoded symmetric key
 * @param DatagramType - The mechanism to convert instances of T to a Datagram
 *
 * @returns {Uint8Array} - encrypted payload
 */
export function rawEncryptSymmetric<Header, Body>(
  header: Header,
  body: Body,
  symmetricKey: string,
  datagram: Datagram<Header, Body>
) {
  const envelope = new TaggedSecretBox(decodeBase64(symmetricKey));
  return envelope.encrypt(datagram, header, body);
}

/**
 * Symmetric encryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption).
 *
 * Duplicated @ editor/crypto/util.ts
 *
 * @param header - The object header being serialized
 * @param body - The object body being serialized
 * @param symmetricKey - The base64-encoded symmetric key
 * @param DatagramType - The mechanism to convert instances of T to a Datagram
 *
 * @returns {string} - Base64-encoded encrypted payload.
 */
export function encryptSymmetric<Header, Body>(
  header: Header,
  body: Body,
  symmetricKey: string,
  datagram: Datagram<Header, Body>
): string {
  return encodeBase64(rawEncryptSymmetric(header, body, symmetricKey, datagram));
}

/**
 * Symmetric decryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption) without encoding
 *
 * @param {Uint8Array} message - encrypted payload.
 * @param {string} symmetricKey - Base64-encoded Key used for decryption.
 * @param {Datagram<Header, Body>} DatagramType - The type of object being decrypted
 *
 * @returns {{ header: Header; body: Body; metadata: AADMeta }} Decrypted message contents.
 */
export function rawDecryptSymmetric<Header, Body>(
  message: Uint8Array,
  symmetricKey: string,
  DatagramType: Datagram<Header, Body>
): { header: Header; body: Body; metadata: AADMeta } {
  const messageObject: TypedBytes = new TypedBytes(message);
  const envelope = new TaggedSecretBox(decodeBase64(symmetricKey));
  return envelope.decrypt(DatagramType, messageObject);
}

/**
 * Symmetric decryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption).
 *
 * Duplicated @ editor/crypto/util.ts
 *
 * @param {string} message - The base64-encoded encrypted payload.
 * @param {string} symmetricKey - Base64-encoded Key used for decryption.
 * @param {DatagDatagram<Header, Body>} DatagramType - The type of object being decrypted
 *
 * @returns {{ header: Header; body: Body; metadata: AADMeta }} Decrypted message contents.
 */
export function decryptSymmetric<Header, Body>(
  message: string,
  symmetricKey: string,
  DatagramType: Datagram<Header, Body>
): { header: Header; body: Body; metadata: AADMeta } {
  return rawDecryptSymmetric(decodeBase64(message), symmetricKey, DatagramType);
}
