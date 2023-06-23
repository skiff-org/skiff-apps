import { Icon } from '@skiff-org/skiff-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import AccountRecovery from './AccountRecovery/AccountRecovery';
import ChangePassword from './ChangePassword/ChangePassword';
import LastVerifiedDate from './LastVerifiedDate/LastVerifiedDate';
import SetupMFA from './SetupMFA/SetupMFA';
import ViewVerificationPhrase from './VerificationPhrase/ViewVerificationPhrase';

// TODO
// SetupMFA

export const useSecuritySettings: () => Setting[] = () => {
  const [disableLoadRemoteContent, setDisableLoadRemoteContent] = useUserPreference(StorageTypes.BLOCK_REMOTE_CONTENT);

  const securitySettingsArr: Setting[] = [
    {
      type: SettingType.Custom,
      value: SettingValue.SetupMFA,
      component: <SetupMFA key='setup-mfa' />,
      label: SETTINGS_LABELS[SettingValue.SetupMFA],
      icon: Icon.QrCodeScan,
      color: 'yellow'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.ChangePassword,
      component: <ChangePassword key='change-password' />,
      label: SETTINGS_LABELS[SettingValue.ChangePassword],
      icon: Icon.Key,
      color: 'pink'
    },
    {
      type: SettingType.Toggle,
      description: 'Shield remote content from loading inside emails',
      value: SettingValue.LoadRemoteContent,
      label: SETTINGS_LABELS[SettingValue.LoadRemoteContent],
      icon: Icon.Download,
      color: 'dark-blue',
      onChange: () => {
        if (disableLoadRemoteContent) {
          setDisableLoadRemoteContent(false);
        } else {
          setDisableLoadRemoteContent(true);
        }
      },
      checked: disableLoadRemoteContent ?? false
    },
    {
      type: SettingType.Custom,
      value: SettingValue.AccountRecovery,
      component: <AccountRecovery key='account-recovery' />,
      label: SETTINGS_LABELS[SettingValue.AccountRecovery],
      icon: Icon.Medkit,
      color: 'green'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.LastVerifiedDate,
      component: <LastVerifiedDate key='last-verified-date' />,
      label: SETTINGS_LABELS[SettingValue.LastVerifiedDate],
      icon: Icon.History,
      color: 'green'
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
  return securitySettingsArr;
};
