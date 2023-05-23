import { Buffer } from 'buffer';

import { trimAndLowercase } from 'skiff-utils';

import { reverseWordList, wordlist } from './wordlist';

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

class PassphraseError extends Error {}
class ChecksumError extends PassphraseError {}

/**
 * Converts a mnemonic phrase back into a series of bytes.
 * @param {string | string[]} The passphrase (as a string or array of words).
 * @returns {Buffer}: the encoded bytes
 */
/* eslint-disable no-bitwise */
export function passphraseToBytes(passphrase: string | string[]): Buffer {
  // normalize words
  const words: string[] = (typeof passphrase === 'string' ? passphrase.split(/\s+/) : passphrase).map((word) =>
    trimAndLowercase(word)
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
