import {
  AlgorithmInfo,
  GenerateKeyOptions,
  PrivateKey,
  PublicKey,
  ReasonForRevocation,
  UserID,
  decryptKey,
  generateKey,
  readPrivateKey as openpgpReadPrivateKey,
  readKey,
  reformatKey,
  revokeKey
} from 'openpgp';
import isEmail from 'validator/lib/isEmail';

// have to do this because zbase32 is an esm module only
const zbase32Promise = import('zbase32');

/**
 * Generate a PGP Keyring
 * @param userIDs
 * @param keyExpirationTime in seconds from now
 * @param type
 * @param curve
 * @returns
 */
export async function generatePGPKey(
  userIDs: UserID[],
  type: GenerateKeyOptions['type'] = 'ecc',
  curve: GenerateKeyOptions['curve'] = 'curve25519'
) {
  const date = new Date();
  const { privateKey, publicKey } = await generateKey({
    type, // Type of the key, defaults to ECC
    curve, // ECC curve name, defaults to curve25519
    userIDs,
    passphrase: undefined, // we do not allow users to have a passphrase on their keys
    format: 'binary', // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    date
  });

  return { privateKey, publicKey, date, userIDs };
}

/**
 * Export the key
 * @param userIDs
 * @param privateKey
 * @param createdAt
 * @param keyExpirationTime
 * @param passphrase The passphrase used to *encrypt* the newly formatted key
 * @returns
 */
export async function exportPGPKey(
  userIDs: UserID[],
  currentPrivateKey: PrivateKey,
  createdAt: Date,
  passphrase?: string
) {
  const { privateKey, publicKey } = await reformatKey({
    userIDs,
    privateKey: currentPrivateKey,
    passphrase,
    date: createdAt,
    format: 'armored'
  });

  return { privateKey, publicKey };
}

export async function generateRevokedPGPKey(privateKey: PrivateKey, reasonForRevocation: ReasonForRevocation) {
  const revokedKeyPair = await revokeKey({ key: privateKey, reasonForRevocation, format: 'binary' });
  return revokedKeyPair;
}

/**
 * Read a private key
 * @param privateKeyData
 * @returns
 */
export async function readPrivateKey(privateKeyData: Uint8Array) {
  const privateKey = await openpgpReadPrivateKey({ binaryKey: privateKeyData });
  const encryptionKey = await privateKey.getEncryptionKey();
  const algorithm = encryptionKey.getAlgorithmInfo();

  validateAlgorithm(algorithm);

  return privateKey;
}

export async function readArmoredPrivateKey(privateKeyData: string, passphrase?: string | null) {
  let privateKey = await openpgpReadPrivateKey({ armoredKey: privateKeyData });
  if (passphrase) {
    privateKey = await decryptKey({ privateKey, passphrase });
  }
  const encryptionKey = await privateKey.getEncryptionKey();
  const algorithm = encryptionKey.getAlgorithmInfo();

  validateAlgorithm(algorithm);

  return privateKey;
}

export async function readPublicKey(key: Uint8Array) {
  const publicOrPrivatekey = await readKey({ binaryKey: key });
  const publicKey = publicOrPrivatekey.toPublic();
  return publicKey;
}

/**
 * Read a public key from an armored string
 * @param key
 * @returns the public key
 */

export async function readArmoredPublicKey(key: string) {
  const publicOrPrivatekey = await readKey({ armoredKey: key });
  const publicKey = publicOrPrivatekey.toPublic();
  return publicKey;
}

/**
 * Compute the hash for a WKD receiver
 * @param localPart
 * @returns
 */
export async function computeWKDHash(localPart: string): Promise<string> {
  /**
   The so mapped local-part is hashed using the SHA-1 algorithm.  The
   resulting 160 bit digest is encoded using the Z-Base-32 method as
   described in [RFC6189], section 5.1.6.  The resulting string has a
   fixed length of 32 octets.
   */
  const pgpNormalizedLocalPart = localPart.toLowerCase(); // only ascii lowercase
  const textEncoder = new TextEncoder();
  const sha1hash = await crypto.subtle.digest('SHA-1', textEncoder.encode(pgpNormalizedLocalPart));
  const zbase32 = await zbase32Promise;
  return zbase32.encode(sha1hash);
}

/**
 * Validate that the inputted hash is equal to the computed hash
 * @param localPart
 * @param providedHash
 * @returns
 */
export async function verifyWKDHash(localPart: string, providedHash: string): Promise<boolean> {
  const encodedHash = await computeWKDHash(localPart);
  return encodedHash === providedHash;
}

/**
 * Fetch a recipient's WKD Key
 * @param emailAddress emailAddress to query. Note that this does not cache common
 * providers that do or don't have WKD support
 * @param originUrl the result from calling getBaseProxyURL() in skiff-front-utils
 * @returns
 */
export async function fetchWKDKey(emailAddress: string, originUrl: URL): Promise<PublicKey | null> {
  if (!isEmail(emailAddress)) {
    throw Error('invalid email address passed to get a WKD key');
  }

  const emailParts = emailAddress.split('@');
  const localPart = emailParts[0];
  const localPartHash = await computeWKDHash(localPart);
  const localPartURIQuery = encodeURIComponent(localPart);
  const domainPart = emailParts[1];

  // const advancedWKD = `https://openpgpkey.${domainPart}/.well-known/openpgpkey/${domainPart}/hu/${localPartHash}?l=${localPartURIQuery}`;
  const advancedWKD = new URL(
    `/wkd_proxy_advanced/?domain=${domainPart}&address=${localPartURIQuery}\&hash=${localPartHash}`,
    originUrl
  );

  const advancedWKDResponse = await fetch(advancedWKD, {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer'
  });
  if (advancedWKDResponse.status == 200) {
    const rawBuffer = await advancedWKDResponse.arrayBuffer();
    const publicKey = await readPublicKey(new Uint8Array(rawBuffer));
    return publicKey;
  }

  // const directWKD = `https://${domainPart}/.well-known/openpgpkey/hu/${localPartHash}?l=${localPartURIQuery}`;
  const directWKD = new URL(
    `/wkd_proxy_direct/?domain=${domainPart}&address=${localPartURIQuery}\&hash=${localPartHash}`,
    originUrl
  );

  const directWKDResponse = await fetch(directWKD, {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer'
  });
  if (directWKDResponse.status == 200) {
    const rawBuffer = await directWKDResponse.arrayBuffer();
    const publicKey = await readPublicKey(new Uint8Array(rawBuffer));
    return publicKey;
  }

  return null;
}

/**
 * Convert a Public Key into a WKD Key
 * @param key the PublicKey to be published
 * @returns a Uint8Array representation of the full pgp public key
 */
export async function publishWKDKey(armoredKey: string): Promise<Uint8Array> {
  const key = await readKey({
    armoredKey
  });

  if (key.isPrivate()) {
    throw Error('Passed a private key. It should be a public key only.');
  }
  return key.write();
}

export function validateAlgorithm(algorithm: AlgorithmInfo) {
  if (['rsaEncryptSign', 'rsaEncrypt'].includes(algorithm.algorithm)) {
    if (!algorithm.bits || algorithm.bits < 2048) {
      throw Error('Only RSA algorithms that use at least 2048 bits are supported');
    }
  } else if (['elgamal', 'dsa'].includes(algorithm.algorithm)) {
    throw Error('ElGamal and DSA are unsupported algorithms');
  }
}

export type PgpPublicKey = PublicKey;
export type PgpPrivateKey = PrivateKey;
export type KeyAlgorithmInfo = AlgorithmInfo;
