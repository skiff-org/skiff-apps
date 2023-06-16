declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare interface Window {
  ethereum: any;
  solana: any;
  phantom: any;
  keplr: any;
  isBitKeep: boolean;
  bitkeep: {
    ethereum: any;
    solana: any;
  };
  ReactNativeWebView: any;
  IsSkiffWindowsDesktop: boolean;
}
