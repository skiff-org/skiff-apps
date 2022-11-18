import { Icon, Banner } from 'nightwatch-ui';
import { useEffect } from 'react';
import { isIOS, isTablet } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  IPHONE_MAIL_APP_URL,
  MAIL_ATTRIBUTION_PARAM,
  SKIFF_PUBLIC_WEBSITE_DOWNLOAD,
  isWalletEnabled
} from 'skiff-front-utils';
import { isMobileWebView } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useLocalSetting from '../../hooks/useLocalSetting';
import { BannerTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../utils/userUtils';

const MAX_BANNER_APPEARANCES = 1;

const DOWNLOAD_URL = SKIFF_PUBLIC_WEBSITE_DOWNLOAD + MAIL_ATTRIBUTION_PARAM;

const MobileBanner = () => {
  const dispatch = useDispatch();
  const [skemailMobileBannerAppearances, setSkemailMobileBannerAppearances] = useLocalSetting(
    'skemailMobileBannerAppearances'
  );

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const mobileBannerOpen = bannersOpen.some((banner) => banner === BannerTypes.Mobile);

  useEffect(() => {
    if (skemailMobileBannerAppearances >= MAX_BANNER_APPEARANCES) {
      void dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Mobile));
    }
  }, [skemailMobileBannerAppearances, dispatch]);

  useEffect(() => {
    // If on mobile website, and no wallet enabled, redirect to mobile app
    if (isMobileWebView() && window.location.hostname !== 'localhost' && !isWalletEnabled()) {
      // don't redirect on tablet
      if (isIOS && !isTablet) {
        window.location.replace(IPHONE_MAIL_APP_URL);
      }
    }
  }, []);

  // hide on mobile or desktop
  if (window.ReactNativeWebView) {
    return null;
  }

  // hide banner if user hits close button
  if (!mobileBannerOpen) {
    return null;
  }

  // hide banner on reload after max number of appearance
  if (skemailMobileBannerAppearances >= MAX_BANNER_APPEARANCES) {
    return null;
  }

  const closeBanner = () => {
    storeWorkspaceEvent(WorkspaceEventType.CloseSkemailBanner, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    setSkemailMobileBannerAppearances(skemailMobileBannerAppearances + 1);
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Mobile));
  };

  const openQrCodeModal = (link: string) =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.QrCode,
        title: 'Get the Skiff app',
        description: 'Available on iOS, Android, and macOS',
        link,
        buttonProps: {
          label: 'View all downloads',
          onClick: () => window.open(DOWNLOAD_URL, '_blank')
        }
      })
    );

  const openQrCode = () => {
    storeWorkspaceEvent(WorkspaceEventType.OpenSkemailIphoneAppFromBanner, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    openQrCodeModal(DOWNLOAD_URL);
  };

  const mobileBannerCTAs = [
    {
      label: 'Download mobile app',
      onClick: openQrCode
    }
  ];

  return (
    <Banner
      color='green'
      ctas={mobileBannerCTAs}
      icon={Icon.Mobile}
      label='Access mail from your phone.'
      onClose={closeBanner}
    />
  );
};

export default MobileBanner;
