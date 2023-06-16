import { isMobile, isAndroid } from 'react-device-detect';
import { models } from 'skiff-front-graphql';

import { MobileUserDataVersion } from '../types';

declare global {
  interface Window {
    ReactNativeWebView: any;
    IsSkiffWindowsDesktop: boolean;
  }
}

export const isMobileApp = () => isMobile && !!window.ReactNativeWebView;

export const isReactNativeDesktopApp = () => !isMobile && !!window.ReactNativeWebView;
export const isWindowsDesktopApp = () => !isMobile && !!window.IsSkiffWindowsDesktop;

export const isMobileWebView = () => isMobile && !window.ReactNativeWebView;

export const sendRNWebviewMsg = (type: string, payload: Record<string, any>) => {
  if (!isMobileApp() && !isReactNativeDesktopApp()) return;
  if (!window.ReactNativeWebView) return;
  window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
};

export const copyToClipboardWebAndMobile = (textToCopy: string) => {
  if (isAndroid && isMobileApp()) {
    sendRNWebviewMsg('copy', { copiedText: textToCopy });
    return;
  }
  void navigator.clipboard.writeText(textToCopy);
};

export const sendUserDataToMobileApp = (user: models.User) => {
  try {
    // User Object To Save On Native App
    const userData = {
      privateUserData: { privateKey: user.privateUserData.privateKey },
      publicKey: user.publicKey,
      userID: user.userID,
      username: user.username,
      publicData: user.publicData,
      version: MobileUserDataVersion.V0
    };
    sendRNWebviewMsg('userLoggedIn', userData);
  } catch (error) {
    console.error('Failed to send user data to mobile app:', error);
  }
};
