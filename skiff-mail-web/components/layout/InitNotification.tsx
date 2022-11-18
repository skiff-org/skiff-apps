import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { BannerTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { shouldShowBanner } from '../../utils/notifications';
import NotificationBanner from '../banners/NotificationBanner';
// import { requestNotificationPermissions } from 'skiff-utils';

// Initialize service worker and then decides whether to display banner or not
// A different banner is displayed for first appearance and for the ones after

export const InitNotification = () => {
  const user = useRequiredCurrentUserData();
  const { userID } = user;
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAndRequestNotificationPermissions = async () => {
      if (typeof Notification !== 'undefined') {
        const notificationPermission = Notification.permission;
        if (shouldShowBanner(notificationPermission, userID)) {
          dispatch(skemailModalReducer.actions.openBanner(BannerTypes.Notification));
        }
      }
    };
    checkAndRequestNotificationPermissions();
  }, [userID]);

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const notificationBannerOpen = bannersOpen.some((banner) => banner === BannerTypes.Notification);
  if (!notificationBannerOpen) return null;
  return <NotificationBanner />;
};
