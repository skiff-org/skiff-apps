import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from '@skiff-org/skiff-ui';
import { useState } from 'react';
import { getEnvironment, Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { AutoForwardingFlag, insertIf } from 'skiff-utils';

import { AutoForwardingInstructions } from './AutoForwardingInstructions/AutoForwardingInstructions';
import { ImportMail } from './ImportMail/ImportMail';

export const useImportSettings: () => Setting[] = () => {
  const flags = useFlags();
  const env = getEnvironment(new URL(window.location.origin));
  const hasAutoForwardingFlag = env === 'local' || env === 'vercel' || (flags.autoForwarding as AutoForwardingFlag);

  const [googleLogin, setGoogleLogin] = useState(false);
  const importMailSetting: Setting = {
    type: SettingType.Custom,
    value: SettingValue.ImportMail,
    component: <ImportMail googleLogin={googleLogin} key='import-mail' setGoogleLogin={setGoogleLogin} />,
    label: SETTINGS_LABELS[SettingValue.ImportMail],
    icon: Icon.Mailbox,
    color: 'green'
  };

  const autoForwardingSetting: Setting = {
    type: SettingType.Custom,
    value: SettingValue.AutoForwarding,
    component: <AutoForwardingInstructions key='auto-forward' />,
    label: SETTINGS_LABELS[SettingValue.AutoForwarding],
    icon: Icon.ForwardEmail,
    color: 'pink'
  };
  const importSettings: Setting[] = [importMailSetting, ...insertIf(!hasAutoForwardingFlag, autoForwardingSetting)];

  return importSettings;
};
