import { ApolloError } from '@apollo/client';
import { Keplr } from '@keplr-wallet/types';
import { Button, Icon, Tooltip, Typography } from 'nightwatch-ui';
import React, { useState } from 'react';
import { isFirefox } from 'react-device-detect';
import {
  UserAvatar,
  abbreviateWalletAddress,
  useToast,
  isEthProvider,
  isSolProvider,
  isCosmosProvider,
  EthProvider,
  WalletProvider,
  SolanaProvider,
  TitleActionSection,
  CosmosProvider,
  MultichainProvider,
  WalletProviderInfo,
  activateEthProvider,
  getSolanaProvider,
  WALLET_PROVIDERS
} from 'skiff-front-utils';
import { useVerifyWalletAddressCreateAliasMutation } from 'skiff-mail-graphql';
import styled from 'styled-components';

import { updateEmailAliases } from '../../../../utils/cache/cache';
import { connectCosmosWallet, connectEthWallet, connectSolWallet } from '../../../../utils/walletUtils/walletUtils';
import AliasOptions from '../AliasOptions/AliasOptions';

import AddUDAlias from './AddUDAlias';

const EmailAliasesContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  flex-direction: column;
  margin: 12px 0 20px 0;
`;

const WalletAliasRow = styled.div`
  display: flex;
  height: 20%;
  justify-content: space-between;
  width: 100%;
`;

const WalletButtons = styled.div<{ noWalletAliases: boolean }>`
  width: 100%;
  gap: 12px;
  display: flex;
  flex-wrap: wrap;
  ${(props) => (props.noWalletAliases ? `margin-top: 12px;` : null)}
`;

const WalletAlias = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  max-width: 75%;
`;

const WalletButton = styled(Button)`
  width: 48%; // with flex wrap creates 2 cols
`;

const AnotherWalletText = styled(Typography)`
  margin-bottom: 4px;
`;

interface AddWalletAliasProps {
  walletAliases: string[];
  userID: string;
  requestHcaptchaToken: () => Promise<string>;
}

/**
 * Component for rendering the interface to add wallet aliases.
 */
