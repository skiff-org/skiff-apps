import { isMobile, isAndroid } from 'react-device-detect';
import { models } from 'skiff-front-graphql';

import { MobileUserDataVersion } from '../types';

declare global {
  interface Window {
    ReactNativeWebView: any;
    IsSkiffWindowsDesktop: boolean;
  }
}

// Is mobile and in a react native webview
export const isMobileApp = () => isMobile && !!window.ReactNativeWebView;

export const isReactNativeDesktopApp = () => !isMobile && !!window.ReactNativeWebView;
export const isWindowsDesktopApp = () => !isMobile && !!window.IsSkiffWindowsDesktop;
export const isDesktopApp = () => isWindowsDesktopApp() || isReactNativeDesktopApp();

// Is mobile but not in a react native webview
export const isMobileWebBrowser = () => isMobile && !window.ReactNativeWebView;

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
      privateUserData: {
        privateKey: user.privateUserData.privateKey,
        signingPrivateKey: user.privateUserData.signingPrivateKey,
        documentKey: user.privateUserData.documentKey
      },
      publicKey: user.publicKey,
      userID: user.userID,
      username: user.username,
      publicData: user.publicData,
      signingPublicKey: user.signingPublicKey,
      version: MobileUserDataVersion.V0
    };
    sendRNWebviewMsg('userLoggedIn', userData);
  } catch (error) {
    console.error('Failed to send user data to mobile app:', error);
  }
};
