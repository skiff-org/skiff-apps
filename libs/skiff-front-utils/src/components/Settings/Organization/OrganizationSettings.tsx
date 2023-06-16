import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { Icon } from 'nightwatch-ui';
import React from 'react';

import { Setting, SettingsPage, SETTINGS_LABELS, SettingType, SettingValue } from '../Settings.types';

import OrganizationMemberList from './OrganizationMemberList';

interface OrganizationSettingsArgs {
  client: ApolloClient<NormalizedCacheObject>;
  // Each app has it's own state to control the Settings modal
  openSettings: (page: SettingsPage) => void;
}

export const getOrganizationSettings = ({ client, openSettings }: OrganizationSettingsArgs): Setting[] => [
  {
    type: SettingType.Custom,
    value: SettingValue.OrganizationMemberList,
    component: <OrganizationMemberList client={client} openSettings={openSettings} />,
    label: SETTINGS_LABELS[SettingValue.OrganizationMemberList],
    icon: Icon.UserPlural,
    color: 'orange'
  }
];
