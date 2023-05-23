import { Buffer } from 'buffer';

import argon2 from 'argon2-browser';
import { fromByteArray, toByteArray } from 'base64-js';
import hkdf from 'futoin-hkdf';
import * as nacl from 'tweetnacl';

import { bytesToPassphrase } from './formats';

/**
 * Return a symmetric key for encryption.
 * @returns {string} Symmetric key.
 */
export function generateSymmetricKey(): string {
  const keyByteArray = nacl.randomBytes(nacl.secretbox.keyLength);
  return fromByteArray(keyByteArray);
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
  return fromByteArray(key.hash);
}

/**
 * Desired HKDF output length.
 */
const HKDF_LENGTH = 32;

/**
 * Different HKDF information parameters for deriving login and private keys.
 */
enum HkdfInfo {
  LOGIN = 'LOGIN',
  PRIVATE_KEYS = 'PRIVATE_KEYS',
  SIGNING_KEY_VERIFICATION_NUMBER = 'SIGNING_KEY_VERIFICATION_NUMBER'
}

/**
 * Generates a key to be used for SRP authentication from masterSecret using the HKDF function.
 * We convert to hex instead of base 64 because SRP expects a private key in hex
 * (https://github.com/LinusU/secure-remote-password/blob/df2e4d00a3a35bb7875a248182471ff1a45a073b/client.js)
 * @param {string} masterSecret - Master secret used for HKDF.
 * @param {string} salt - Salt for SRP key.
 * @returns {string} SRP private key.
 */
export function createSRPKey(masterSecret: string, salt: string): string {
  const privateKey = hkdf(masterSecret, HKDF_LENGTH, {
    salt,
    info: HkdfInfo.LOGIN,
    hash: 'SHA-256'
  }).toString('hex');
  return privateKey;
}

/**
 * Interface for signing and encryption keypairs.
 */
interface SigningAndEncryptionKeypairs {
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
    publicKey: fromByteArray(encryptionKeyPair.publicKey),
    privateKey: fromByteArray(encryptionKeyPair.secretKey),
    signingPublicKey: fromByteArray(signingKeyPair.publicKey),
    signingPrivateKey: fromByteArray(signingKeyPair.secretKey)
  };
  return keyPairs;
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
  const passwordDerivedSecret = fromByteArray(privateKey);
  return passwordDerivedSecret;
}

// Used to pad number of bits to a multiple of 11 (for base 2048 encoding)
const CHECKSUM_LENGTH = 1;

/**
 * Generates verification mnemonic using BIP39-like methodology.
 * @param {string} publicSigningKey - publicSigningKey of user to be verified.
 * @returns {string} Mnemonic sentence.
 */
export function generateVerificationPhraseFromSigningKey(publicSigningKey: string): string {
  const publicSigningKeyDecoded = toByteArray(publicSigningKey);
  const publicSigningKeyBuffer = Buffer.from(publicSigningKeyDecoded);
  const checksum = hkdf(publicSigningKeyBuffer, CHECKSUM_LENGTH, {
    info: HkdfInfo.SIGNING_KEY_VERIFICATION_NUMBER,
    hash: 'SHA-256'
  });
  const mnemonic = bytesToPassphrase(Buffer.concat([publicSigningKeyBuffer, checksum]));
  return mnemonic;
}