export const AddWalletAlias = ({ walletAliases, userID, requestHcaptchaToken }: AddWalletAliasProps) => {
  const { enqueueToast } = useToast();
  const [verifyCreate] = useVerifyWalletAddressCreateAliasMutation();

  // isAddingWallet is a dict keeps track of if the user is currently adding any of the wallet options
  const initialIsAddingWallet = {};
  Object.values(EthProvider).forEach((provider) => ({ ...initialIsAddingWallet, [provider]: false }));
  Object.values(SolanaProvider).forEach((provider) => ({ ...initialIsAddingWallet, [provider]: false }));

  const [isAddingWallet, setIsAddingWallet] = useState(initialIsAddingWallet);

  const handleAddWalletError = (error: ApolloError) => {
    console.error(error.message);
    enqueueToast({
      body: error.message,
      icon: Icon.Warning
    });
  };

  const redirectToWalletDownloadPage = (providerName: WalletProvider) => {
    let walletURL = '';
    switch (providerName) {
      case EthProvider.MetaMask:
        walletURL = 'https://metamask.io/download/';
        break;
      case EthProvider.Coinbase:
        walletURL = 'https://www.coinbase.com/wallet';
        break;
      case EthProvider.Brave:
        walletURL = 'https://brave.com/wallet/';
        break;
      case SolanaProvider.Phantom:
        walletURL = 'https://phantom.app/';
        break;
      case CosmosProvider.Keplr:
        walletURL = 'https://keplr.app/';
        break;
      case MultichainProvider.BitKeep:
        walletURL = 'https://bitkeep.com/';
        break;
    }
    if (walletURL) window.open(walletURL, '_blank');
  };

  const addWallet = async (providerName: WalletProvider) => {
    const isEth = isEthProvider(providerName);
    const isSol = isSolProvider(providerName);
    const isCosmos = isCosmosProvider(providerName);
    const isBitkeep = providerName === MultichainProvider.BitKeep;
    if (!isEth && !isSol && !isCosmos && !isBitkeep) {
      console.error(`We currently do not support ${providerName}.`);
      return;
    }

    try {
      setIsAddingWallet((prev) => ({ ...prev, [providerName]: true }));
      // Selecting the provider prevents multiple wallet windows from popping up
      let provider: any = null;
      if (isEth) {
        provider = activateEthProvider(providerName as EthProvider);
      } else if (isSol) {
        provider = getSolanaProvider(providerName as SolanaProvider);
      } else if (isCosmos) {
        provider = window.keplr;
      } else if (isBitkeep) {
        // BitKeep provider injected at window.bitkeep.ethereum, not window.ethereum,
        // see https://docs.bitkeep.com/guide/wallet/ethereum.html#basic-usage.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        provider = window.bitkeep?.ethereum;
      }

      // Redirect to external wallet download page is the wallet is not detected
      if (!provider) {
        redirectToWalletDownloadPage(providerName);
        setIsAddingWallet((prev) => ({ ...prev, [providerName]: false }));
        return;
      }

      let challenge, challengeSignature;
      // Right now, we only support BitKeep's eth wallet
      if (isEth || isBitkeep) {
        ({ challenge, challengeSignature } = await connectEthWallet(provider as EthProvider));
      } else if (isSol) {
        ({ challenge, challengeSignature } = await connectSolWallet(provider as SolanaProvider));
      } else if (isCosmos) {
        ({ challenge, challengeSignature } = await connectCosmosWallet(provider as Keplr));
      }
      // Add wallet as email alias
      // Wallet type and source are used for metric tracking
      await verifyCreate({
        variables: {
          request: {
            challenge,
            challengeSignature,
            walletType: providerName,
            isEditorOnboarding: false,
            source: 'SETTINGS'
          }
        },
        update: (cache, response) => {
          const emailAliases = response.data?.verifyWalletAddressCreateAlias?.emailAliases;
          if (!response.errors && emailAliases) {
            updateEmailAliases(cache, userID, emailAliases);
          }
        }
      });
    } catch (e: any) {
      handleAddWalletError(e as ApolloError);
    }
    setIsAddingWallet((prev) => ({ ...prev, [providerName]: false }));
  };

  const renderWalletButton = (provider: WalletProvider, providerInfo: WalletProviderInfo, onClick: () => void) => {
    const { walletName, icon } = providerInfo;
    return (
      <WalletButton
        align='center'
        disabled={isAddingWallet[provider]}
        iconColor='source'
        key={`add-${walletName}`}
        onClick={onClick}
        startIcon={icon}
        type='secondary'
      >
        {isAddingWallet[provider] ? `Check wallet...` : walletName}
      </WalletButton>
    );
  };
  const walletDescription = `${
    walletAliases.length ? 'S' : 'Connect a wallet to s'
  }end and receive email from your Web3 identity.`;
  return (
    <>
      <TitleActionSection subtitle={walletDescription} title='Wallet aliases' />
      {!!walletAliases.length && (
        <EmailAliasesContainer>
          {walletAliases.map((email) => {
            const [alias, mailDomain] = email.split('@');
            const abbreviatedWalletAddress = `${abbreviateWalletAddress(alias)}@${mailDomain}`;
            return (
              <WalletAliasRow key={email}>
                <WalletAlias>
                  <UserAvatar label={alias} />
                  <Tooltip direction='top' label={email}>
                    <span>
                      <Typography type='paragraph'>{abbreviatedWalletAddress}</Typography>
                    </span>
                  </Tooltip>
                </WalletAlias>
                <AliasOptions emailAlias={email} requestHcaptchaToken={requestHcaptchaToken} userID={userID} />
              </WalletAliasRow>
            );
          })}
        </EmailAliasesContainer>
      )}
      {!!walletAliases.length && <AnotherWalletText>Connect another wallet</AnotherWalletText>}
      <WalletButtons noWalletAliases={!walletAliases.length}>
        {Object.entries(WALLET_PROVIDERS)
          .filter(([provider]) => !(isFirefox && provider === EthProvider.MetaMask)) // hide MetaMask button on Firefox and Bitkeep
          .map(([provider, providerInfo]) =>
            renderWalletButton(provider as WalletProvider, providerInfo, () => {
              void addWallet(provider as WalletProvider);
            })
          )}
        <AddUDAlias />
      </WalletButtons>
    </>
  );
};
