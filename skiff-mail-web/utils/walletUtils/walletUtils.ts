// TODO (EMAIL-1699): deduplicate utils
import { Keplr } from '@keplr-wallet/types/build/wallet/keplr';
import {
  CreateWalletChallengeSkemailDocument,
  CreateWalletChallengeSkemailMutation,
  CreateWalletChallengeSkemailMutationVariables
} from 'skiff-front-graphql';
import { COSMOS_CHAIN_ID } from 'skiff-front-utils';
import { isENSName, isSolanaAddress } from 'skiff-utils';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

import client from '../../apollo/client';
import { getAndSignChallenge, getEthAddr } from '../metamaskUtils';

import { ETHERSCAN_ADDRESS_LOOKUP_URL, ETHERSCAN_ENS_LOOKUP_URL, SOLANA_LOOKUP_URL } from './walletUtils.constants';

/**
 * Gets a token to sign to verify address.
 * @param {string} walletAddress - Address to verify.
 * @returns {string} Token to sign.
 */
export async function getSkemailChallengeToken(walletAddress: string) {
  const response = await client.mutate<
    CreateWalletChallengeSkemailMutation,
    CreateWalletChallengeSkemailMutationVariables
  >({
    mutation: CreateWalletChallengeSkemailDocument,
    variables: {
      request: {
        walletAddress: walletAddress
      }
    }
  });
  const token = response.data?.createWalletChallengeSkemail.token;
  return token;
}

/**
 * Connect an Ethereum wallet and get the challenge signature
 * @param provider the Ethereum provider to connect to
 * @returns the challenge and challenge signature
 */
export const connectEthWallet = async (provider: any) => {
  // connect wallet
  const userAddr = await getEthAddr(provider);
  if (!userAddr) {
    throw new Error('Could not get eth address');
  }
  const { token, signedToken } = await getAndSignChallenge(userAddr, true, provider);
  if (!token || !signedToken) {
    throw new Error('Could not get challenge');
  }
  return { challenge: token, challengeSignature: signedToken };
};

/**
 * Connect an Solana wallet and get the challenge signature
 * @param provider the Solana provider to connect to
 * @returns the challenge and challenge signature
 */
export const connectSolWallet = async (provider: any) => {
  // connect to wallet
  const response = await provider.connect();
  const publicKey = response.publicKey.toString();
  // get challenge
  const challenge = await getSkemailChallengeToken(publicKey);
  if (!challenge) {
    throw new Error('Could not get challenge');
  }
  const encodedMessage = new TextEncoder().encode(challenge);
  // sign challenge
  const signatureData = await provider.signMessage(encodedMessage, 'utf8');
  const { base58 } = await import('ethers/lib/utils');
  return { challenge, challengeSignature: base58.encode(signatureData.signature) };
};

export const connectCosmosWallet = async (provider: Keplr) => {
  const { bech32Address: userAddr } = await provider.getKey(COSMOS_CHAIN_ID);
  if (!userAddr) {
    throw new Error('Could not get cosmos address');
  }
  const token = await getSkemailChallengeToken(userAddr);
  if (!token) {
    throw new Error('Could not get challenge');
  }
  const { signature } = await provider.signArbitrary(COSMOS_CHAIN_ID, userAddr, token);
  if (!token || !signature) {
    throw new Error('Could not get challenge');
  }
  return { challenge: token, challengeSignature: signature };
};

/**
 * Opens up the wallet address lookup page in a new tab
 * @param wallet the wallet to look up
 */
export const openWalletLookupLink = (wallet: string) => {
  if (!wallet) return;

  let link = '';
  if (isEthereumAddress(wallet)) {
    link = `${ETHERSCAN_ADDRESS_LOOKUP_URL}${wallet}`;
  }
  if (isENSName(wallet)) {
    link = `${ETHERSCAN_ENS_LOOKUP_URL}${wallet}`;
  }
  if (isSolanaAddress(wallet)) {
    link = `${SOLANA_LOOKUP_URL}${wallet}`;
  }
  if (link) window.open(link, '_blank');
};

/**
 * Returns the wallet look up copy for the look up link (ie etherscan, solana)
 * @param wallet the wallet address to get the copy for
 * @returns the look up copy
 */
export const getWalletLookUpText = (wallet: string): string => {
  if (!wallet) return '';

  if (isEthereumAddress(wallet) || isENSName(wallet)) {
    return 'View on Etherscan';
  }
  if (isSolanaAddress(wallet)) {
    return 'View on Solana';
  }
  return '';
};
