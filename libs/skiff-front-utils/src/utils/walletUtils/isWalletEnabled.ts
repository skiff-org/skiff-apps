export const isMetaMaskEnabled = () => !!(window as any).ethereum && (window.ethereum.isMetaMask as boolean);

export const isBraveEnabled = () => !!(window as any).ethereum && ((window as any).ethereum.isBraveWallet as boolean);

export const isEthereumEnabled = () => isMetaMaskEnabled() || isBraveEnabled() || !!(window as any).ethereum;

export const isPhantomEnabled = () => !!(window as any).phantom?.solana || !!(window as any).phantom;

export const isKeplrEnabled = () => !!(window as any).keplr;

export const isBitKeepEnabled = () => (window as any).isBitKeep;

export const isSolanaEnabled = () => !!(window as any).solana;

export const isWalletEnabled = () =>
  isEthereumEnabled() || isPhantomEnabled() || isKeplrEnabled() || isBitKeepEnabled() || isSolanaEnabled();
