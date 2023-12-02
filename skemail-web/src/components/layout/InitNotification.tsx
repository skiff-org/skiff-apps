import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  BannerTypes,
  NotificationPermissions,
  useEnableMailPushNotifications,
  useRequiredCurrentUserData
} from 'skiff-front-utils';

import client from '../../apollo/client';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useHideBannerForTreatmentCohort from '../../hooks/useHideBannerForTreatmentCohort';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { shouldShowBanner } from '../../utils/notifications';
import NotificationBanner from '../banners/NotificationBanner';

// Initialize service worker and then decides whether to display banner or not
// A different banner is displayed for first appearance and for the ones after

export const InitNotification = () => {
  const dispatch = useDispatch();
  const { userID } = useRequiredCurrentUserData();
  // hide banner if the user:
  // 1. did not enable push notifications during onboarding
  // 2. was in an experimental treatment cohort and is not selected for banner exposure
  const hideBannerForTreatmentCohort = useHideBannerForTreatmentCohort();

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const isDelinquencyBannerOpen = bannersOpen.includes(BannerTypes.Delinquency);
  const isNotificationBannerOpen = bannersOpen.includes(BannerTypes.Notification);
  const { enableNotifications } = useEnableMailPushNotifications({ client });
  useEffect(() => {
    if (typeof Notification === 'undefined' || isDelinquencyBannerOpen) return;

    const notificationPermission = Notification.permission;
    // If user has already granted permission to notifications, run the enable flow.
    // This is necessary to ensure the legacy notification worker issues are cleaned up and
    // and the user is properly registered with the notification service. Performance should be negligible.
    if (notificationPermission === NotificationPermissions.GRANTED) {
      void enableNotifications();
    }

    const showBanner = shouldShowBanner(notificationPermission, userID);
    if (showBanner && !hideBannerForTreatmentCohort)
      dispatch(skemailModalReducer.actions.openBanner(BannerTypes.Notification));
  }, [userID, isDelinquencyBannerOpen, dispatch, hideBannerForTreatmentCohort]);

  if (!isNotificationBannerOpen) return null;
  return <NotificationBanner />;
};
