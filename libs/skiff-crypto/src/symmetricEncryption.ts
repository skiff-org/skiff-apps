import { fromByteArray, toByteArray } from 'base64-js';

import { Datagram, TypedBytes } from './aead/common';
import { TaggedSecretBox } from './aead/secretbox';

/**
 * Symmetric encryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption) returning raw data without encoding
 *
 * @param content - The object being serialized
 * @param symmetricKey - The base64-encoded symmetric key
 * @param DatagramType - The mechanism to convert instances of T to a Datagram
 *
 * @returns {Uint8Array} - encrypted payload
 */
export function rawEncryptSymmetric<T>(content: T, symmetricKey: string, datagram: Datagram<T>) {
  const envelope = new TaggedSecretBox(toByteArray(symmetricKey));
  return envelope.encrypt(datagram, content);
}

/**
 * Symmetric encryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption).
 *
 * @param content - The object being serialized
 * @param symmetricKey - The base64-encoded symmetric key
 * @param DatagramType - The mechanism to convert instances of T to a Datagram
 *
 * @returns {string} - Base64-encoded encrypted payload.
 */
export function encryptSymmetric<T>(content: T, symmetricKey: string, datagram: Datagram<T>): string {
  return fromByteArray(rawEncryptSymmetric(content, symmetricKey, datagram));
}

/**
 * Symmetric decryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption) without encoding
 *
 * @param {Uint8Array} message - encrypted payload.
 * @param {string} symmetricKey - Base64-encoded Key used for decryption.
 * @param {DatagramConstructor<T>} DatagramType - The type of object being decrypted
 *
 * @returns {T} Decrypted message contents.
 */
export function rawDecryptSymmetric<T>(message: Uint8Array, symmetricKey: string, DatagramType: Datagram<T>): T {
  const messageObject: TypedBytes = new TypedBytes(message);
  const envelope = new TaggedSecretBox(toByteArray(symmetricKey));
  return envelope.decrypt(DatagramType, messageObject);
}

/**
 * Symmetric decryption using an implementation of nacl secretbox
 * (secret-key authenticated encryption).
 *
 * @param {string} message - The base64-encoded encrypted payload.
 * @param {string} symmetricKey - Base64-encoded Key used for decryption.
 * @param {DatagramConstructor<T>} DatagramType - The type of object being decrypted
 *
 * @returns {T} Decrypted message contents.
 */
export function decryptSymmetric<T>(message: string, symmetricKey: string, DatagramType: Datagram<T>): T {
  return rawDecryptSymmetric(toByteArray(message), symmetricKey, DatagramType);
}
