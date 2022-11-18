import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import AccountRecovery from './AccountRecovery/AccountRecovery';
import ChangePassword from './ChangePassword/ChangePassword';
import LastVerifiedDate from './LastVerifiedDate/LastVerifiedDate';
import SetupMFA from './SetupMFA/SetupMFA';
import ViewVerificationPhrase from './VerificationPhrase/ViewVerificationPhrase';

// TODO
// SetupMFA

export const securitySettings: Setting[] = [
  {
    type: SettingType.Custom,
    value: SettingValue.AccountRecovery,
    component: <AccountRecovery key='account-recovery' />,
    label: SETTINGS_LABELS[SettingValue.AccountRecovery],
    icon: Icon.Medkit,
    color: 'red'
  },
  {
    type: SettingType.Custom,
    value: SettingValue.SetupMFA,
    component: <SetupMFA key='setup-mfa' />,
    label: SETTINGS_LABELS[SettingValue.SetupMFA],
    icon: Icon.QrCodeScan,
    color: 'pink'
  },
  {
    type: SettingType.Custom,
    value: SettingValue.ChangePassword,
    component: <ChangePassword key='change-password' />,
    label: SETTINGS_LABELS[SettingValue.ChangePassword],
    icon: Icon.Key,
    color: 'orange'
  },
  {
    type: SettingType.Custom,
    value: SettingValue.LastVerifiedDate,
    component: <LastVerifiedDate key='last-verified-date' />,
    label: SETTINGS_LABELS[SettingValue.LastVerifiedDate],
    icon: Icon.History,
    color: 'dark-blue'
  },
  {
    type: SettingType.Custom,
    value: SettingValue.VerificationPhrase,
    component: <ViewVerificationPhrase key='view-verified-phrase' />,
    label: SETTINGS_LABELS[SettingValue.VerificationPhrase],
    icon: Icon.Clipboard,
    color: 'yellow'
  }
];
