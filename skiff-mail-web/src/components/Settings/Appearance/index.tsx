import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue, ThemeSelectSettings } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';

import DateHourFormat from './DateHourFormat/DateHourFormat';
import { SwipeSettings } from './Swipe/SwipeSettings';

export const useAppearanceSettings: () => Setting[] = () => {
  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.Theme],
        value: SettingValue.Theme,
        icon: Icon.Themes,
        color: 'green',
        component: <ThemeSelectSettings />
      },
      {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.DateHourFormat],
        value: SettingValue.DateHourFormat,
        icon: Icon.Clock,
        color: 'pink',
        component: <DateHourFormat key='date-hour-format' />
      },
      ...insertIf<Setting>(isMobile, {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.SwipeSettings],
        value: SettingValue.SwipeSettings,
        icon: Icon.ArrowRight,
        color: 'dark-blue',
        component: <SwipeSettings key='swipe' />
      })
    ],
    []
  );

  return settings;
};
