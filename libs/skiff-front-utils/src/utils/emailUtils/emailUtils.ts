import { getTierNameFromSubscriptionPlan, SubscriptionPlan } from 'skiff-graphql';
import {
  assert,
  isShortAlias,
  isSkiffAddress,
  getMaxNumberNonWalletAliases,
  removeDots,
  getCategorizedAliases,
  isCryptoAddress,
  isENSName,
  isSolanaAddress
} from 'skiff-utils';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

import { MAIL_DOMAIN } from '../getMailDomain';
import { isCosmosHubAddress } from '../walletUtils';

import { ALIAS_MAXIMUM_LENGTH } from './emailUtils.constants';

// Frontend validation that mail alias matches criteria. These are for error messages
// shown pre submit.
export const preSubmitAliasValidation = (mailAlias: string) => {
  const ALIAS_CHARSET_REGEX = /^[.a-zA-Z0-9]*$/;
  const aliasWithoutDots = removeDots(mailAlias);

  // Keep message short so that it fits in one line under the email input field.
  // Otherwise there will be layout shift.
  assert(aliasWithoutDots.match(ALIAS_CHARSET_REGEX), 'Email address may only contain numbers, letters, and periods.');
  assert(aliasWithoutDots.length <= ALIAS_MAXIMUM_LENGTH, 'Email address is too long.');
};

// Frontend validation that mail alias matches criteria. These are for error messages
// shown after submitting.
export const postSubmitAliasValidation = (mailAlias: string) => {
  const ALIAS_REGEX = /^[a-zA-Z0-9]([.]{0,1}[a-zA-Z0-9])*$/;
  const ALIAS_START_END_REGEX = /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

  assert(mailAlias.match(ALIAS_START_END_REGEX), 'Email address must begin and end with a letter or number.');
  assert(mailAlias.match(ALIAS_REGEX), 'Email address may not contain consecutive periods.');
};

export const getEndAdornment = (isUdAlias: boolean, username: string): string => {
  if (isUdAlias) {
    return '@ud.me';
  } else if (isCosmosHubAddress(username)) {
    return '@keplr.xyz';
  } else {
    return `@${MAIL_DOMAIN}`;
  }
};

// crypto addresses for which we can link to an external lookup, e.g. Etherscan
export function isWalletLookupSupported(emailAlias: string) {
  return isEthereumAddress(emailAlias) || isSolanaAddress(emailAlias) || isENSName(emailAlias);
}

/**
 * Check whether a given address should be considered a pay-gated feature
 * @param emailAddress the address to check
 * @param userEmailAddresses a list of all a user's addresses
 * @param currentPlan the user's current plan
 * @returns {boolean} whether address is paid exclusive
 */

export function isPaidTierExclusiveEmailAddress(
  emailAddress: string,
  userEmailAddresses: string[],
  currentPlan: SubscriptionPlan
): boolean {
  // wallet addresses have special allowances; we don't consider them paid-tier exclusive
  // regardless of how many a user has
  if (isCryptoAddress(emailAddress)) {
    return false;
  }
  const { genericSkiffAliases } = getCategorizedAliases(userEmailAddresses);
  const currentTier = getTierNameFromSubscriptionPlan(currentPlan);
  const maxNumNonWalletSkiffAliases = getMaxNumberNonWalletAliases(currentTier);
  // if a user currently has more aliases than their plan allows, we consider every alias
  // to be paid-tier-exclusive, since the aggregate is over the allowance
  const hasTooManyAliases = genericSkiffAliases.length > maxNumNonWalletSkiffAliases;
  // if a non-wallet address is not a skiff address, it is paid-tier-exclusive; as is a short alias
  if (!isSkiffAddress(emailAddress) || isShortAlias(emailAddress) || hasTooManyAliases) {
    return true;
  }
  return false;
}
