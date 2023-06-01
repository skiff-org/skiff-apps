import { fromByteArray } from 'base64-js';
import { utf8StringToBytes } from './utf8';
import nacl from 'tweetnacl';

/**
 * Generate a hex SHA-512 hash of the given value.
 * @param {string} value - String to hash.
 * @returns {string} Hashed value.
 */
export function generateHash(value: string) {
  const buffer = utf8StringToBytes(value);
  const hashed = nacl.hash(buffer);
  const hashValue = fromByteArray(hashed);
  return hashValue;
}
