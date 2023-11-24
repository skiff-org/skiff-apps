import { TierName } from 'skiff-utils';

import { isPaidUpExclusiveEmailAddress } from '../src';

jest.mock('@simplewebauthn/browser');

const defaultQuickAliasUsage = {
  quickAliases: 0,
  quickAliasSubdomains: 0
};

describe('isPaidUpExclusiveEmailAddress', () => {
  //test env uses skiff.town EMAIL_DOMAIN
  it('correctly checks paid tier exclusivity when user has custom domains and short aliases', () => {
    const aliases = [
      'short@skiff.town',
      'shor@skiff.town',
      'short@customdomain.town',
      '1234@notskiff.town',
      'longalias@skiff.town',
      'longalias@customdomain.town'
    ];
    //short skiff alias
    const shortSkiffAlias = aliases[0];
    const genericSkiffAlias = aliases[4];
    const customDomainAlias = aliases[5];
    expect(isPaidUpExclusiveEmailAddress(shortSkiffAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      true
    );
    expect(isPaidUpExclusiveEmailAddress(genericSkiffAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      false
    );
    expect(isPaidUpExclusiveEmailAddress(customDomainAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      true
    );
  });
  it('correctly checks paid tier exclusivity when user has no short aliases', () => {
    const aliases = ['notshort@skiff.town', 'notshort@customdomain.town', 'longalias@skiff.town', 'a.eth'];
    const ethAlias = aliases[3];
    const customDomainAlias = aliases[1];
    const genericSkiffaLIAS = aliases[0];
    expect(isPaidUpExclusiveEmailAddress(ethAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(false);
    expect(isPaidUpExclusiveEmailAddress(customDomainAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      true
    );
    expect(isPaidUpExclusiveEmailAddress(genericSkiffaLIAS, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      false
    );
  });
  it('correctly checks paid tier exclusivity when only custom domains and wallet addresses present', () => {
    const aliases = ['1234@notskiff.town', '2345@notskiff.town', '3456@notskiff.town', 'abc.eth', 'xyz.eth'];
    const customDomainAlias = aliases[0];
    const ethAlias = aliases[3];
    expect(isPaidUpExclusiveEmailAddress(customDomainAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      true
    );
    expect(isPaidUpExclusiveEmailAddress(ethAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(false);
  });
  it('correctly handles array with 5 generic skiff aliases', () => {
    const aliases = [
      'xxxx@skiff.town',
      'longalias@skiff.town',
      'anotherlongalias@skiff.town',
      'somealias@skiff.town',
      'someotheralias@skiff.town'
    ];
    const shortSkiffAlias = aliases[0];
    const longSkiffAlias = aliases[1];
    expect(isPaidUpExclusiveEmailAddress(shortSkiffAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      true
    );
    // even long alias is considered paid exclusive if user has too many generic aliases for their tier
    expect(isPaidUpExclusiveEmailAddress(longSkiffAlias, aliases, TierName.Free, defaultQuickAliasUsage, [])).toBe(
      true
    );
    expect(
      isPaidUpExclusiveEmailAddress(shortSkiffAlias, aliases, TierName.Essential, defaultQuickAliasUsage, [])
    ).toBe(true);
    expect(isPaidUpExclusiveEmailAddress(longSkiffAlias, aliases, TierName.Essential, defaultQuickAliasUsage, [])).toBe(
      false
    );
    expect(isPaidUpExclusiveEmailAddress(shortSkiffAlias, aliases, TierName.Pro, defaultQuickAliasUsage, [])).toBe(
      true
    );
    expect(isPaidUpExclusiveEmailAddress(longSkiffAlias, aliases, TierName.Pro, defaultQuickAliasUsage, [])).toBe(
      false
    );
    expect(isPaidUpExclusiveEmailAddress(shortSkiffAlias, aliases, TierName.Business, defaultQuickAliasUsage, [])).toBe(
      true
    );
    expect(isPaidUpExclusiveEmailAddress(longSkiffAlias, aliases, TierName.Business, defaultQuickAliasUsage, [])).toBe(
      false
    );
  });
});
it('correctly handles quick alias and subdomain delinquency', () => {
  const aliases = [
    'xxxx@skiff.town',
    'longalias@skiff.town',
    'anotherlongalias@skiff.town',
    'somealias@skiff.town',
    'someotheralias@skiff.town'
  ];
  const rootSubdomains = ['skiff.house', 'skiff.club'];
  const quickAlias1 = 'test@skiff.house';
  const quickAlias2 = 'test@skiff.club';
  const badStandingSubdomainUsage = {
    ...defaultQuickAliasUsage,
    quickAliasSubdomains: 3
  };
  const badStandingQuickAliasUsage = {
    ...defaultQuickAliasUsage,
    quickAliases: 11
  };
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias1, aliases, TierName.Free, badStandingSubdomainUsage, rootSubdomains)
  ).toBe(true);
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias2, aliases, TierName.Free, badStandingSubdomainUsage, rootSubdomains)
  ).toBe(true);
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias1, aliases, TierName.Free, badStandingQuickAliasUsage, rootSubdomains)
  ).toBe(true);
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias2, aliases, TierName.Free, badStandingQuickAliasUsage, rootSubdomains)
  ).toBe(true);
  // no limit on quick aliases for paid plans
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias1, aliases, TierName.Essential, badStandingQuickAliasUsage, rootSubdomains)
  ).toBe(false);
  // limit does apply to subdomains
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias1, aliases, TierName.Essential, badStandingSubdomainUsage, rootSubdomains)
  ).toBe(true);
  // business plan is in good standing with 3 subdomains
  expect(
    isPaidUpExclusiveEmailAddress(quickAlias1, aliases, TierName.Business, badStandingSubdomainUsage, rootSubdomains)
  ).toBe(false);
});
