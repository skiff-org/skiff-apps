// TODO (EMAIL-1699): deduplicate utils
import { NormalizedCacheObject } from '@apollo/client';
import { ApolloClient } from '@apollo/client/core';
import {
  CreateWalletChallengeSkemailDocument,
  CreateWalletChallengeSkemailMutation,
  CreateWalletChallengeSkemailMutationVariables
} from 'skiff-front-graphql';
import { getSIWEChallengeString, isENSName } from 'skiff-utils';

const resolveENSName = async (provider: any, ensName: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const address = await provider.resolveName(ensName);
  if (!address) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return address;
};

/**
 * Get Ethereum address from ENS name.
 * @param {string} ensName - ENS addr.
 * @returns {string | undefined} Ethereum address or undefined.
 */
export async function getEthAddrFromENSName(ensName: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const ethereum = (window as any).ethereum;
  if (!ethereum) return undefined;
  if (!isENSName(ensName)) return undefined;
  try {
    const { default: ethers } = await import('ethers');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ens = new ethers.providers.Web3Provider(ethereum);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await resolveENSName(ens, ensName);
  } catch (error) {
    console.error('Eth from ENS', error);
    return undefined;
  }
}

/**
 * Lookup ENS name from eth addr.
 * @param {string} ethAddr - Ethereum address.
 * @returns {string | undefined} ENS name or undefined.
 */
export async function getENSNameFromEthAddr(ethAddr: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const ethereum = (window as any).ethereum;
  if (!ethereum) return undefined;
  try {
    const { default: ethers } = await import('ethers');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const provider = new ethers.providers.Web3Provider(ethereum);
    const name = await provider.lookupAddress(ethAddr);
    if (!name) return undefined;
    // make sure forward resolution works - very important to check both directions
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const address = await resolveENSName(provider, name);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return ethAddr.toLowerCase() === address?.toLowerCase() ? name : undefined;
  } catch (error) {
    console.error('ENS from Eth', error);
    return undefined;
  }
}

/**
 * Get and sign challenge from server with eth public key. Uses SIWE signing.
 * @param {string} ethAddr - Eth address.
 * @returns {Promise<{token, signature}>} - Token and signature.
 */
export async function getAndSignChallenge(
  ethAddr: string,
  client: ApolloClient<NormalizedCacheObject>,
  provider?: any
): Promise<{ token?: string; signedToken?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const ethereum = provider ?? window?.ethereum;
  const response = await client.mutate<
    CreateWalletChallengeSkemailMutation,
    CreateWalletChallengeSkemailMutationVariables
  >({
    mutation: CreateWalletChallengeSkemailDocument,
    variables: {
      request: {
        walletAddress: ethAddr
      }
    }
  });
  // For docs, see https://docs.metamask.io/wallet/how-to/use-siwe/
  // For code reference, see https://github.com/MetaMask/test-dapp/blob/8cc0a641f25e015f7a726ee3c59263a06c616db1/src/index.js#L1286
  // For EIP reference, see https://eips.ethereum.org/EIPS/eip-4361
  const token = response.data?.createWalletChallengeSkemail.token;
  if (!token) {
    console.error('no challenge token');
    return {};
  }
  type JWTBody = {
    iat: number;
    exp: number;
  };

  let unverifiedBody: JWTBody;
  try {
    // IMPORTANT: We do not need to strip out the token prefix skiff_signup_ because we split on '.' to get the JWT body
    // We also do not verify the body of this token as the backend only needs to do the verification
    // Source: https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
    const base64UrlFull = token.split('.');
    if (base64UrlFull.length < 1) {
      throw Error(`Challenge JWT from server appears to be malformed: ${token}`);
    }
    const base64Url = base64UrlFull[1];
    const base64 = base64Url?.replace(/-/g, '+').replace(/_/g, '/') ?? '';
    const unverifiedBodyString = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    unverifiedBody = JSON.parse(unverifiedBodyString) as JWTBody;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.error(`Unable to parse challenge token from server: ${e}`);
    return {};
  }

  const issuanceTime = new Date(unverifiedBody?.iat * 1000);
  const expiryTime = new Date(unverifiedBody.exp * 1000);

  const siweMessage = getSIWEChallengeString({
    domain: window.location.host,
    publicAddress: ethAddr,
    token,
    issuanceTime,
    expiryTime
  });

  const message = `0x${Buffer.from(siweMessage, 'utf8').toString('hex')}`;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const signedToken: string = await ethereum.request({
    method: 'personal_sign',
    params: [message, ethAddr]
  });
  return { token, signedToken };
}
