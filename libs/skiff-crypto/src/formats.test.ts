/**
 * @jest-environment node
 */

import { bytesToPassphrase, passphraseToBytes } from './formats';

describe('wordlist', () => {
  test('prefix collision', () => {
    const a = Buffer.from(Uint8Array.of(33, 22, 11));
    const b = Buffer.from(Uint8Array.of(128 + 33, 22, 11));

    expect(a).not.toEqual(b);
    expect(bytesToPassphrase(a)).not.toEqual(bytesToPassphrase(b));
  });

  test('roundtrip', () => {
    const bs = Buffer.of(1, 2, 3, 4, 5, 6);

    const encoded = bytesToPassphrase(bs);
    const decoded = passphraseToBytes(encoded);

    expect(decoded).toEqual(bs);
  });

  describe('passphraseToBytes', () => {
    test('fail to decode unknown words', () => {
      const phrase = 'correct horse battery staple';
      // 'battery' and 'staple' are not in the wordlist
      expect(() => passphraseToBytes(phrase)).toThrowError(/unrecognized word/);
    });
    test('correct deserialization', () => {
      const phrase = 'absent pass pass';
      expect(passphraseToBytes(phrase)).toEqual(Buffer.of(5, 5, 5));
    });
    test('window checksum mismatch', () => {
      const phrase = ['absent', 'cactus', 'pass'];
      // this phrase is impossible, as 'cactus's lower 3 bits do not correspond to 'pass's high-bits
      expect(() => passphraseToBytes(phrase)).toThrowError(/checksum failure/);
    });
    test('leading prefix is not zero', () => {
      const phrase = 'pass pass';
      /* Because of the leading '0' prefix used in serialization, the first word of a passphrase is expected to be one
       * of the first 256 words in this list. 'pass' is word index 1285 == (5 * 256) + 5, which would mean that the
       * leading checksum byte is '5', not '0'.
       */
      expect(() => passphraseToBytes(phrase)).toThrowError(/checksum failure/);
    });

    test('normalization', () => {
      const phrase = 'AbSeNt    PaSs';
      expect(passphraseToBytes(phrase)).toEqual(Buffer.of(5, 5));
    });
  });
});
