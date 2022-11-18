import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue, useToast } from 'skiff-front-utils';
import { useGetCurrentUserCustomDomainsQuery } from 'skiff-mail-graphql';
import { insertIf } from 'skiff-utils';

import ManageCustomDomains from './Manage/ManageCustomDomains';
import SetupCustomDomain from './SetupCustomDomain';

export const useCustomDomainsSettings = (): Setting[] => {
  const { enqueueToast } = useToast();

  const { data, error, loading, refetch } = useGetCurrentUserCustomDomainsQuery();

  if (error) {
    console.error(`Failed to retrieve user's custom domains`, error);
    enqueueToast({
      body: 'Error loading custom domains.',
      icon: Icon.Warning
    });
  }

  const customDomains = data?.getCurrentUserCustomDomains.domains;

  return [
    {
      type: SettingType.Custom,
      value: SettingValue.CustomDomainSetup,
      component: (
        <SetupCustomDomain
          existingCustomDomains={customDomains ?? []}
          key='custom-domain-setup'
          refetchCustomDomains={() => void refetch()}
        />
      ),
      label: SETTINGS_LABELS[SettingValue.CustomDomainSetup],
      icon: Icon.ArrowRight,
      color: 'green'
    },
    ...insertIf(!!customDomains?.length, {
      type: SettingType.Custom,
      value: SettingValue.CustomDomainManage,
      component: (
        <ManageCustomDomains
          customDomains={customDomains}
          key='manage-custom-domains'
          loading={loading}
          refetchCustomDomains={() => void refetch()}
        />
      ),
      label: SETTINGS_LABELS[SettingValue.CustomDomainManage],
      icon: Icon.At,
      color: 'blue'
    } as Setting)
  ];
};
