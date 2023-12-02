import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import SkemailCreditManagement from './SkemailCreditManagement';

export const creditSettings: Setting[] = [
  {
    type: SettingType.Custom,
    value: SettingValue.CreditManagement,
    component: <SkemailCreditManagement />,
    label: SETTINGS_LABELS[SettingValue.CreditManagement],
    icon: Icon.Trophy,
    color: 'blue'
  }
];
