import { Bech32Address } from '@keplr-wallet/cosmos/build/bech32';
import { Keplr } from '@keplr-wallet/types/build/wallet/keplr';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { Icon } from 'nightwatch-ui';
import { isENSName, isICNSName, isJunoAddress, isSolanaAddress } from 'skiff-utils';
import isEthereumAddress from 'validator/lib/isEthereumAddress';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { CreateWalletChallengeSkemailDocument, CreateWalletChallengeSkemailMutation, CreateWalletChallengeSkemailMutationVariables } from 'skiff-front-graphql';
import { getAndSignChallenge } from './metamaskUtils';
import { COSMOS_CHAIN_ID, CosmosProvider, EthProvider, SolanaProvider, WalletProvider } from './walletUtils.constants';

/**
 * Create a full email
 * @param alias the alias of the email
 * @param mailDomain the mail domain, ie skiff.com
 * @returns the full email, which is a combination of the alias and the mail domain
 */
export const createEmail = (alias: string, mailDomain: string) => `${alias}@${mailDomain}`;

/**
 * Returns whether the given provider is an Ethereum provider.
 * @param provider the provider we want to see if an Ethereum provider or not
 * @returns true if provider is in EthProvider
 */
export const isEthProvider = (provider: WalletProvider) => Object.values(EthProvider).includes(provider as EthProvider);

/**
 * Returns whether the given provider is an Solana provider.
 * @param provider the provider we want to see if an Solana provider or not
 * @returns true if provider is in SolanaProvider
 */
export const isSolProvider = (provider: WalletProvider) =>
  Object.values(SolanaProvider).includes(provider as SolanaProvider);

/**
 * Returns whether the given provider is an Solana provider.
 * @param provider the provider we want to see if an Solana provider or not
 * @returns true if provider is in SolanaProvider
 */
export const isCosmosProvider = (provider: WalletProvider) =>
  Object.values(CosmosProvider).includes(provider as CosmosProvider);

/**
 * Checks if the given alias is a Cosmos address.
 * @returns True if the email address is a valid Cosmos wallet address. False otherwise.
 */
