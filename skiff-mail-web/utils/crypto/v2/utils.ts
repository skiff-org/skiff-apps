// eslint-disable-next-line max-classes-per-file
import { decode as decodeBase64, encode as encodeBase64 } from '@stablelib/base64';
import argon2 from 'argon2-browser';
import hkdf from 'futoin-hkdf';
import { memoize } from 'lodash';
import * as nacl from 'tweetnacl';

import { PublicKey } from '../../../generated/graphql';
import { AADMeta, Datagram, TypedBytes } from './aead/common';
import TaggedSecretBox from './aead/secretbox';
import { utf8BytesToString, utf8StringToBytes } from './aead/utf8';
import { reverseWordList, wordlist } from './wordlist';

/**
 * SignatureContext represents all actions a user can take
 * that need to be signed.
 */
/* eslint-disable no-multi-spaces */

export enum SignatureContext {
  // Email related contexts
  SessionKey = 'SESSION_KEY',
  EmailContent = 'EMAIL_CONTENT',
  UserPublicKey = 'USER_PUBLIC_KEY'
}

export enum AdditionalContext {
  LastChunk = 'LAST_CHUNK',
  NotLastChunk = 'NOT_LAST_CHUNK',
  NoContext = 'NO_CONTEXT'
}

/**
 * Different HKDF information parameters for deriving login and private keys.
 */
enum HkdfInfo {
  LOGIN = 'LOGIN',
  PRIVATE_KEYS = 'PRIVATE_KEYS',
  SIGNING_KEY_VERIFICATION_NUMBER = 'SIGNING_KEY_VERIFICATION_NUMBER'
}

/**
 * Generate a nonce for tweetnacl-js.
 */
function newNonce() {
  return nacl.randomBytes(nacl.box.nonceLength);
}

/**
 * Generate a hex SHA-512 hash of the given value.
 * @param {string} value - String to hash.
 * @returns {string} Hashed value.
 */
export function generateHash(value: string) {
  const buffer = utf8StringToBytes(value);
  const hashed = nacl.hash(buffer);
  const hashValue = encodeBase64(hashed);
  return hashValue;
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

  const encodedMessage = encodeBase64(fullMessage);
  return encodedMessage;
}

/*
 * Decrypt asymmetric using nacl box (public-key authenticated encryption).
 */
export function decryptAsymmetric(secretOrSharedKey: Uint8Array, messageWithNonce: string, key?: Uint8Array) {
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength, messageWithNonce.length);

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
 * Desired argon2 output length.
 */
const ARGON2_LENGTH = 32;

/*
 * Deterministically generates a key from the secret value and salt provided using argon2id
 */
export async function createKeyFromSecret(secret: string, argonSalt: string) {
  const key = await argon2.hash({
    pass: secret,
    salt: argonSalt,
    hashLen: ARGON2_LENGTH, // desired hash length
    type: argon2.ArgonType.Argon2id
  });
  return encodeBase64(key.hash);
}

/**
 * Desired HKDF output length.
 */
const HKDF_LENGTH = 32;

/**
 * Generates a key to be used for SRP authentication from masterSecret using the HKDF function.
 * We convert to hex instead of base 64 because SRP expects a private key in hex
 * (https://github.com/LinusU/secure-remote-password/blob/df2e4d00a3a35bb7875a248182471ff1a45a073b/client.js)
 * @param {string} masterSecret - Master secret used for HKDF.
 * @param {string} salt - Salt for SRP key.
 * @returns {string} SRP private key.
 */
export async function createSRPKey(masterSecret: string, salt: string): Promise<string> {
  const privateKey = hkdf(masterSecret, HKDF_LENGTH, {
    salt,
    info: HkdfInfo.LOGIN,
    hash: 'SHA-256'
  }).toString('hex');
  return privateKey;
}

class PassphraseError extends Error {}
class ChecksumError extends PassphraseError {}

