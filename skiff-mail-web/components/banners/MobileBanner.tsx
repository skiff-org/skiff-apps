import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  BannerTypes,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  ThemedBanner,
  MAX_SKEMAIL_MOBILE_BANNER_APPEARANCES,
  useLocalSetting,
  MAIL_MOBILE_APP_DOWNLOAD_LINK,
  SKIFF_PUBLIC_WEBSITE_DOWNLOAD
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useHideBannerForTreatmentCohort from '../../hooks/useHideBannerForTreatmentCohort';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../utils/userUtils';

const MobileBanner = () => {
  const dispatch = useDispatch();
  const [skemailMobileBannerAppearances, setSkemailMobileBannerAppearances] = useLocalSetting(
    StorageTypes.SKEMAIL_MOBILE_BANNER_APPEARANCES
  );
  // hide banner if the user:
  // 1. did not complete the download during onboarding
  // 2. was in an experimental treatment cohort and is not selected for banner exposure
  const hideBannerForTreatmentCohort = useHideBannerForTreatmentCohort();

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const isMobileBannerOpen = bannersOpen.includes(BannerTypes.Mobile);
  const isDelinquencyBannerOpen = bannersOpen.includes(BannerTypes.Delinquency);

  const closeMobileBanner = useCallback(() => {
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.Mobile));
  }, [dispatch]);

  const openMobileBanner = useCallback(() => {
    dispatch(skemailModalReducer.actions.openBanner(BannerTypes.Mobile));
  }, [dispatch]);

  useEffect(() => {
    if (skemailMobileBannerAppearances >= MAX_SKEMAIL_MOBILE_BANNER_APPEARANCES) closeMobileBanner();
    else if (!isDelinquencyBannerOpen && !isMobileBannerOpen && !hideBannerForTreatmentCohort) openMobileBanner();
  }, [
    skemailMobileBannerAppearances,
    closeMobileBanner,
    isDelinquencyBannerOpen,
    isMobileBannerOpen,
    openMobileBanner,
    hideBannerForTreatmentCohort
  ]);

  // hide on mobile or desktop
  if (window.ReactNativeWebView) {
    return null;
  }

  // hide banner if user hits close button
  if (!isMobileBannerOpen) {
    return null;
  }

  // hide banner on reload after max number of appearance
  if (skemailMobileBannerAppearances >= MAX_SKEMAIL_MOBILE_BANNER_APPEARANCES) {
    return null;
  }

  const closeBanner = () => {
    void storeWorkspaceEvent(WorkspaceEventType.CloseSkemailBanner, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    setSkemailMobileBannerAppearances(skemailMobileBannerAppearances + 1);
    closeMobileBanner();
  };

  const openQrCodeModal = (link: string) =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.QrCode,
        title: 'Get the Skiff Mail app',
        description: 'Available on iOS, Android, and macOS',
        link,
        buttonProps: {
          label: 'View all downloads',
          onClick: () => window.open(SKIFF_PUBLIC_WEBSITE_DOWNLOAD, '_blank')
        }
      })
    );

  const onBannerClick = () => {
    void storeWorkspaceEvent(WorkspaceEventType.OpenSkemailIphoneAppFromBanner, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    if (isMobile) {
      window.open(MAIL_MOBILE_APP_DOWNLOAD_LINK, '_blank', 'noreferrer noopener');
    } else {
      openQrCodeModal(MAIL_MOBILE_APP_DOWNLOAD_LINK);
    }
  };

  const mobileBannerCTAs = [
    {
      label: 'Download mobile app',
      onClick: onBannerClick
    }
  ];

  return (
    <ThemedBanner
      color='green'
      ctas={mobileBannerCTAs}
      icon={Icon.Mobile}
      label='Access mail from your phone.'
      onClose={closeBanner}
    />
  );
};

export default MobileBanner;
