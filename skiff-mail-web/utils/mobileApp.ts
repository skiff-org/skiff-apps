import { isMobile } from 'react-device-detect';

export const isMobileApp = () => isMobile && !!window.ReactNativeWebView;

export const sendRNWebviewMsg = (type: string, payload: Record<string, any>) => {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
};
