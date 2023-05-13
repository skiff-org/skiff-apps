// TODO (EMAIL-1699): deduplicate utils
import {
  CreateWalletChallengeSkemailDocument,
  CreateWalletChallengeSkemailMutation,
  CreateWalletChallengeSkemailMutationVariables
} from 'skiff-front-graphql';
import { isENSName } from 'skiff-utils';

import client from '../apollo/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isWalletEnabled = () =>
  !!(window as any).ethereum || !!(window as any).phantom || !!(window as any).solana;

const resolveENSName = async (provider: any, ensName: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const address = await provider.resolveName(ensName);
  if (!address) return undefined;
  return address;
};

/**
 * Get Ethereum address from ENS name.
 * @param {string} ensName - ENS addr.
 * @returns {string | undefined} Ethereum address or undefined.
 */
export async function getEthAddrFromENSName(ensName: string) {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return undefined;
  if (!isENSName(ensName)) return undefined;
  try {
    const { default: ethers } = await import('ethers');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ens = new ethers.providers.Web3Provider(ethereum);
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
  const ethereum = (window as any).ethereum;
  if (!ethereum) return undefined;
  try {
    const { default: ethers } = await import('ethers');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const provider = new ethers.providers.Web3Provider(ethereum);
    const name = await provider.lookupAddress(ethAddr);
    if (!name) return undefined;
    // make sure forward resolution works - very important to check both directions
    const address = await resolveENSName(provider, name);
    return ethAddr.toLowerCase() === address?.toLowerCase() ? name : undefined;
  } catch (error) {
    console.error('ENS from Eth', error);
    return undefined;
  }
}

/**
 * Get current eth address.
 * @returns {string} Address[0] for user.
 */
export async function getEthAddr(provider?: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ethereum } = window as any;
  const ethProvider = provider || ethereum;
  const accountsArr: Array<string> = await ethProvider.request({ method: 'eth_requestAccounts' });
  if (!accountsArr.length) return undefined;
  const ethAddr = accountsArr[0];
  return ethAddr;
}

/**
 * Get and sign challenge from server with eth public key. Uses EIP712 v4 signing.
 * @param {string} ethAddr - Eth address.
 * @returns {Promise<{token, signature}>} - Token and signature.
 */
export async function getAndSignChallenge(
  ethAddr: string,
  useSkemail = true,
  provider?: any
): Promise<{ token?: string; signedToken?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const ethereum = provider ?? window?.ethereum;
  let response;
  let token: string | undefined;
  if (useSkemail) {
    response = await client.mutate<CreateWalletChallengeSkemailMutation, CreateWalletChallengeSkemailMutationVariables>(
      {
        mutation: CreateWalletChallengeSkemailDocument,
        variables: {
          request: {
            walletAddress: ethAddr
          }
        }
      }
    );
    token = response.data?.createWalletChallengeSkemail.token;
  }
  if (!token) {
    console.error('no challenge token');
    return {};
  }
  // see https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4
  const dataToSign = JSON.stringify({
    domain: {
      name: 'Skiff',
      version: '0.1'
    },
    primaryType: 'Token',
    message: {
      contents: 'Skiff signature',
      skiffLoginToken: token
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' }
      ],
      Token: [
        { name: 'skiffLoginToken', type: 'string' },
        { name: 'contents', type: 'string' }
      ]
    }
  });
  const signedToken: string = await ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [ethAddr, dataToSign]
  });
  return { token, signedToken };
}
