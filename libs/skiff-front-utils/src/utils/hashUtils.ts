/* eslint-disable import/prefer-default-export */

import { fromByteArray } from 'base64-js';

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
/**
 * Hash with sha256 a message
 * @param message data to hash
 * @returns sha256 hash base64 encoded
 */
export const sha256 = async (message: string) => {
  if (!message) {
    return '';
  }
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashBase64 = fromByteArray(new Uint8Array(hashBuffer)); // convert buffer to base64
  return hashBase64;
};

/**
 * Sha256 hash used for Apollo Persisted Queries
 */
export async function sha256QueryHash(query: any) {
  const encoder = new TextEncoder();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const data = encoder.encode(query);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
