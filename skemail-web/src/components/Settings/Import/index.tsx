import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { ImportMail } from './ImportMail/ImportMail';

export const useImportSettings: () => Setting[] = () => {
  const importSettings: Setting[] = [
    {
      type: SettingType.Custom,
      value: SettingValue.ImportMail,
      component: <ImportMail key='import-mail' />,
      label: SETTINGS_LABELS[SettingValue.ImportMail],
      icon: Icon.Mailbox,
      color: 'green'
    }
  ];

  return importSettings;
};
