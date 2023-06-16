import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { requestNotificationPermissions } from 'skiff-utils';

import { NotificationPermissions, registerNotificationServiceWorker } from '../utils';

/**
 * Register the service worker and subscribe a user to push notifications for Mail.
 */
interface UseEnableMailPushNotificationsOptions {
  client: ApolloClient<NormalizedCacheObject>;
}
export default function useEnableMailPushNotifications({ client }: UseEnableMailPushNotificationsOptions) {
  const enableNotifications = async () => {
    let permission = Notification.permission;
    console.log('Notification permission', permission);
    if (permission === NotificationPermissions.DEFAULT) {
      permission = await requestNotificationPermissions();
    }
    if (permission === NotificationPermissions.GRANTED) {
      await registerNotificationServiceWorker(client);
    }
  };

  return { enableNotifications };
}
