import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';

import DateHourFormat from './DateHourFormat/DateHourFormat';
import { MailboxViewMode } from './MailboxViewMode/MailboxViewMode';
import ThemeSelectSettings from './ThemeSelect/ThemeSelectSettings';

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
      ...insertIf<Setting>(!isMobile, {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.MailboxLayout],
        value: SettingValue.MailboxLayout,
        icon: Icon.SplitView,
        color: 'dark-blue',
        component: <MailboxViewMode key='layout' />
      })
    ],
    []
  );

  return settings;
};
