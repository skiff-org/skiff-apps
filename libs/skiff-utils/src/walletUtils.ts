import { fromBech32, toBech32 } from '@cosmjs/encoding/build/bech32';
import { fromHex, toHex } from '@cosmjs/encoding/build/hex';
import { Bech32Address } from '@keplr-wallet/cosmos/build/bech32';
import { MessageTypeProperty, recoverTypedSignature, SignTypedDataVersion } from '@metamask/eth-sig-util';
import isBase58 from 'validator/lib/isBase58';

import {
  COSMOS_HUB_PREFIX,
  JUNO_PREFIX,
  SUPPORTED_ICNS_PREFIXES,
  UNSTOPPABLE_ALIAS_SUFFIX,
  UNSTOPPABLE_CUSTOM_DOMAIN
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

// Type for the signed message sent from the frontend; needed fo signature check
type MessageTokenType = [{ name: 'skiffLoginToken'; type: 'string' }, { name: 'contents'; type: 'string' }];

// Message type for v4 signature recovery; shared with frontend
type MessageTypes = {
  EIP712Domain: MessageTypeProperty[];
  Token: MessageTokenType;
};

/**
 * Recover address given signature and challenge. Then, check whether it matches public address.
 * @param {string} publicAddress - Public address.
 * @param {string} challengeJwt - Challenge string.
 * @param {string} challengeSignature - Signature.
 * @returns {boolean} Whether recovered address matches.
 */
export function recoverEthereumAddressAndCheckMatch(
  publicAddress: string,
  challengeJwt: string,
  challengeSignature: string
) {
  const signedData = {
    domain: {
      name: 'Skiff',
      version: '0.1'
    },
    primaryType: 'Token' as const,
    message: {
      contents: 'Skiff signature',
      skiffLoginToken: challengeJwt
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' }
      ],
      Token: [
        { name: 'skiffLoginToken', type: 'string' },
        { name: 'contents', type: 'string' }
      ] as MessageTokenType
    }
  };
  try {
    const recoveredAddress = recoverTypedSignature<SignTypedDataVersion.V4, MessageTypes>({
      data: signedData,
      signature: challengeSignature,
      version: SignTypedDataVersion.V4
    });
    // noting - ethereum addresses are case insensitive
    return recoveredAddress.toLowerCase() === publicAddress.toLowerCase();
  } catch (error) {
    console.error(error);
  }
  return false;
}

/**
 * Determine whether the address is associated with an Unstoppable Domain.
 * @param address - email address (with domain)
 * @returns whether address is UD
 */
export function isUDAddress(address: string) {
  const [alias, domain] = address.split('@');
  return alias.endsWith(UNSTOPPABLE_ALIAS_SUFFIX) || domain === UNSTOPPABLE_CUSTOM_DOMAIN;
}

export function isBonfidaName(name: string) {
  return name.endsWith(BONFIDA_SUFFIX) && name.length > BONFIDA_SUFFIX.length;
}

export function isICNSName(alias: string) {
  const canonicalAlias = alias.toLowerCase();
  return SUPPORTED_ICNS_PREFIXES.some((prefix) => canonicalAlias.endsWith(`.${prefix}`));
}
