import { fromBech32, toBech32 } from '@cosmjs/encoding/build/bech32';
import { fromHex, toHex } from '@cosmjs/encoding/build/hex';
import { Bech32Address } from '@keplr-wallet/cosmos/build/bech32';
import isBase58 from 'validator/lib/isBase58';

import {
  COSMOS_HUB_PREFIX,
  JUNO_PREFIX,
  SUPPORTED_ICNS_PREFIXES
} from './constants';
import { BONFIDA_SUFFIX } from './walletUtils.constants';
/**
 * Checks if the given alias is a Solana address.
 * @returns True if the alias is a Solana wallet address. False otherwise.
 */
export function isSolanaAddress(publicAddress: string): boolean {
  // Solana addresses are at least 32 chars long.
  // We must check for the length as well as the base encoding as aliases that
  // are not wallet address such as 'test' will return isBase58 as true
  return publicAddress.length >= 32 && isBase58(publicAddress);
}

function isCosmosAddress(publicAddress: string, prefix: string): boolean {
  // Cosmos addresses are bech32 encoded addresses with an HRP depending on the zone
  // https://docs.cosmos.network/master/spec/addresses/bech32.html
  try {
    Bech32Address.validate(publicAddress, prefix);
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Checks if the given alias is a Cosmos Hub address
 * @returns True if the email address is a valid Cosmos Hub address. False otherwise.
 */
export function isCosmosHubAddress(publicAddress: string): boolean {
  return isCosmosAddress(publicAddress, COSMOS_HUB_PREFIX);
}

/**
 * Checks if the given alias is a Juno address
 * @returns True if the email address is a valid Juno address. False otherwise.
 */
export function isJunoAddress(publicAddress: string): boolean {
  return isCosmosAddress(publicAddress, JUNO_PREFIX);
}

/**
 * Converts Cosmos Hub address to Juno address
 */
export function getJunoAddress(cosmosHubAddress: string): string {
  if (!isCosmosHubAddress(cosmosHubAddress)) {
    throw new Error('Not a Cosmos Hub address');
  }
  const { data } = fromBech32(cosmosHubAddress);
  return toBech32(JUNO_PREFIX, fromHex(toHex(data)));
}

/**
 * Converts Juno address to CosmosHub address
 */
export function getCosmosHubAddress(junoAddress: string): string {
  if (!isJunoAddress(junoAddress)) {
    throw new Error('Not a Juno address');
  }
  const { data } = fromBech32(junoAddress);
  return toBech32(COSMOS_HUB_PREFIX, fromHex(toHex(data)));
}

export function isBonfidaName(name: string) {
  return name.endsWith(BONFIDA_SUFFIX) && name.length > BONFIDA_SUFFIX.length;
}

export function isICNSName(alias: string) {
  const canonicalAlias = alias.toLowerCase();
  return SUPPORTED_ICNS_PREFIXES.some((prefix) => canonicalAlias.endsWith(`.${prefix}`));
}

/**
 * Get Sign In With Ethereum Challenge String that will be signed by the frontend and veried by the backend
 * For EIP reference, see https://eips.ethereum.org/EIPS/eip-4361
 * @param args.publicAddress string Ethereum address requested to verify
 * @param args.domain string Domain requested usually app.skiff.town, app.skiff.city, and app.skiff.com
 * @param args.token string Nonce which is a skiff_login_<JWT>
 * @param args.issuanceTime Date the time the challange or the JWT token was issued
 * @param args.expiryTime Date the time the challange or the JWT token will expire
 * @returns
 */
export function getSIWEChallengeString(args: {
  publicAddress: string;
  domain: string;
  token: string;
  issuanceTime: Date;
  expiryTime: Date;
}): string {
  // Nonce must be alphanumeric so we have to hack around JWTs
  // This is a hack
  const alphanumtoken = args.token
    .replaceAll('_', 'UNDERSCORE')
    .replaceAll('.', 'DOT')
    .replaceAll('-', 'DASH')
    .replaceAll('=', 'EQUALS');

  args.domain = args.domain.endsWith('localhost:1212') ? 'app.skiff.town' : args.domain;
  const protocol = 'https';

  return `${args.domain} wants you to sign in with your Ethereum account:\n${
    args.publicAddress
  }\n\nI accept the Skiff Terms of Service: https://skiff.com/terms-of-service\n\nURI: ${protocol}://${
    args.domain
  }\nVersion: 1\nChain ID: 1\nNonce: ${alphanumtoken}\nIssued At: ${args.issuanceTime.toISOString()}\nExpiration Time: ${args.expiryTime.toISOString()}`;
}
