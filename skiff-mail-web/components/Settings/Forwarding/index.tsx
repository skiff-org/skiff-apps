import { Icon } from '@skiff-org/skiff-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { AutoForwarding } from './AutoForwarding/AutoForwarding';

export const useForwardingSettings: () => Setting[] = () => {
  return [
    {
      type: SettingType.Custom,
      value: SettingValue.AutoForwarding,
      component: <AutoForwarding key='auto-forward' />,
      label: SETTINGS_LABELS[SettingValue.AutoForwarding],
      icon: Icon.ForwardEmail,
      color: 'pink'
    }
  ];
};
