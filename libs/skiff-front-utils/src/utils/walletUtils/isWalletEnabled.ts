export const isMetaMaskEnabled = () => !!window.ethereum && (window.ethereum.isMetaMask as boolean);

export const isBraveEnabled = () => !!window.ethereum && (window.ethereum.isBraveWallet as boolean);

export const isEthereumEnabled = () => isMetaMaskEnabled() || isBraveEnabled();

export const isPhantomEnabled = () => !!window.phantom?.solana;

export const isKeplrEnabled = () => !!window.keplr;

export const isBitKeepEnabled = () => window.isBitKeep;

export const isWalletEnabled = () =>
  isEthereumEnabled() || isPhantomEnabled() || isKeplrEnabled() || isBitKeepEnabled();
