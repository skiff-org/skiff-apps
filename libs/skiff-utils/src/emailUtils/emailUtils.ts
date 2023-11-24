import partition from 'lodash/partition';
import isBtcAddress from 'validator/lib/isBtcAddress';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

import { SHORT_ALIAS_MIN_LENGTH, SKIFF_ALIAS_MIN_LENGTH } from '../constants';
import { getMailDomain } from '../customDomainUtils';
import { isENSName } from '../wallet/isENSName';
import {
  isBonfidaName,
  isCosmosHubAddress,
  isICNSName,
  isJunoAddress,
  isSolanaAddress
} from '../walletUtils';

import FamiliarNames from './familiarNames.json';

const FAMILIAR_NAMES_LOWERCASE = FamiliarNames.names.map((name) => name.toLowerCase());
const FAMILIAR_USERNAMES_SET = new Set(FAMILIAR_NAMES_LOWERCASE);

export function removeDots(emailAlias: string) {
  return emailAlias.replaceAll('.', '');
}

/** An alias is considered "short" if it is either 4 or 5 characters and is NOT a premium username. */
export function isShortAlias(address: string) {
  const [alias] = address.split('@');
  const aliasWithoutDots = removeDots(alias);
  return (
    aliasWithoutDots.length < SKIFF_ALIAS_MIN_LENGTH &&
    aliasWithoutDots.length >= SHORT_ALIAS_MIN_LENGTH &&
    !isPremiumUsername(alias)
  );
}

export const MAX_SIGNATURE_SIZE_KB = 5000;

/**
 * Checks if the given alias is a wallet name service alias (e.g. ENS, ICNS)
 */
export function isNameServiceAddress(emailAlias: string): boolean {
  return isENSName(emailAlias) || isBonfidaName(emailAlias) || isICNSName(emailAlias);
}

/**
 * Checks if the given alias is a wallet address.
 * @returns True if the alias is a wallet address. False otherwise.
 */
export function isWalletAddress(emailAlias: string): boolean {
  return (
    isEthereumAddress(emailAlias) ||
    isBtcAddress(emailAlias) ||
    isSolanaAddress(emailAlias) ||
    isCosmosHubAddress(emailAlias) ||
    isJunoAddress(emailAlias)
  );
}

/**
 * Checks if the given alias is a wallet address.
 * @returns True if alias is a wallet address. False otherwise.
 */
export function isWalletOrNameServiceAddress(emailAlias: string): boolean {
  return isWalletAddress(emailAlias) || isNameServiceAddress(emailAlias);
}

/**
 * Checks if the given address is any crypto-associated address, including wallets, naming services, and e.g. UnstoppableDomains.
 * @returns True if address is a crypto address. False otherwise.
 */
export function isCryptoAddress(emailAddress: string) {
  const [alias] = emailAddress.split('@');
  return isWalletOrNameServiceAddress(alias);
}

const rootQuickAliasSubdomains = ['skiff.house', 'skiff.club', 'maskmy.id', 'mailbox.zip'];

export function isQuickAlias(emailAddress: string) {
  const [, domain] = emailAddress.split('@');
  return rootQuickAliasSubdomains.some((subdomain) => domain.includes(subdomain));
}

// only generic skiff addresses (i.e. ending in skiff.com, not in keplr.xyz) count against a user's alias budget
export const isGenericSkiffAddress = (address: string) => {
  const domain = address.slice(address.lastIndexOf('@') + 1);
  return domain === getMailDomain();
};

/**
 * Sorts a user's aliases into relevant categories, particularly with respect to paid-tier limits.
 * @returns four categorized arrays. cryptoAliases and nonCryptoAliases have no overlap. genericSkiffAliases
 * are a subset of nonCryptoAliases, while shortSkiffAliases are a subset of genericSkiffAliases.
 */
export function getCategorizedAliases(userEmailAliases: string[]) {
  const [cryptoAliases, nonCryptoAliases] = partition(userEmailAliases, isCryptoAddress);
  // sort non-crypto aliases alphabetically by custom domain, then by alias
  nonCryptoAliases.sort((a, b) => {
    const [aliasA, domainA] = a.split('@');
    const [aliasB, domainB] = b.split('@');
    if (domainA !== domainB) {
      return domainA.localeCompare(domainB);
    }
    return aliasA.localeCompare(aliasB);
  });
  const nonCryptoOrQuickAliases = nonCryptoAliases.filter((alias) => !isQuickAlias(alias));

  const genericSkiffAliases = nonCryptoAliases.filter(isGenericSkiffAddress);
  const shortGenericSkiffAliases = genericSkiffAliases.filter(isShortAlias);
  return { cryptoAliases, nonCryptoAliases, genericSkiffAliases, shortGenericSkiffAliases, nonCryptoOrQuickAliases };
}

export function isFamiliarName(alias: string): boolean {
  return FAMILIAR_USERNAMES_SET.has(removeDots(alias).toLowerCase());
}

/**
 * Checks whether an alias is considered "premium", which is true
 * if it is a familiar name OR less than 4 characters.
 */
export function isPremiumUsername(alias: string): boolean {
  alias = removeDots(alias);
  return isFamiliarName(alias) || alias.length < SHORT_ALIAS_MIN_LENGTH;
}

/**
 * Returns up to `limit` suggestions for a given premium username
 */
export function getPremiumUsernameSuggestions(alias: string, limit: number): string[] {
  // TODO: Update logic to use string Levenshtein or similar, rather than just prefix
  if (!alias) {
    return [];
  }
  // Get shortest, most expensive names
  return FAMILIAR_NAMES_LOWERCASE.filter((p) => p[0] === alias.toLowerCase()[0] && p !== alias.toLowerCase())
    .sort((a, b) => a.length - b.length)
    .slice(0, limit);
}

/**
 * Returns the price of a premium username, or `null` if it's not a premium username.
 */
export function getPremiumUsernamePrice(alias: string): number | null {
  const aliasWithoutDots = removeDots(alias);
  if (!isPremiumUsername(aliasWithoutDots)) {
    return null;
  }

  switch (aliasWithoutDots.length) {
    case 1:
      return 300;
    case 2:
      return 120;
    case 3:
    case 4:
    case 5:
    default:
      return 80;
  }
}