/**
 * Converts a byte array into a mnemonic phrase for verifiying users.
 * @param {Buffer} bytes - The bytes to convert.
 * @param {string} separator - The separator to use for words.
 * @returns {string} Passphrase consisting of words translated from input bytes.
 */
export function bytesToPassphrase(bytes: Buffer, separator = ' ') {
  const words: Array<string> = new Array<string>(bytes.length);
  const zero = Buffer.from([0]);
  const bs = Buffer.concat([zero, bytes]);
  // prepend constant '0' so that, when the highest bits are discarded by the windowing function, no information is lost
  // some Buffer methods behave differently on different browsers (especially webkit) - test thoroughly after modifying!
  for (let idx = 0; idx < bs.length - 1; idx += 1) {
    const wordIndex = (bs[idx] * 256 + bs[idx + 1]) % wordlist.length;
    /* wordIndex is an 11-bit sliding window over two adjacent bytes in the provided buffer.
     * lets say that `bs[n]` is `0bABCDEFGH` and `bs[n+1]` is `0bZYXWVUTS`,
     * `(bs[n] * 256) + bs[n+1]` is a sixteen bit word of `0bABCDEFGHZYXWVUTS`
     * `% wordlist.length` (2048), makes this value `0b00000FGHZYXWVUTS`, an 11-bit value.
     *
     * this introduces a nice rolling verification property for later deserialization.
     */
    words[idx] = wordlist[wordIndex];
  }
  return words.join(separator);
}

/**
 * Converts a mnemonic phrase back into a series of bytes.
 * @param {string | string[]} The passphrase (as a string or array of words).
 * @returns {Buffer}: the encoded bytes
 */
/* eslint-disable no-bitwise */
export function passphraseToBytes(passphrase: string | string[]): Buffer {
  // normalize words
  const words: string[] = (typeof passphrase === 'string' ? passphrase.split(/\s+/) : passphrase).map((word) =>
    word.trim().toLowerCase()
  );

  const bytes = Buffer.alloc(words.length);
  /* to reverse the windowing process while validating the rolling hash, we're start from the end, and constantly
   * validate that bits 9-12 in window N+1 are bits 0-3 in window N.
   */
  let carryover: number | undefined;
  // carryover isn't immediately known for the last byte, so we skip it for that index.
  for (let idx = words.length - 1; idx >= 0; idx -= 1) {
    const wordIdx = reverseWordList.get(words[idx]);
    if (wordIdx === undefined) {
      throw new PassphraseError(`unrecognized word '${words[idx]}'`);
    }
    if (carryover !== undefined && (wordIdx & 0x07) !== carryover) {
      // 0x07 = the lowest 3 bits of the word. If they're not correct, bail.
      throw new ChecksumError('intermediate checksum failure');
    }
    bytes[idx] = wordIdx & 0xff;
    carryover = wordIdx >> 8;
  }

  // First byte has had this carryover zero-padded. Ensure that we have no leftover bits
  if (carryover !== 0) {
    throw new ChecksumError('leading checksum failure');
  }

  return bytes;
}
/* eslint-enable no-bitwise */

// Used to pad number of bits to a multiple of 11 (for base 2048 encoding)
const CHECKSUM_LENGTH = 1;

/**
 * Generates verification mnemonic using BIP39-like methodology.
 * @param {string} publicSigningKey - publicSigningKey of user to be verified.
 * @returns {string} Mnemonic sentence.
 */
export async function generateVerificationPhraseFromSigningKey(publicSigningKey: string): Promise<string> {
  const publicSigningKeyDecoded = decodeBase64(publicSigningKey);
  const publicSigningKeyBuffer = Buffer.from(publicSigningKeyDecoded);
  const checksum = hkdf(publicSigningKeyBuffer, CHECKSUM_LENGTH, {
    info: HkdfInfo.SIGNING_KEY_VERIFICATION_NUMBER,
    hash: 'SHA-256'
  });
  const mnemonic = bytesToPassphrase(Buffer.concat([publicSigningKeyBuffer, checksum]));
  return mnemonic;
}

