import { useEffect } from 'react';
import { isIOS } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { useSetPushTokenMutation } from 'skiff-front-graphql';
import { sendRNWebviewMsg } from 'skiff-front-utils';

import useBackButton from './useBackButton';

const MOBILE_EVENT_NAME = 'message';

export enum MobileAppEventTypes {
  GoogleAuthRedirect = 'googleAuthRedirect',
  OutlookAuthRedirect = 'outlookAuthRedirect',
  PushNotificationToken = 'pushNotificationsToken',
  AndroidBackPress = 'androidBackPress'
}

interface GoogleAuthRedirect {
  type: MobileAppEventTypes.GoogleAuthRedirect;
  payload: {
    query: {
      [key: string]: string;
    };
  };
}
interface OutlookAuthRedirect {
  type: MobileAppEventTypes.OutlookAuthRedirect;
  payload: {
    query: {
      [key: string]: string;
    };
  };
}

interface PushNotificationTokenMsg {
  type: MobileAppEventTypes.PushNotificationToken;
  payload: {
    token: string;
    deviceID: string;
    os: 'ios' | 'android';
  };
}
interface AndroidBackPress {
  type: MobileAppEventTypes.AndroidBackPress;
  payload: Record<string, never>;
}

type MobileAppEvent = GoogleAuthRedirect | PushNotificationTokenMsg | OutlookAuthRedirect | AndroidBackPress;

/**
 * Handles messages from webview
 */
export default function MobileAppEventListener() {
  const history = useHistory();
  const [setPushToken] = useSetPushTokenMutation();
  const onBackClick = useBackButton();

  useEffect(() => {
    const onEvent = (event: MessageEvent) => {
      if (!event.data) return;
      try {
        const mobileAppEvent = JSON.parse(event.data as string) as MobileAppEvent;
        if (mobileAppEvent) {
          const { type, payload } = mobileAppEvent;
          switch (type) {
            case MobileAppEventTypes.GoogleAuthRedirect:
              // When being redirected from google, set route path
              void history.push({
                pathname: '/oauth/google/import',
                search: new URLSearchParams(payload.query).toString()
              });
              break;
            case MobileAppEventTypes.OutlookAuthRedirect:
              void history.push({
                pathname: '/oauth/outlook/import',
                search: new URLSearchParams(payload.query).toString()
              });
              break;
            case MobileAppEventTypes.PushNotificationToken:
              console.log('Set token', payload);
              void setPushToken({
                variables: {
                  request: {
                    token: payload.token,
                    deviceID: payload.deviceID,
                    os: payload.os
                  }
                }
              }).then(() => {
                console.log('Push updated');
                sendRNWebviewMsg('pushTokenUpdated', {});
              });
              break;
            case MobileAppEventTypes.AndroidBackPress:
              onBackClick();
              break;
            default:
              console.warn('Unknown event', type);
          }
        }
      } catch (error) {
        console.warn(error);
      }
    };

    // IOS uses window.addEventListener
    if (isIOS) {
      window.addEventListener(MOBILE_EVENT_NAME, onEvent);
    } else {
      // Android uses document.addEventListener
      document.addEventListener(MOBILE_EVENT_NAME, onEvent as unknown as EventListener);
    }

    return () => {
      if (isIOS) {
        window.removeEventListener(MOBILE_EVENT_NAME, onEvent);
      } else {
        document.removeEventListener(MOBILE_EVENT_NAME, onEvent as unknown as EventListener);
      }
    };
  }, [history, setPushToken, onBackClick]);

  return null;
}
