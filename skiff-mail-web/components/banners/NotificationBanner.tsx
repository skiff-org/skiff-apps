import { Banner } from 'nightwatch-ui';
import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { getEnvironment, getStorageKey, StorageTypes } from 'skiff-front-utils';
import { useSubscribeNotificationMutation } from 'skiff-mail-graphql';
import { requestNotificationPermissions } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { BannerTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { NotificationBannerState, NotificationPermissions } from '../../utils/notifications';
import { urlBase64ToUint8Array } from '../../utils/pushNotifications';

/*
Voluntary Application Server Identification (VAPID)
https://datatracker.ietf.org/doc/html/rfc8292
Public key used to include identity in signed tokens for requests to push service.
This is application server key is sent with subscription requests from client and allows our backend server to make webpush requests to push service endpoints.
This also protects us to restrict use of push message subscriptions solely to our server with the VAPID private secret.
*/

const swFileName = 'custom-sw.js';

export async function subscribeUser(convertedVapidKey: Uint8Array): Promise<PushSubscription | null> {
  let subscription;
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.ready
      .then(async function (registration) {
        if (!registration.pushManager) {
          console.warn('Push manager unavailable.');
          return null;
        }
        await registration.pushManager.getSubscription().then(async function (existingSubscription) {
          if (existingSubscription === null) {
            await registration.pushManager
              .subscribe({
                applicationServerKey: convertedVapidKey,
                userVisibleOnly: true
              })
              .then(function (newSubscription) {
                subscription = newSubscription;
              })
              .catch(function (e) {
                if (Notification.permission !== NotificationPermissions.GRANTED) {
                  console.log('Permission was not granted.');
                } else {
                  console.error('An error ocurred during the subscription process.', e);
                }
              });
          } else {
            subscription = existingSubscription;
          }
        });
      })
      .catch(function (e) {
        console.error('An error ocurred during Service Worker registration.', e);
      });
  } else {
    console.log('Can not reachable to the service worker');
    return null;
  }
  return subscription;
}

export default function NotificationBanner() {
  let VAPID_PUBLIC_KEY;
  switch (getEnvironment(new URL(window.location.origin))) {
    case 'development':
    case 'review_app':
      VAPID_PUBLIC_KEY = 'BBq-2pmOiSvZ8Gg4J2V6_JEgmHJ7VfMGXFTOTLUPETCA6uVg5_t2syYlhuyceWc_JNWgywV-dz-TGKT9j5_FGYU';
      break;
    case 'staging':
      VAPID_PUBLIC_KEY = 'BJQlMQcemb8t23W5JNK1kbmUN420VfxLaJ1wyjyLN_HZkG-VZoOHTNcAudvl8pDYl2JMldzp25tebUWFjaQs8vU';
      break;
    case 'production':
      VAPID_PUBLIC_KEY = 'BE6TkyIzpOgc4zIuD-KLND9c7A0ZjyI6XCyhMCwKC6LItbC3i-jqdEwtppSq060QQGnePle6a6Jb8uenjHSHFlk';
      break;
    case 'local':
    default:
      VAPID_PUBLIC_KEY = 'BKMEWx6p6EuUxN3fcUTNHetqszG0mmtefGule37aQogddLopUuVDsvaW7CN0hc_R7p9mhQ2r--HAJa73lOcGGYI';
      break;
  }

  const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const user = useRequiredCurrentUserData();
  const { userID } = user;
  const [subscribeNotification] = useSubscribeNotificationMutation();

  const saveSubscription = async (subscription: PushSubscription) => {
    const auth = subscription.getKey('auth');
    const p256dh = subscription.getKey('p256dh');

    if (!p256dh || !auth) return;

    await subscribeNotification({
      variables: {
        request: {
          endpoint: subscription.endpoint,
          auth: Buffer.from(auth).toString('base64'),
          p256dh: Buffer.from(p256dh).toString('base64')
        }
      }
    });
  };

  async function registerValidSW(swURL) {
    await navigator.serviceWorker
      .register(swURL, {
        scope: '/'
      })
      .catch((error) => {
        console.error('Error during service worker registration:', error);
      });
  }

  async function register() {
    if ('serviceWorker' in navigator) {
      const swURL = `${window.location.origin}/mail/${swFileName}`;
      await registerValidSW(swURL);
    } else {
      console.log('service worker not found in navigator');
    }
  }

  const dispatch = useDispatch();

  const isShownBefore = useMemo(
    () => localStorage.getItem(`${getStorageKey(StorageTypes.NOTIFICATION_BANNER_KEY)}:${userID}`) !== null,
    [userID]
  );

  useEffect(() => {
    if (!isShownBefore) {
      // If banner was not shown before set its state to shown
      localStorage.setItem(
        `${getStorageKey(StorageTypes.NOTIFICATION_BANNER_KEY)}:${userID}`,
        NotificationBannerState.Shown
      );
    }
  }, [isShownBefore, userID]);

  const hideBanner = () => {
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Notification));
  };

  const onEnableNotificationsClick = async () => {
    let permission = Notification.permission;
    if (permission === NotificationPermissions.DEFAULT) {
      permission = await requestNotificationPermissions();
    }
    if (permission === NotificationPermissions.GRANTED) {
      await register();
      const subscription = await subscribeUser(convertedVapidKey);
      if (subscription) await saveSubscription(subscription);
    }
    hideBanner();
  };

  const onAskLaterClick = () => {
    localStorage.setItem(
      `${getStorageKey(StorageTypes.NOTIFICATION_BANNER_KEY)}:${userID}`,
      NotificationBannerState.Remind
    );
    hideBanner();
  };

  const onNeverAskClick = () => {
    localStorage.setItem(
      `${getStorageKey(StorageTypes.NOTIFICATION_BANNER_KEY)}:${userID}`,
      NotificationBannerState.Never
    );
    hideBanner();
  };

  if (isShownBefore) {
    return (
      <Banner
        ctas={[
          { label: 'Enable notifications', onClick: () => void onEnableNotificationsClick() },
          { label: 'Ask later', onClick: onAskLaterClick },
          { label: 'Never ask again', onClick: onNeverAskClick }
        ]}
        label='We strongly recommend enabling desktop notifications. '
      />
    );
  }
  return (
    <Banner
      ctas={[
        {
          label: 'Enable notifications.',
          onClick: () => void onEnableNotificationsClick()
        }
      ]}
      label='Enable desktop notifications for the best experience.'
    />
  );
}
