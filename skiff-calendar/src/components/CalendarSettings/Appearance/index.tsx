import { Icon } from 'nightwatch-ui';
import { SettingType, SettingValue, SETTINGS_LABELS, Setting, ThemeSelectSettings } from 'skiff-front-utils';

import { CalendarDefaultColor } from './CalendarDefaultColor';

export const useAppearanceSettings: () => Setting[] = () => {
  return [
    {
      type: SettingType.Custom,
      value: SettingValue.Theme,
      component: <ThemeSelectSettings />,
      label: SETTINGS_LABELS[SettingValue.Theme],
      icon: Icon.Themes,
      color: 'green'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.DefaultColor,
      component: <CalendarDefaultColor />,
      label: SETTINGS_LABELS[SettingValue.DefaultColor],
      icon: Icon.Themes,
      color: 'green'
    }
  ];
};
