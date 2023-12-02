import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { Setting, SETTINGS_LABELS, SettingValue, SettingType, getEnvironment } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';

import { ImportGoogleCalendar } from './ImportGoogleCalendar';
import { ImportICS } from './ImportICS';

export const useImportSettings: () => Setting[] = () => {
  const environment = getEnvironment(new URL(window.location.origin));

  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.ImportCalendar,
        component: <ImportICS />,
        label: SETTINGS_LABELS[SettingValue.ImportCalendar],
        icon: Icon.Upload,
        color: 'green'
      },
      ...insertIf<Setting>(environment === 'local', {
        type: SettingType.Custom,
        value: SettingValue.ImportGoogleCalendar,
        component: <ImportGoogleCalendar />,
        label: SETTINGS_LABELS[SettingValue.ImportGoogleCalendar],
        icon: Icon.Calendar,
        color: 'pink'
      })
    ],
    [environment]
  );
  return settings;
};
