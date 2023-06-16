import { fromByteArray, toByteArray } from 'base64-js';
import memoize from 'lodash/memoize';
import nacl from 'tweetnacl';
import { utf8BytesToString, utf8StringToBytes } from './utf8';

/**
 * Generate a nonce for tweetnacl-js.
 */
function newNonce() {
  return nacl.randomBytes(nacl.box.nonceLength);
}

/*
 * Encrypt asymmetric using nacl box (public-key authenticated encryption).
 */
export function encryptAsymmetric(secretOrSharedKey: Uint8Array, msg_str: string, key?: Uint8Array) {
  const nonce = newNonce();
  const messageUint8 = utf8StringToBytes(msg_str);
  const encrypted = key
    ? nacl.box(messageUint8, nonce, key, secretOrSharedKey)
    : nacl.box.after(messageUint8, nonce, secretOrSharedKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  const encodedMessage = fromByteArray(fullMessage);
  return encodedMessage;
}

/*
 * Decrypt asymmetric using nacl box (public-key authenticated encryption).
 */
export function decryptAsymmetric(secretOrSharedKey: Uint8Array, messageWithNonce: string, key?: Uint8Array) {
  const messageWithNonceAsUint8Array = toByteArray(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength);

  const decrypted = key
    ? nacl.box.open(message, nonce, key, secretOrSharedKey)
    : nacl.box.open.after(message, nonce, secretOrSharedKey);

  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }
  const decryptedMessage = utf8BytesToString(decrypted);
  return decryptedMessage;
}

/**
 * Asymmetric encryption method for string.
 * @param {string} myPrivateKey - User's private encryption key.
 * @param {string} theirPublicKey - Recipient's public key.
 * @param {string} plaintext - Plaintext to encrypt.
 * @returns {string} Encrypted plaintext.
 */
export function stringEncryptAsymmetric(
  myPrivateKey: string,
  theirPublicKey: { key: string },
  plaintext: string
): string {
  const sharedKey = nacl.box.before(toByteArray(theirPublicKey.key), toByteArray(myPrivateKey));
  const encrypted = encryptAsymmetric(sharedKey, plaintext);
  return encrypted;
}

/**
 * Asymmetric decryption method for string.
 * @param {string} myPrivateKey - User's private encryption key.
 * @param {string} theirPublicKey - Recipient's public key.
 * @param {string} encryptedText - Data to decrypt.
 * @returns {string} Decrypted plaintext.
 */
export const stringDecryptAsymmetric = memoize(
  (myPrivateKey: string, theirPublicKey: { key: string }, encryptedText: string) => {
    const sharedKey = nacl.box.before(toByteArray(theirPublicKey.key), toByteArray(myPrivateKey));
    const decrypted = decryptAsymmetric(sharedKey, encryptedText);
    return decrypted;
  },
  (myPrivateKey, theirPublicKey, encryptedText) => JSON.stringify([myPrivateKey, theirPublicKey.key, encryptedText])
);
