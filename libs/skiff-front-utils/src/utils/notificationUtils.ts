import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  SubscribeNotificationDocument,
  SubscribeNotificationMutation,
  SubscribeNotificationMutationVariables
} from 'skiff-front-graphql';

import { getEnvironment } from './envUtils';

export enum NotificationBannerState {
  Shown = 'Shown', // Notification banner has been shown
  Never = 'NeverShowAgain', // Never show again
  Remind = 'Remind' // Remind on reload
}

export enum NotificationPermissions {
  DEFAULT = 'default',
  GRANTED = 'granted',
  DENIED = 'denied'
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PUSH_SW_FILE_NAME = '/mail/push/push-sw.js';
const PUSH_SW_SCOPE = '/mail/push/';
/*
Voluntary Application Server Identification (VAPID)
https://datatracker.ietf.org/doc/html/rfc8292
Public key used to include identity in signed tokens for requests to push service.
This is application server key is sent with subscription requests from client and allows our backend server to make webpush requests to push service endpoints.
This also protects us to restrict use of push message subscriptions solely to our server with the VAPID private secret.
*/

export async function subscribeUser(
  registration: ServiceWorkerRegistration,
  convertedVapidKey: Uint8Array
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.subscribe({
      applicationServerKey: convertedVapidKey,
      userVisibleOnly: true
    });
  } catch (e) {
    console.error('An error ocurred during the subscription process.', e);
    if (Notification.permission !== NotificationPermissions.GRANTED) {
      console.log('Permission was not granted.');
    }
    return null;
  }
}

export const getConvertedVapidPublicKey = () => {
  let vapidPublicKey: string;
  switch (getEnvironment(new URL(window.location.origin))) {
    case 'development':
    case 'review_app':
    case 'vercel':
      vapidPublicKey = 'BBq-2pmOiSvZ8Gg4J2V6_JEgmHJ7VfMGXFTOTLUPETCA6uVg5_t2syYlhuyceWc_JNWgywV-dz-TGKT9j5_FGYU';
      break;
    case 'staging':
      vapidPublicKey = 'BJQlMQcemb8t23W5JNK1kbmUN420VfxLaJ1wyjyLN_HZkG-VZoOHTNcAudvl8pDYl2JMldzp25tebUWFjaQs8vU';
      break;
    case 'production':
      vapidPublicKey = 'BE6TkyIzpOgc4zIuD-KLND9c7A0ZjyI6XCyhMCwKC6LItbC3i-jqdEwtppSq060QQGnePle6a6Jb8uenjHSHFlk';
      break;
    case 'local':
    default:
      vapidPublicKey = 'BKMEWx6p6EuUxN3fcUTNHetqszG0mmtefGule37aQogddLopUuVDsvaW7CN0hc_R7p9mhQ2r--HAJa73lOcGGYI';
      break;
  }
  return urlBase64ToUint8Array(vapidPublicKey);
};

const LEGACY_SERVICE_WORKER_PATH = '/mail/custom-sw.js';
/**
 * Our old notification service worker was registered with scope / which interferes with other Skiff apps (including Drive download).
 * In order to fix this, we need to unregister the old service worker.
 */
export async function cleanupLegacyNotificationServiceWorker() {
  const legacyRegistration = await navigator.serviceWorker.getRegistration(LEGACY_SERVICE_WORKER_PATH);
  if (legacyRegistration) {
    await legacyRegistration.unregister();
    console.log('Legacy service worker unregistered');
  }
}

async function saveSubscription(client: ApolloClient<NormalizedCacheObject>, subscription: PushSubscription) {
  const auth = subscription.getKey('auth');
  const p256dh = subscription.getKey('p256dh');

  if (!p256dh || !auth) return;

  await client.mutate<SubscribeNotificationMutation, SubscribeNotificationMutationVariables>({
    mutation: SubscribeNotificationDocument,

    variables: {
      request: {
        endpoint: subscription.endpoint,
        auth: Buffer.from(auth).toString('base64'),
        p256dh: Buffer.from(p256dh).toString('base64')
      }
    }
  });
}

async function registerValidSW(client: ApolloClient<NormalizedCacheObject>) {
  await cleanupLegacyNotificationServiceWorker();
  let reg = await navigator.serviceWorker.getRegistration(PUSH_SW_FILE_NAME);
  if (!reg) {
    reg = await navigator.serviceWorker.register(PUSH_SW_FILE_NAME, {
      scope: PUSH_SW_SCOPE
    });
    console.log('Registered push service worker');
  }
  if (Notification.permission === NotificationPermissions.GRANTED) {
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      // unsubscribe and resubscribe to ensure we have a new subscription
      await sub?.unsubscribe();
    }
    // subscribe user
    console.log('Detected user that has granted notifications but is not subscribed');
    const convertedVapidKey = getConvertedVapidPublicKey();
    const newSub = await subscribeUser(reg, convertedVapidKey);
    if (newSub) {
      console.log('Subscribed user');
      await saveSubscription(client, newSub);
    } else {
      console.log('Failed to subscribe user');
    }
  }
}

export async function registerNotificationServiceWorker(client: ApolloClient<NormalizedCacheObject>) {
  if ('serviceWorker' in navigator) {
    await registerValidSW(client);
  } else {
    console.log('service worker not found in navigator');
  }
}
