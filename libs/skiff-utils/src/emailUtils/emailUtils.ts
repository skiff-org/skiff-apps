import partition from 'lodash/partition';
import isBtcAddress from 'validator/lib/isBtcAddress';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

import { SKIFF_ALIAS_MIN_LENGTH, SHORT_ALIAS_MIN_LENGTH } from '../constants';
import { getMailDomain } from '../customDomainUtils';
import { isENSName } from '../wallet/isENSName';
import {
  isCosmosHubAddress,
  isSolanaAddress,
  isJunoAddress,
  isICNSName,
  isBonfidaName,
  isUDAddress
} from '../walletUtils';

export function removeDots(emailAlias: string) {
  return emailAlias.replaceAll('.', '');
}

export function isShortAlias(address: string) {
  const [alias] = address.split('@');
  const aliasWithoutDots = removeDots(alias);
  return aliasWithoutDots.length < SKIFF_ALIAS_MIN_LENGTH && aliasWithoutDots.length >= SHORT_ALIAS_MIN_LENGTH;
}

export const MAX_SIGNATURE_SIZE_KB = 500;

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
  return isWalletOrNameServiceAddress(alias) || isUDAddress(emailAddress);
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
  const genericSkiffAliases = nonCryptoAliases.filter(isGenericSkiffAddress);
  const shortGenericSkiffAliases = genericSkiffAliases.filter(isShortAlias);
  return { cryptoAliases, nonCryptoAliases, genericSkiffAliases, shortGenericSkiffAliases };
}