/**
 * Generates the passwordDerivedSecret (a symmetric key that encrypts the user's private keys).
 * @param {string} masterSecret - User's master secret for HKDF input.
 * @param {string} salt - Salt to use in HKDF.
 * @returns {string} - Password derived secret.
 */
export function createPasswordDerivedSecret(masterSecret: string, salt: string): string {
  const privateKey = hkdf(masterSecret, HKDF_LENGTH, {
    salt,
    info: HkdfInfo.PRIVATE_KEYS,
    hash: 'SHA-256'
  });
  const passwordDerivedSecret = encodeBase64(privateKey);
  return passwordDerivedSecret;
}

/**
 * Interface for signing and encryption keypairs.
 */
export interface SigningAndEncryptionKeypairs {
  publicKey: string;
  privateKey: string;
  signingPublicKey: string;
  signingPrivateKey: string;
}

/**
 * Generates a public and private key for using with signing and encryption
 * @returns {SigningAndEncryptionKeypairs} Signing and encryption keypairs.
 */
export function generatePublicPrivateKeyPair(): SigningAndEncryptionKeypairs {
  const generateKeyPair = () => nacl.box.keyPair();
  const generateSigningKeyPair = () => nacl.sign.keyPair();
  const encryptionKeyPair = generateKeyPair();
  const signingKeyPair = generateSigningKeyPair();
  const keyPairs: SigningAndEncryptionKeypairs = {
    publicKey: encodeBase64(encryptionKeyPair.publicKey),
    privateKey: encodeBase64(encryptionKeyPair.secretKey),
    signingPublicKey: encodeBase64(signingKeyPair.publicKey),
    signingPrivateKey: encodeBase64(signingKeyPair.secretKey)
  };
  return keyPairs;
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
  theirPublicKey: Pick<PublicKey, 'key'>,
  plaintext: string
): string {
  const sharedKey = nacl.box.before(decodeBase64(theirPublicKey.key), decodeBase64(myPrivateKey));
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
  (myPrivateKey: string, theirPublicKey: Pick<PublicKey, 'key'>, encryptedText: string) => {
    const sharedKey = nacl.box.before(decodeBase64(theirPublicKey.key), decodeBase64(myPrivateKey));
    const decrypted = decryptAsymmetric(sharedKey, encryptedText);
    return decrypted;
  },
  (myPrivateKey, theirPublicKey, encryptedText) => JSON.stringify([myPrivateKey, theirPublicKey.key, encryptedText])
);

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
  const bytes = nacl.sign.detached(utf8StringToBytes(dataToVerify), decodeBase64(signingPrivateKey));
  return encodeBase64(bytes);
}

/**
 * Verifies a detached signature from the given a message, signature, key, and context.
 * @param {string} message - Message to verify.
 * @param {string} signature - Signature to verify.
 * @param {string} signingPublicKey - User's signing public key to test with signature.
 * @param {SignatureContext} context - Signature context.
 * @param {AdditionalContext} additionalContext - Optional additional context for message and signature.
 * @returns {boolean} Whether signature is valid.
 */
export function verifyDetachedSignatureAsymmetric(
  message: string,
  signature: string,
  signingPublicKey: string,
  context: SignatureContext,
  additionalContext?: AdditionalContext
): boolean {
  const dataToVerify = generateSignatureData(message, context, additionalContext);
  return nacl.sign.detached.verify(
    utf8StringToBytes(dataToVerify),
    decodeBase64(signature),
    decodeBase64(signingPublicKey)
  );
}

/**
 * Return a symmetric key for encryption.
 * @returns {string} Symmetric key.
 */
export function generateSymmetricKey(): string {
  const keyByteArray: Uint8Array = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(keyByteArray);
}

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
