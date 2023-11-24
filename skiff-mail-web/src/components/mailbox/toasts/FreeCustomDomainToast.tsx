import { SnackbarKey } from 'notistack';
import { useEffect } from 'react';
import { useGetCurrentUserCustomDomainsQuery } from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  Illustration,
  Illustrations,
  SettingValue,
  TabPage,
  useLocalSetting,
  useToast,
  FreeCustomDomainToastState
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { DiscoveryToastType, StorageTypes } from 'skiff-utils';

import { storeWorkspaceEvent } from '../../../utils/userUtils';
import { useSettings } from '../../Settings/useSettings';

export const FreeCustomDomainToast: React.FC = () => {
  const [, setFreeCustomDomainToastState] = useLocalSetting(StorageTypes.INTRO_FREE_CUSTOM_DOMAIN);
  const { enqueueToast, closeToast } = useToast();
  const { openSettings } = useSettings();
  const { data, loading } = useGetCurrentUserCustomDomainsQuery();
  const customDomains = data?.getCurrentUserCustomDomains.domains;
  const hasCustomDomain = !!customDomains?.length;

  useEffect(() => {
    if (loading) return;
    if (hasCustomDomain) {
      // if user set up a domain already, don't show toast
      setFreeCustomDomainToastState(FreeCustomDomainToastState.SHOWN);
      return;
    }
    let key: SnackbarKey | undefined = undefined;
    key = enqueueToast({
      title: 'Tip: Use a custom domain for free',
      body: '"you@yourwebsite.com" addresses are personalized, private, and free.',
      persist: true,
      content: <Illustration illustration={Illustrations.IntroFreeCustomDomain} />,
      onClose: () => {
        setFreeCustomDomainToastState(FreeCustomDomainToastState.SHOWN);
      },
      actions: [
        {
          label: 'Add a domain',
          onClick: () => {
            setFreeCustomDomainToastState(FreeCustomDomainToastState.SHOWN);
            void storeWorkspaceEvent(
              WorkspaceEventType.ToastCtaClick,
              DiscoveryToastType.FreeCustomDomain,
              DEFAULT_WORKSPACE_EVENT_VERSION
            );
            openSettings({ tab: TabPage.CustomDomains, setting: SettingValue.CustomDomainSetup });
            // needs to be explicitly passed this key;
            // the fallback (most recent) key will be incorrect with current useToast functionality
            closeToast(key);
          }
        }
      ]
    });
    void storeWorkspaceEvent(
      WorkspaceEventType.ToastImpression,
      DiscoveryToastType.FreeCustomDomain,
      DEFAULT_WORKSPACE_EVENT_VERSION
    );
  }, [closeToast, openSettings, enqueueToast, setFreeCustomDomainToastState, loading, hasCustomDomain]);

  return null;
};
