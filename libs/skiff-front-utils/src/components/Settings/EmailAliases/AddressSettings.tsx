import { Divider, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import { PaywallErrorCode, StorageTypes, getCategorizedAliases } from 'skiff-utils';
import styled from 'styled-components';
import { useRequiredCurrentUserData } from '../../../apollo';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../../constants';
import { useAsyncHcaptcha, useCurrentUserEmailAliases, useDeleteEmailAlias, useUserPreference } from '../../../hooks';
import { resolveAndSetENSDisplayName } from '../../../utils';
import { SETTINGS_LABELS, SettingValue, SettingsPage } from '../Settings.types';
import TitleActionSection from '../TitleActionSection';
import AddEmailAlias from './AddEmailAlias/AddEmailAlias';
import { AddWalletAlias } from './AddWalletAlias/AddWalletAlias';
import { ENSAlias } from './ENSAlias/ENSAlias';
import SelectedAddressView from './SelectedAddressView';

const Left = styled.div<{ $addressIsSelected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: ${({ $addressIsSelected }) => ($addressIsSelected ? '50%' : '100%')};
  height: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Gaps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const FullView = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--bg-l1-solid);
`;

interface AddressSettingsProps {
  client: ApolloClient<NormalizedCacheObject>;
  openPaywallModal: (paywallErrorCode: PaywallErrorCode) => void;
  openSettings: (page: SettingsPage) => void;
}

export default function AddressSettings({ client, openPaywallModal, openSettings }: AddressSettingsProps) {
  const user = useRequiredCurrentUserData();

  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);
  const { emailAliases, walletAliasesWithName } = useCurrentUserEmailAliases();
  const { cryptoAliases: walletAliases, nonCryptoOrQuickAliases } = getCategorizedAliases(emailAliases);
  const { hcaptchaElement, requestHcaptchaToken } = useAsyncHcaptcha(false);
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  // Alias inbox setting value in local storage
  const [isAliasInboxesOn, setIsAliasInboxesOn] = useUserPreference(StorageTypes.SHOW_ALIAS_INBOXES);

  const deleteEmailAlias = useDeleteEmailAlias(requestHcaptchaToken);
  const onSetDefaultAlias = (newValue: string) => void resolveAndSetENSDisplayName(newValue, user, client);

  const aliasInboxDescription = 'Sort email into separate inboxes for each of your addresses';
  const onAliasInboxToggleChange = () => {
    const turnOn = !isAliasInboxesOn;
    setIsAliasInboxesOn(!isAliasInboxesOn);
    const workspaceEventType = turnOn ? WorkspaceEventType.AliasInboxEnabled : WorkspaceEventType.AliasInboxDisabled;
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: workspaceEventType,
          data: '',
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });
  };

  const includeDeleteOption = emailAliases.length > 1;

  return (
    <FullView>
      <Left $addressIsSelected={!!selectedAddress}>
        <Gaps>
          <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            Addresses
          </Typography>
          <AddEmailAlias
            emailAliases={nonCryptoOrQuickAliases}
            hcaptchaElement={hcaptchaElement}
            includeDeleteOption={includeDeleteOption}
            requestHcaptchaToken={requestHcaptchaToken}
            setSelectedAddress={setSelectedAddress}
            client={client}
            openPaywallModal={openPaywallModal}
            openSettings={openSettings}
            selectedAddress={selectedAddress}
          />
          {!isMobile && (
            <>
              <Divider color='tertiary' />
              <AddWalletAlias
                includeDeleteOption={includeDeleteOption}
                requestHcaptchaToken={requestHcaptchaToken}
                walletAliases={walletAliases}
                walletAliasesWithName={walletAliasesWithName}
                client={client}
                setSelectedAddress={setSelectedAddress}
                selectedAddress={selectedAddress}
              />
            </>
          )}
          {!!walletAliases.length && (
            <>
              <Divider color='tertiary' />
              <ENSAlias key='ens-alias' walletAliases={walletAliases} />
            </>
          )}
          <Divider color='tertiary' />
          <TitleActionSection
            actions={[
              {
                onChange: onAliasInboxToggleChange,
                type: 'toggle',
                checked: isAliasInboxesOn
              }
            ]}
            subtitle={aliasInboxDescription}
            title={SETTINGS_LABELS[SettingValue.AliasInboxes]}
          />
        </Gaps>
      </Left>
      {!!selectedAddress && (
        <SelectedAddressView
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
          deleteEmailAlias={deleteEmailAlias}
          includeDeleteOption={includeDeleteOption}
          onSetDefaultAlias={onSetDefaultAlias}
          openSettings={openSettings}
          userID={user.userID}
        />
      )}
    </FullView>
  );
}
