import { validateDomain, sanitizeDomain } from 'skiff-utils';

describe('customDomainUtils', () => {
  describe('validateDomain', () => {
    it('throws on invalid address', () => {
      const invalidDomain = 'giraffe:.com';
      expect(() => validateDomain(invalidDomain)).toThrow();
    });
    it('throws on invalid address with space', () => {
      const invalidDomain = 'giraffe .com';
      expect(() => validateDomain(invalidDomain)).toThrow();
    });
    it('throws on invalid address with trailing space', () => {
      const invalidDomain = 'giraffe.com ';
      expect(() => validateDomain(invalidDomain)).toThrow();
    });
    it('throws on invalid address with starting invalid char', () => {
      const invalidDomain = '.giraffe.com';
      expect(() => validateDomain(invalidDomain)).toThrow();
    });

    it('does not throw on valid address with multiple periods and hyphens', () => {
      const validDomain = 'giraffes-eat-from-tall.branches.biz.gov';
      expect(() => validateDomain(validDomain)).not.toThrow();
    });
    it('does not throw on valid address ', () => {
      const validDomain = 'giraffe.com';
      expect(() => validateDomain(validDomain)).not.toThrow();
    });
  });
  describe('sanitizeDomain', () => {
    it('can strip illegal characters', () => {
      const pollutedDomain = '...gold!!en--cor~~~~*r&al.com';
      expect(sanitizeDomain(pollutedDomain)).toBe('golden-corral.com');
    });
    it('can strip trailing and opening periods and hyphens', () => {
      const pollutedDomain = '.www.golden.corral.com-';
      expect(sanitizeDomain(pollutedDomain)).toBe('www.golden.corral.com');
    });
  });
});
