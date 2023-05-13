import { NotificationBannerState, NotificationPermissions } from 'skiff-front-utils';
import { getStorageKey, StorageTypes } from 'skiff-utils';

export const shouldShowBanner = (notificationPermission: NotificationPermission, userID: string) => {
  const state = localStorage.getItem(`${getStorageKey(StorageTypes.NOTIFICATION_BANNER_KEY)}:${userID}`);
  // When the notification permission is set dont show banner
  if (state == null) {
    return true;
  }
  if (!(notificationPermission === NotificationPermissions.DEFAULT)) return false;
  switch (state) {
    // Show banner if never shown or shown in the past
    case NotificationBannerState.Shown:
    case NotificationBannerState.Remind:
      return true;
    case NotificationBannerState.Never:
    default:
      console.error('Notification banner key has unexpected value');
      return false;
  }
};
