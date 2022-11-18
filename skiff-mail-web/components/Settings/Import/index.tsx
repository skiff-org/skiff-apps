import { Icon } from 'nightwatch-ui';
import { useState } from 'react';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { AutoForwarding } from './AutoForwarding/AutoForwarding';
import { ImportMail } from './ImportMail/ImportMail';

export const useImportSettings: () => Setting[] = () => {
  const [googleLogin, setGoogleLogin] = useState(false);

  return [
    {
      type: SettingType.Custom,
      value: SettingValue.ImportMail,
      component: <ImportMail googleLogin={googleLogin} key='import-mail' setGoogleLogin={setGoogleLogin} />,
      label: SETTINGS_LABELS[SettingValue.ImportMail],
      icon: Icon.Mailbox,
      color: 'green'
    },
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
