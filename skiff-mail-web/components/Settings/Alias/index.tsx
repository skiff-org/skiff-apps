import { Icon } from '@skiff-org/skiff-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  Setting,
  SETTINGS_LABELS,
  SettingType,
  SettingValue,
  TitleActionSection,
  useAsyncHcaptcha,
  useCurrentUserEmailAliases,
  useUserPreference
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { insertIf, StorageTypes, getCategorizedAliases } from 'skiff-utils';

import { useShowAliasInboxes } from '../../../hooks/useShowAliasInboxes';
import { storeWorkspaceEvent } from '../../../utils/userUtils';

import AddEmailAlias from './AddEmailAlias/AddEmailAlias';
import { AddWalletAlias } from './AddWalletAlias/AddWalletAlias';
import { ENSAlias } from './ENSAlias/ENSAlias';

export const useAliasesSettings: () => Setting[] = () => {
  const emailAliases = useCurrentUserEmailAliases();
  const { cryptoAliases: walletAliases, nonCryptoAliases: nonWalletAliases } = getCategorizedAliases(emailAliases);
  const { hcaptchaElement, requestHcaptchaToken } = useAsyncHcaptcha(false);

  const { aliasInboxesFF } = useShowAliasInboxes();
  // Alias inbox setting value in local storage
  const [isAliasInboxesOn, setIsAliasInboxesOn] = useUserPreference(StorageTypes.SHOW_ALIAS_INBOXES);

  const aliasInboxBaseSetting: Pick<Setting, 'value' | 'label' | 'icon' | 'color'> = {
    value: SettingValue.AliasInboxes,
    label: SETTINGS_LABELS[SettingValue.AliasInboxes],
    icon: Icon.Gallery,
    color: 'yellow'
  };
  const aliasInboxDescription = 'Sort email into separate inboxes for each of your aliases';
  const onAliasInboxToggleChange = () => {
    const turnOn = !isAliasInboxesOn;
    setIsAliasInboxesOn(!isAliasInboxesOn);
    const workspaceEventType = turnOn ? WorkspaceEventType.AliasInboxEnabled : WorkspaceEventType.AliasInboxDisabled;
    void storeWorkspaceEvent(workspaceEventType, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  const includeDeleteOption = emailAliases.length > 1;

  const aliasInboxSetting: Setting = !isMobile
    ? {
        ...aliasInboxBaseSetting,
        type: SettingType.Toggle,
        description: aliasInboxDescription,
        onChange: onAliasInboxToggleChange,
        checked: isAliasInboxesOn
      }
    : // Custom Setting type for mobile so that we also render the description
      // This will open up "Alias inboxes" with its description and toggle in a new screen in the Settings drawer
      {
        ...aliasInboxBaseSetting,
        type: SettingType.Custom,
        component: (
          <TitleActionSection
            actions={[
              {
                dataTest: SettingValue.AliasInboxes,
                onChange: onAliasInboxToggleChange,
                checked: isAliasInboxesOn,
                type: 'toggle'
              }
            ]}
            subtitle={aliasInboxDescription}
            title={SETTINGS_LABELS[SettingValue.AliasInboxes]}
          />
        )
      };

  return [
    {
      type: SettingType.Custom,
      value: SettingValue.AddEmailAlias,
      component: (
        <AddEmailAlias
          emailAliases={nonWalletAliases}
          hcaptchaElement={hcaptchaElement}
          includeDeleteOption={includeDeleteOption}
          requestHcaptchaToken={requestHcaptchaToken}
        />
      ),
      label: SETTINGS_LABELS[SettingValue.AddEmailAlias],
      icon: Icon.Mailbox,
      color: 'blue'
    },
    ...insertIf<Setting>(!isMobile, {
      value: SettingValue.AddWalletAlias,
      type: SettingType.Custom,
      component: (
        <AddWalletAlias
          includeDeleteOption={includeDeleteOption}
          requestHcaptchaToken={requestHcaptchaToken}
          walletAliases={walletAliases}
        />
      ),
      label: SETTINGS_LABELS[SettingValue.AddWalletAlias],
      icon: Icon.Wallet,
      color: 'green'
    }),
    ...insertIf<Setting>(!!walletAliases.length, {
      value: SettingValue.ENSAlias,
      type: SettingType.Custom,
      component: <ENSAlias key='ens-alias' walletAliases={walletAliases} />,
      label: SETTINGS_LABELS[SettingValue.ENSAlias],
      icon: Icon.Atom,
      color: 'orange'
    }),
    ...insertIf<Setting>(aliasInboxesFF, aliasInboxSetting)
  ];
};
