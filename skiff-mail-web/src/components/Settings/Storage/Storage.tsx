import { Icon } from 'nightwatch-ui';
import React, { useMemo } from 'react';
import { Setting, SettingType, SettingValue, StorageUsage, SETTINGS_LABELS } from 'skiff-front-utils';

export const useStorageSettings: () => Setting[] = () => {
  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.StorageUsage,
        component: <StorageUsage />,
        label: SETTINGS_LABELS[SettingValue.StorageUsage],
        icon: Icon.Meter,
        color: 'green'
      }
    ],
    []
  );

  return settings;
};
