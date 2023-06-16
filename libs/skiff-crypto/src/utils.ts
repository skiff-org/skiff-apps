// eslint-disable-next-line max-classes-per-file
import { decode as decodeBase64, encode as encodeBase64 } from '@stablelib/base64';

import { AADMetaV2, DatagramV2, TypedBytesV2 } from './aead-v2/common';
import TaggedSecretBox from './aead-v2/secretbox';

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
export function rawEncryptSymmetricV2<Header, Body>(
  header: Header,
  body: Body,
  symmetricKey: string,
  datagram: DatagramV2<Header, Body>
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
export function encryptSymmetricV2<Header, Body>(
  header: Header,
  body: Body,
  symmetricKey: string,
  datagram: DatagramV2<Header, Body>
): string {
  return encodeBase64(rawEncryptSymmetricV2(header, body, symmetricKey, datagram));
}

/**
 * Symmetric decryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption) without encoding
 *
 * @param {Uint8Array} message - encrypted payload.
 * @param {string} symmetricKey - Base64-encoded Key used for decryption.
 * @param {DatagramV2<Header, Body>} DatagramType - The type of object being decrypted
 *
 * @returns {{ header: Header; body: Body; metadata: AADMetaV2 }} Decrypted message contents.
 */
export function rawDecryptSymmetricV2<Header, Body>(
  message: Uint8Array,
  symmetricKey: string,
  DatagramType: DatagramV2<Header, Body>
): { header: Header; body: Body; metadata: AADMetaV2 } {
  const messageObject: TypedBytesV2 = new TypedBytesV2(message);
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
 * @returns {{ header: Header; body: Body; metadata: AADMetaV2 }} Decrypted message contents.
 */
export function decryptSymmetricV2<Header, Body>(
  message: string,
  symmetricKey: string,
  DatagramType: DatagramV2<Header, Body>
): { header: Header; body: Body; metadata: AADMetaV2 } {
  return rawDecryptSymmetricV2(decodeBase64(message), symmetricKey, DatagramType);
}
