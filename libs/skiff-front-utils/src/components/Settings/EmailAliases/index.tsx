import { Icon } from 'nightwatch-ui';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { PaywallErrorCode } from '../../../../../skiff-utils/src';
import { SETTINGS_LABELS, Setting, SettingType, SettingValue, SettingsPage } from '../Settings.types';
import AddressSettings from './AddressSettings';

export const useAliasesSettings = ({
  client,
  openPaywallModal,
  openSettings
}: {
  client: ApolloClient<NormalizedCacheObject>;
  openPaywallModal: (paywallErrorCode: PaywallErrorCode) => void;
  openSettings: (page: SettingsPage) => void;
}): Setting[] => {
  return [
    {
      type: SettingType.Custom,
      value: SettingValue.AddEmailAlias,
      fullHeight: true,
      component: <AddressSettings client={client} openPaywallModal={openPaywallModal} openSettings={openSettings} />,
      label: SETTINGS_LABELS[SettingValue.AddEmailAlias],
      icon: Icon.Bolt,
      color: 'blue'
    }
  ];
};
