import { partition } from 'lodash';
import { Icon } from 'nightwatch-ui';
import React from 'react';
import {
  isWalletAddress,
  Setting,
  SETTINGS_LABELS,
  SettingType,
  SettingValue,
  useAsyncHcaptcha
} from 'skiff-front-utils';
import { insertIf, isUDAddress } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import { useCurrentUserEmailAliases } from '../../../hooks/useCurrentUserEmailAliases';

import AddEmailAlias from './AddEmailAlias/AddEmailAlias';
import { AddWalletAlias } from './AddWalletAlias/AddWalletAlias';
import { ENSAlias } from './ENSAlias/ENSAlias';

export const useAliasesSettings: () => Setting[] = () => {
  const user = useRequiredCurrentUserData();
  const emailAliases = useCurrentUserEmailAliases();
  const [walletAliases, nonWalletAliases] = partition(emailAliases, (email) => {
    const [alias] = email.split('@');
    return isWalletAddress(alias) || isUDAddress(email);
  });
  const { hcaptchaElement, requestHcaptchaToken } = useAsyncHcaptcha();
  return [
    {
      type: SettingType.Custom,
      value: SettingValue.AddEmailAlias,
      component: (
        <AddEmailAlias
          emailAliases={nonWalletAliases}
          hcaptchaElement={hcaptchaElement}
          requestHcaptchaToken={requestHcaptchaToken}
          userID={user.userID}
        />
      ),
      label: SETTINGS_LABELS[SettingValue.AddEmailAlias],
      icon: Icon.Mailbox,
      color: 'blue'
    },
    {
      value: SettingValue.AddWalletAlias,
      type: SettingType.Custom,
      component: (
        <AddWalletAlias
          requestHcaptchaToken={requestHcaptchaToken}
          userID={user.userID}
          walletAliases={walletAliases}
        />
      ),
      label: SETTINGS_LABELS[SettingValue.AddWalletAlias],
      icon: Icon.Wallet,
      color: 'green'
    },
    ...insertIf<Setting>(!!walletAliases.length, {
      value: SettingValue.ENSAlias,
      type: SettingType.Custom,
      component: <ENSAlias key='ens-alias' walletAliases={walletAliases} />,
      label: SETTINGS_LABELS[SettingValue.ENSAlias],
      icon: Icon.Atom,
      color: 'orange'
    })
  ];
};
