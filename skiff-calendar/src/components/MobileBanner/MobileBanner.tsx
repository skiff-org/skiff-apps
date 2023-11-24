import { Icon } from 'nightwatch-ui';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import {
  CALENDAR_ATTRIBUTION_PARAM,
  BannerTypes,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  SKIFF_PUBLIC_WEBSITE_DOWNLOAD,
  useLocalSetting,
  ThemedBanner
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { modalReducer } from '../../redux/reducers/modalReducer';
import { CalendarModalType } from '../../redux/reducers/modalTypes';
import { useAppSelector } from '../../utils';

const MAX_BANNER_APPEARANCES = 1;

const DOWNLOAD_URL = SKIFF_PUBLIC_WEBSITE_DOWNLOAD + CALENDAR_ATTRIBUTION_PARAM;

export const MobileBanner = () => {
  const dispatch = useDispatch();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const [calMobileBannerAppearances, setCalMobileBannerAppearances] = useLocalSetting(
    StorageTypes.CAL_MOBILE_BANNER_APPEARANCES
  );

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const mobileBannerOpen = bannersOpen.some((banner) => banner === BannerTypes.Mobile);

  useEffect(() => {
    if (calMobileBannerAppearances >= MAX_BANNER_APPEARANCES) {
      void dispatch(modalReducer.actions.closeBanner(BannerTypes.Mobile));
    }
  }, [calMobileBannerAppearances, dispatch]);

  // hide on mobile or desktop
  if (window.ReactNativeWebView) {
    return null;
  }

  // hide banner if user hits close button
  if (!mobileBannerOpen) {
    return null;
  }

  // hide banner on reload after max number of appearance
  if (calMobileBannerAppearances >= MAX_BANNER_APPEARANCES) {
    return null;
  }

  const storeCloseBannerWorkspaceEvent = () => {
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.CloseDownloadCalendarMobileBanner,
          version: DEFAULT_WORKSPACE_EVENT_VERSION,
          data: ''
        }
      }
    });
  };

  const closeBanner = () => {
    storeCloseBannerWorkspaceEvent();
    setCalMobileBannerAppearances(calMobileBannerAppearances + 1);
    dispatch(modalReducer.actions.closeBanner(BannerTypes.Mobile));
  };

  const openQrCodeModal = (link: string) =>
    dispatch(
      modalReducer.actions.setOpenModal({
        type: CalendarModalType.QrCode,
        title: 'Get the Skiff Calendar app',
        description: 'Available on iOS, Android, and macOS',
        link,
        buttonProps: {
          label: 'View all downloads',
          onClick: () => window.open(DOWNLOAD_URL, '_blank')
        }
      })
    );

  const openQrCode = () => {
    storeCloseBannerWorkspaceEvent();
    openQrCodeModal(DOWNLOAD_URL);
  };

  const mobileBannerCTAs = [
    {
      label: 'Download mobile app',
      onClick: openQrCode
    }
  ];

  return (
    <ThemedBanner
      color='green'
      ctas={mobileBannerCTAs}
      icon={Icon.Mobile}
      label='Access calendar from your phone.'
      onClose={closeBanner}
    />
  );
};

export default MobileBanner;
