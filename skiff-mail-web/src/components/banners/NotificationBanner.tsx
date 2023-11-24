import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  BannerTypes,
  useRequiredCurrentUserData,
  ThemedBanner,
  NotificationBannerState,
  useEnableMailPushNotifications
} from 'skiff-front-utils';
import { StorageTypes, getStorageKey } from 'skiff-utils';

import client from '../../apollo/client';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';

export default function NotificationBanner() {
  const user = useRequiredCurrentUserData();
  const { userID } = user;
  const { enableNotifications } = useEnableMailPushNotifications({ client });

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
    await enableNotifications();
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
      <ThemedBanner
        ctas={[
          { label: 'Enable notifications', onClick: () => void onEnableNotificationsClick() },
          { label: 'Ask later', onClick: onAskLaterClick },
          { label: 'Never ask again', onClick: onNeverAskClick }
        ]}
        label='We recommend enabling desktop notifications. '
      />
    );
  }
  return (
    <ThemedBanner
      ctas={[
        {
          label: 'Enable notifications',
          onClick: () => void onEnableNotificationsClick()
        }
      ]}
      label='Enable desktop notifications for the best experience.'
    />
  );
}
