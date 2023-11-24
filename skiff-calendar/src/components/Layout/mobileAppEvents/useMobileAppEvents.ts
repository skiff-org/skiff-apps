import { useEffect } from 'react';
import { isIOS } from 'react-device-detect';
import { sendRNWebviewMsg, useCurrentUserData } from 'skiff-front-utils';

import { useSetCalendarPushTokenMutation } from '../../../../generated/graphql';
import { getCurrentCalendarMetadata } from '../../../apollo/currentCalendarMetadata';
import { debouncedQueryAndUpdatedEvents } from '../../../storage/models/event/modelUtils';

import { PrivateUserDataVersion } from './types';
import { MobileAppEvent, MobileAppEventTypes } from './types';
import { useHandleBackButton } from './useHandleBackButton';

const MOBILE_EVENT_NAME = 'message';

type PublicKey = {
  key: string;
  signature: string;
};

const sendPrivateUserData = async (userPrivateKey: string, userPublicKey: PublicKey) => {
  const calendarMetadata = await getCurrentCalendarMetadata();

  if (!calendarMetadata) return;

  sendRNWebviewMsg('privateUserData', {
    privateUserData: {
      userPrivateKey,
      encryptedCalendarPrivateKey: calendarMetadata.encryptedPrivateKey,
      userPublicKey,
      version: PrivateUserDataVersion.V0
    }
  });
};

export default function useMobileAppEvents() {
  const [setToken] = useSetCalendarPushTokenMutation();
  const handleBackButton = useHandleBackButton();
  const userData = useCurrentUserData();

  /**
   * only mounted when the user is already logged in
   */
  useEffect(() => {
    sendRNWebviewMsg('userLoggedIn', {});
    // sync mobile events
    void debouncedQueryAndUpdatedEvents(new Date());
  }, []);

  useEffect(() => {
    if (userData && userData.publicKey.signature) {
      // Ensure userData includes signature.
      void sendPrivateUserData(userData.privateUserData.privateKey, {
        key: userData.publicKey.key,
        signature: userData.publicKey.signature
      });
    }
  }, [userData, userData?.publicKey.key, userData?.publicKey.signature, userData?.privateUserData?.privateKey]);

  useEffect(() => {
    const onEvent = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'string') return;

      try {
        void (async () => {
          const mobileAppEvent = JSON.parse(event.data as string) as MobileAppEvent;
          // if no valid mobile app event break
          if (!mobileAppEvent) return;

          const { type, payload } = mobileAppEvent;
          switch (type) {
            case MobileAppEventTypes.SetPushNotification:
              await setToken({
                variables: {
                  request: {
                    deviceID: payload.deviceID,
                    os: payload.os,
                    token: payload.token
                  }
                }
              });
              // Tell native app that token has been set
              sendRNWebviewMsg('tokenSet', {});
              break;
            case MobileAppEventTypes.AndroidBackPress:
              handleBackButton();
              break;
            case MobileAppEventTypes.AppState:
              window.nativeAppState = payload;
              break;
          }
        })();
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
  }, [handleBackButton, setToken]);
}
