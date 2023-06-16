import { SubscriptionPlan } from 'skiff-graphql';

import { isPaidTierExclusiveEmailAddress } from '../src';

jest.mock('@simplewebauthn/browser');

describe('isPaidTierExclusiveEmailAddress', () => {
  //test env uses skiff.town EMAIL_DOMAIN
  it('correctly checks paid tier exclusivity when user has custom domains and short aliases', () => {
    const aliases = [
      'short@skiff.town',
      'shor@skiff.town',
      'short@customdomain.town',
      '1234@notskiff.town',
      'longalias@skiff.town',
      'longalias@customdomain.town',
      'alias@ud.me'
    ];
    //short skiff alias
    const shortSkiffAlias = aliases[0];
    const genericSkiffAlias = aliases[4];
    const customDomainAlias = aliases[5];
    const unstoppableDomainsAlias = aliases[6];
    expect(isPaidTierExclusiveEmailAddress(shortSkiffAlias, aliases, SubscriptionPlan.Free)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(genericSkiffAlias, aliases, SubscriptionPlan.Free)).toBe(false);
    expect(isPaidTierExclusiveEmailAddress(customDomainAlias, aliases, SubscriptionPlan.Free)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(unstoppableDomainsAlias, aliases, SubscriptionPlan.Free)).toBe(false);
  });
  it('correctly checks paid tier exclusivity when user has no short aliases', () => {
    const aliases = ['notshort@skiff.town', 'notshort@customdomain.town', 'longalias@skiff.town', 'a.eth'];
    const ethAlias = aliases[3];
    const customDomainAlias = aliases[1];
    const genericSkiffaLIAS = aliases[0];
    expect(isPaidTierExclusiveEmailAddress(ethAlias, aliases, SubscriptionPlan.Free)).toBe(false);
    expect(isPaidTierExclusiveEmailAddress(customDomainAlias, aliases, SubscriptionPlan.Free)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(genericSkiffaLIAS, aliases, SubscriptionPlan.Free)).toBe(false);
  });
  it('correctly checks paid tier exclusivity when only custom domains and wallet addresses present', () => {
    const aliases = ['1234@notskiff.town', '2345@notskiff.town', '3456@notskiff.town', 'abc.eth', 'xyz.eth'];
    const customDomainAlias = aliases[0];
    const ethAlias = aliases[3];
    expect(isPaidTierExclusiveEmailAddress(customDomainAlias, aliases, SubscriptionPlan.Free)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(ethAlias, aliases, SubscriptionPlan.Free)).toBe(false);
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
    expect(isPaidTierExclusiveEmailAddress(shortSkiffAlias, aliases, SubscriptionPlan.Free)).toBe(true);
    // even long alias is considered paid exclusive if user has too many generic aliases for their tier
    expect(isPaidTierExclusiveEmailAddress(longSkiffAlias, aliases, SubscriptionPlan.Free)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(shortSkiffAlias, aliases, SubscriptionPlan.Essential)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(longSkiffAlias, aliases, SubscriptionPlan.Essential)).toBe(false);
    expect(isPaidTierExclusiveEmailAddress(shortSkiffAlias, aliases, SubscriptionPlan.Pro)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(longSkiffAlias, aliases, SubscriptionPlan.Pro)).toBe(false);
    expect(isPaidTierExclusiveEmailAddress(shortSkiffAlias, aliases, SubscriptionPlan.Business)).toBe(true);
    expect(isPaidTierExclusiveEmailAddress(longSkiffAlias, aliases, SubscriptionPlan.Business)).toBe(false);
  });
});