export function isCosmosHubAddress(emailAlias: string | undefined): boolean {
  if (!emailAlias) return false;
  // Cosmos addresses are bech32 encoded addresses with a HRP of 'cosmos'.
  // https://docs.cosmos.network/master/spec/addresses/bech32.html
  try {
    Bech32Address.validate(emailAlias, 'cosmos');
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Gets a token to sign to verify address.
 * @param {string} walletAddress - Address to verify.
 * @returns {string} Token to sign.
 */
export async function getSkemailChallengeToken(walletAddress: string, client: ApolloClient<NormalizedCacheObject>) {
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
export const connectEthWallet = async (provider: any, client: ApolloClient<NormalizedCacheObject>) => {
  // connect wallet
  const userAddr = await getEthAddr(provider);
  if (!userAddr) {
    throw new Error('Could not get eth address');
  }
  const { token, signedToken } = await getAndSignChallenge(userAddr, client, provider);
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
export const connectSolWallet = async (provider: any, client: ApolloClient<NormalizedCacheObject>) => {
  // connect to wallet
  const response = await provider.connect();
  const publicKey: string = response.publicKey.toString();
  // get challenge
  const challenge = await getSkemailChallengeToken(publicKey, client);
  if (!challenge) {
    throw new Error('Could not get challenge');
  }
  const encodedMessage = new TextEncoder().encode(challenge);
  // sign challenge
  const signatureData = await provider.signMessage(encodedMessage, 'utf8');
  const { base58 } = await import('ethers/lib/utils');
  return { challenge, challengeSignature: base58.encode(signatureData.signature) };
};

export const connectCosmosWallet = async (provider: Keplr, client: ApolloClient<NormalizedCacheObject>) => {
  const { bech32Address: userAddr } = await provider.getKey(COSMOS_CHAIN_ID);
  if (!userAddr) {
    throw new Error('Could not get cosmos address');
  }
  const token = await getSkemailChallengeToken(userAddr, client);
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
 * Returns the wallet icon associated with the wallet alias
 * @param alias the wallet alias
 * @returns the wallet icon
 */
export const getWalletIcon = (alias: string | undefined): Icon | undefined => {
  if (!alias) return undefined;

  if (isEthereumAddress(alias) || isENSName(alias)) {
    return Icon.Ethereum;
  }
  if (isCosmosHubAddress(alias) || isJunoAddress(alias) || isICNSName(alias)) {
    return Icon.Atom;
  }
  if (isSolanaAddress(alias)) {
    return Icon.Solana;
  }
  return undefined;
};

/**
 * Get current eth address.
 * @returns {string} Address[0] for user.
 */
export async function getEthAddr(ethProvider: any) {
  const accountsArr: Array<string> = await ethProvider.request({ method: 'eth_requestAccounts' });
  if (!accountsArr.length) return undefined;
  return accountsArr[0];
}

/**
 * Get current eth address from injected provider.
 * @returns {string} Address[0] for user.
 */
export async function getInjectedAddr() {
  if (!window.ethereum) return undefined;
  return getEthAddr(window.ethereum);
}

/**
 * Decrypt secret with wallet.
 * @param {string} currentEthAddr - Eth address for user.
 * @param {string} encryptedSecret - Encrypted password secret.
 * @returns {string} - Decrypted password secret.
 */
export async function decryptSecretWithWallet(
  currentEthAddr: string,
  encryptedSecret: string
): Promise<string | undefined> {
  if (!window.ethereum) return undefined;
  let decryptedData;
  try {
    decryptedData = await window.ethereum.request({ method: 'eth_decrypt', params: [encryptedSecret, currentEthAddr] });
  } catch (error) {
    console.error('Eth decrypt failed');
    console.error(error);
  }
  return decryptedData;
}

/**
 * Abbreviates a wallet address to the first five chars and last four chars, ie. 0xdDD...ab3D
 * @param walletAddress the wallet address to abbreviate
 * @returns the abbreviated form of the address
 */
export const abbreviateWalletAddress = (walletAddress: string | undefined, startChars?: number, endChars?: number) => {
  if (!walletAddress) return '';
  return `${walletAddress.slice(0, 2 + (startChars ?? 3))}...${walletAddress.slice(-(endChars ?? 4))}`;
};

/**
 * Create an abbreviated wallet email
 * @param walletAddr the wallet address
 * @param mailDomain the mail domain, ie skiff.com
 * @returns the abbreviated wallet email
 */
export const createAbbreviatedWalletEmail = (walletAddr: string, mailDomain: string) =>
  createEmail(abbreviateWalletAddress(walletAddr), mailDomain);

/**
 * Encrypt secret with wallet.
 * @param {string} currentEthAddr - Eth address.
 * @param {string} secret - Secret.
 * @returns {string} Sncrypted secret.
 */
export async function encryptSecretWithWallet(currentEthAddr: string, secret: string): Promise<string | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ethereum } = window as any;
  if (!ethereum) {
    console.error('encryptSecretWithWallet failed');
    return undefined;
  }
  // if this goes too fast, metamask may not show the prompt
  await new Promise((resolve) => setTimeout(resolve, 250));
  const encryptionPubKey = await ethereum.request({ method: 'eth_getEncryptionPublicKey', params: [currentEthAddr] });
  let encryptedSecret;
  // see https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods in metamask docs
  try {
    const { default: ethUtils } = await import('ethereumjs-util');
    const { default: sigUtils } = await import('@metamask/eth-sig-util');
    encryptedSecret = ethUtils.bufferToHex(
      Buffer.from(
        JSON.stringify(
          sigUtils.encrypt({
            publicKey: encryptionPubKey,
            data: secret,
            version: 'x25519-xsalsa20-poly1305'
          })
        ),
        'utf8'
      )
    );
  } catch (error) {
    console.error('Eth encrypt failed');
    console.error(error);
  }
  return encryptedSecret;
}

/**
 * Returns the provider object given an Ethereum provider name.
 * This currently supports Coinbase, MetaMask, and Brave.
 * @param providerName the name of the Ethereum provider object to return
 * @returns the provider object corresponding to the given provider name
 */
const getEthProvider = (providerName: EthProvider) => {
  const { ethereum } = window as any;
  if (!ethereum) return undefined;
  // If there is only one ethereum wallet detected, ethereum.providers will be null
  if (!ethereum.providers) {
    switch (providerName) {
      case EthProvider.Coinbase:
        return !!ethereum.isCoinbaseWallet ? ethereum : undefined;
      case EthProvider.MetaMask:
        return !!ethereum.isMetaMask ? ethereum : undefined;
      case EthProvider.Brave:
        return !!ethereum.isBraveWallet ? ethereum : undefined;
      default:
        return undefined;
    }
  }
  // If there are multiple wallets/providers detected, window.ethereum stores the providers in a list
  switch (providerName) {
    case EthProvider.Coinbase:
      return ethereum.providers.find(({ isCoinbaseWallet }: { isCoinbaseWallet: boolean }) => isCoinbaseWallet);
    case EthProvider.MetaMask:
      return ethereum.providers.find(({ isMetaMask }: { isMetaMask: boolean }) => isMetaMask);
    case EthProvider.Brave:
      return ethereum.providers.find(({ isBraveWallet }: { isBraveWallet: boolean }) => isBraveWallet);
    default:
      return undefined;
  }
};

export interface InjectedSolana {
  connect: () => Promise<any>;
  isPhantom: boolean;
  isConnected: boolean;
  signMessage: (message: Uint8Array, type: 'utf8') => Promise<any>;
}

/**
 * Returns the provider object given an Solana provider name.
 * This currently only supports Phantom.
 * @param providerName the name of the Solana provider object to return
 * @returns the provider object corresponding to the given provider name
 */
export const getSolanaProvider = (providerName: SolanaProvider): InjectedSolana => {
  const { phantom, solana } = window as any;
  switch (providerName) {
    // window.phantom.solana is equivalent to window.solana. Using window.phantom prevents namespace collisions.
    // https://docs.phantom.app/integrating/extension-and-mobile-browser/detecting-the-provider
    case SolanaProvider.Phantom:
      const provider = phantom?.solana;
      return !!provider?.isPhantom ? provider : undefined;
    default:
      return solana;
  }
};

/**
 * Sets the selected the Eth provider object given a provider name.
 * @param providerName a Ethereum provider
 * @returns the provider object corresponding to the given provider name
 */
export const activateEthProvider = (providerName: EthProvider): MetaMaskInpageProvider | undefined => {
  const { ethereum } = window as any;
  const provider = getEthProvider(providerName);
  if (provider && provider !== ethereum) {
    if (ethereum) {
      ethereum.setSelectedProvider(provider);
    } else {
      console.error('Error in activeEthProvider: window.ethereum is not defined');
    }
  }
  return provider as MetaMaskInpageProvider;
};
