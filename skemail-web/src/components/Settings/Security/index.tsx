import { Icon } from 'nightwatch-ui';
import {
  EncryptionKeys,
  Setting,
  SETTINGS_LABELS,
  SettingType,
  SettingValue,
  useGetFF,
  useUserPreference
} from 'skiff-front-utils';
import { insertIf, PgpFlag, StorageTypes } from 'skiff-utils';

import DeleteAccount from '../Account/DeleteAccount/DeleteAccount';

import AccountRecovery from './AccountRecovery/AccountRecovery';
import ChangePassword from './ChangePassword/ChangePassword';
import LastVerifiedDate from './LastVerifiedDate/LastVerifiedDate';
import SetupMFA from './SetupMFA/SetupMFA';
import ViewVerificationPhrase from './VerificationPhrase/ViewVerificationPhrase';

// TODO
// SetupMFA

export const useSecuritySettings: () => Setting[] = () => {
  const [disableLoadRemoteContent, setDisableLoadRemoteContent] = useUserPreference(StorageTypes.BLOCK_REMOTE_CONTENT);
  const [autoAttachPgp, setAutoAttachPgp] = useUserPreference(StorageTypes.AUTO_ATTACH_PGP_PUBLIC_KEY);

  const hasPgpFlag = useGetFF<PgpFlag>('pgp');

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
    ...insertIf<Setting>(hasPgpFlag, {
      type: SettingType.Custom,
      value: SettingValue.PgpKeys,
      component: <EncryptionKeys key='encrpytion-keys' />,
      label: SETTINGS_LABELS[SettingValue.PgpKeys],
      icon: Icon.Key,
      color: 'red'
    }),
    ...insertIf<Setting>(hasPgpFlag, {
      type: SettingType.Toggle,
      description: 'Always attach your public key to each message you send',
      value: SettingValue.AttachPgp,
      label: SETTINGS_LABELS[SettingValue.AttachPgp],
      icon: Icon.Lock,
      color: 'dark-blue',
      onChange: () => {
        setAutoAttachPgp(!autoAttachPgp);
      },
      checked: autoAttachPgp
    }),
    {
      type: SettingType.Custom,
      value: SettingValue.VerificationPhrase,
      component: <ViewVerificationPhrase key='view-verified-phrase' />,
      label: SETTINGS_LABELS[SettingValue.VerificationPhrase],
      icon: Icon.Clipboard,
      color: 'yellow'
    },
    {
      value: SettingValue.DeleteAccount,
      type: SettingType.Custom,
      component: <DeleteAccount key='delete-account' />,
      label: SETTINGS_LABELS[SettingValue.DeleteAccount],
      icon: Icon.Trash,
      color: 'red'
    }
  ];
  return securitySettingsArr;
};
