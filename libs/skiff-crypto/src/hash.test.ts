import { generateHash } from './hash';

// expected length of crypto hash method
const EXPECTED_HASH_LEN = 88;

describe('crypto utils work properly', () => {
  describe('generateHash works as expected', () => {
    it('generates a hash of expected length', async () => {
      const value1ToHash = 'value1ToHash';
      const value2ToHash = 'value2ToHash';
      const hash1 = generateHash(value1ToHash);
      const hash2 = generateHash(value2ToHash);
      expect(hash1 === hash2).toBeFalsy();
      expect(hash1.length).toEqual(hash2.length);
      expect(hash1.length).toEqual(EXPECTED_HASH_LEN);
    });
  });
});
