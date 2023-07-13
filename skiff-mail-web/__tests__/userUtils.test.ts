import { formatEmailAddress } from 'skiff-front-utils';
import { getMailDomain } from 'skiff-utils';
import { isSkiffAddress } from 'skiff-utils';

describe('userUtils', () => {
  describe('formatEmailAddress', () => {
    it('returns unaltered email address if already valid', () => {
      const testEmail = 'test@skiff.com';
      const actual = formatEmailAddress(testEmail);
      expect(actual).toBe(testEmail);
    });
    it('appends email domain to wallet address', () => {
      const testEthAddress = '0x1111000000000000000000000000000000001111';
      const abbreviated = formatEmailAddress(testEthAddress, true);
      expect(abbreviated).toBe('0x111...1111' + '@' + getMailDomain());

      const fullLength = formatEmailAddress(testEthAddress, false);
      expect(fullLength).toBe(testEthAddress + '@' + getMailDomain());
    });
    it('can abbreviate wallet address with email domain', () => {
      const testEmail = '0x1111000000000000000000000000000000001111@skiff.com';
      const abbreviated = formatEmailAddress(testEmail, true);
      expect(abbreviated).toBe('0x111...1111@skiff.com');
    });
    it('appends email domain to possible ens domain', () => {
      const testENS = 'skiff.eth';
      const actual = formatEmailAddress(testENS);
      expect(actual).toBe('skiff.eth@' + getMailDomain());
    });
    it('does not format any other inputs', () => {
      const testURL = 'https://github.com/';
      const formattedURL = formatEmailAddress(testURL);
      expect(formattedURL).toBe(testURL);

      const randomString = 'abcdefghijklmnopqrstuvwxyz';
      const formattedRandomString = formatEmailAddress(randomString);
      expect(formattedRandomString).toBe(randomString);
    });
  });

  describe('isSkiffAddress', () => {
    const customDomains = ['skiff.money', 'skiff.earth'];
    it('check getMailDomain (town/city/com) works', async () => {
      const address = 'test@skiff.town';
      expect(isSkiffAddress(address, customDomains)).toBe(true);
    });
    it('check skiff custom domains', () => {
      const address = 'test@skiff.money';
      expect(isSkiffAddress(address, customDomains)).toBe(true);
    });
    it('check non skiff domain', () => {
      const address = 'test@skiff.me';
      expect(isSkiffAddress(address, customDomains)).toBe(false);
    });
  });
});
