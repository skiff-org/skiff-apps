import { Icon } from 'nightwatch-ui';

export const COSMOS_CHAIN_ID = 'cosmoshub-4';

export enum EthProvider {
  MetaMask = 'MetaMask',
  Coinbase = 'Coinbase',
  Brave = 'Brave'
}

export enum SolanaProvider {
  Phantom = 'Phantom'
}

export enum CosmosProvider {
  Keplr = 'Keplr'
}

export enum MultichainProvider {
  BitKeep = 'BitKeep'
}

export type WalletProvider = EthProvider | SolanaProvider | CosmosProvider | MultichainProvider;

export interface WalletProviderInfo {
  walletName: string;
  icon: Icon;
}

type AllWalletProviderInfo = {
  [key in WalletProvider]: WalletProviderInfo;
};

export const WALLET_PROVIDERS: AllWalletProviderInfo = {
  [EthProvider.MetaMask]: {
    walletName: 'MetaMask',
    icon: Icon.Metamask
  },
  [EthProvider.Coinbase]: {
    walletName: 'Coinbase',
    icon: Icon.Coinbase
  },
  [CosmosProvider.Keplr]: {
    walletName: 'Keplr',
    icon: Icon.Wallet
  },
  [SolanaProvider.Phantom]: {
    walletName: 'Phantom',
    icon: Icon.Phantom
  },
  [EthProvider.Brave]: {
    walletName: 'Brave',
    icon: Icon.Brave
  },
  [MultichainProvider.BitKeep]: {
    walletName: 'BitKeep',
    icon: Icon.Bitkeep
  }
};

export type WalletSignupData = {
  walletAddr: string;
  challenge: string;
  challengeSignature: string;
  walletType: WalletProvider;
};
