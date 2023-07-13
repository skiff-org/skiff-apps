import { Icon } from '@skiff-org/skiff-ui';
import React from 'react';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { Filters } from './Filters';

export const useFiltersSettings: () => Setting[] = () => {
  return [
    {
      value: SettingValue.Filters,
      type: SettingType.Custom,
      component: <Filters />,
      label: SETTINGS_LABELS[SettingValue.Filters],
      icon: Icon.Filter,
      color: 'green',
      fullHeight: true
    }
  ];
};
