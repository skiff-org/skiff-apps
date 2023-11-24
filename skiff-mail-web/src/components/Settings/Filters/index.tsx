import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { Filters } from './Filters';
import { SpamLists } from './SpamLists';

export const useFiltersSettings: () => Setting[] = () => {
  return [
    {
      value: SettingValue.Filters,
      type: SettingType.Custom,
      component: <Filters />,
      label: SETTINGS_LABELS[SettingValue.Filters],
      icon: Icon.Filter,
      color: 'green'
    },
    {
      value: SettingValue.SpamList,
      type: SettingType.Custom,
      component: <SpamLists />,
      label: SETTINGS_LABELS[SettingValue.SpamList],
      icon: Icon.Spam,
      color: 'green'
    }
  ];
};
