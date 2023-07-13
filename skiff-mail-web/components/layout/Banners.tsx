import { useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { BannerTypes, DelinquencyBanner, isReactNativeDesktopApp, SettingValue, TabPage } from 'skiff-front-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import MobileBanner from '../banners/MobileBanner';
import { useSettings } from '../Settings/useSettings';

import { InitNotification } from './InitNotification';

const Banners = () => {
  const dispatch = useDispatch();

  const { openSettings } = useSettings();
  const openPlansTab = () => openSettings({ tab: TabPage.Plans, setting: SettingValue.SubscriptionPlans });

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const isDelinquencyBannerOpen = bannersOpen.includes(BannerTypes.Delinquency);

  // When the delinquency banner is open, we hide every other banner
  const onDelinquencyBannerOpen = useCallback(() => {
    if (isDelinquencyBannerOpen) return;
    dispatch(skemailModalReducer.actions.openBanner(BannerTypes.Delinquency));
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Mobile));
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Notification));
  }, [dispatch, isDelinquencyBannerOpen]);

  const onDelinquencyBannerClose = useCallback(() => {
    if (!isDelinquencyBannerOpen) return;
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Delinquency));
  }, [dispatch, isDelinquencyBannerOpen]);

  // Hide all banners on desktop
  if (isReactNativeDesktopApp()) return null;

  return (
    <>
      <MobileBanner />
      {/* no browser push notifications on mobile; nor for desktop app,
      but desktop app has a blanket exemption from banners so not explicitly exempted here */}
      {!isMobile && <InitNotification />}
      <DelinquencyBanner
        onBannerClose={onDelinquencyBannerClose}
        onBannerOpen={onDelinquencyBannerOpen}
        openPlansTab={openPlansTab}
      />
    </>
  );
};

export default Banners;
