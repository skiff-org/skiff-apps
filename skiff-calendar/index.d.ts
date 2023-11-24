import { AppState } from './src/components/Layout/mobileAppEvents/types';

declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare global {
  interface Window {
    deviceID?: string;
    rnIosKeyboardCbs: { [key: string]: (newHeight: number) => void };
    statusBarHeight: number;
    nativeAppState?: AppState;
  }
}

export {};
