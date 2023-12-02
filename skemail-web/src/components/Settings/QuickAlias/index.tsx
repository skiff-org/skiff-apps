import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { SETTINGS_LABELS, Setting, SettingType, SettingValue } from 'skiff-front-utils';

import QuickAliases from './QuickAliases';

export const useQuickAliasSettings: () => Setting[] = () => {
  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.QuickAlias,
        fullHeight: true,
        component: <QuickAliases />,
        label: SETTINGS_LABELS[SettingValue.QuickAlias],
        icon: Icon.Bolt,
        color: 'yellow'
      }
    ],
    []
  );

  return settings;
};
