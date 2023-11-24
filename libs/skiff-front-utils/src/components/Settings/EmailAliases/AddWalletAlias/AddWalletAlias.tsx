import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import { Keplr } from '@keplr-wallet/types/build/wallet/keplr';
import {
  Button,
  Dialog,
  Icons,
  Tooltip,
  TooltipContent,
  TooltipPlacement,
  TooltipTrigger,
  Type,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import { useState } from 'react';
import { isFirefox } from 'react-device-detect';
import { useUserLabelsLazyQuery, useVerifyWalletAddressCreateAliasMutation } from 'skiff-front-graphql';

import { isCosmosHubAddress, isNameServiceAddress } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../../apollo';
import { useDefaultEmailAlias, useDeleteEmailAlias, useToast } from '../../../../hooks';
import { WalletAliasWithName } from '../../../../types';
import {
  CosmosProvider,
  EthProvider,
  MultichainProvider,
  SolanaProvider,
  WALLET_PROVIDERS,
  WalletProvider,
  WalletProviderInfo,
  abbreviateWalletAddress,
  activateEthProvider,
  getSolanaProvider,
  isCosmosProvider,
  isEthProvider,
  isSolProvider,
  resolveAndSetENSDisplayName,
  splitEmailToAliasAndDomain,
  updateEmailAliases
} from '../../../../utils';
import { UserAvatar } from '../../../UserAvatar';
import TitleActionSection from '../../TitleActionSection';
import DefaultEmailTag from '../DefaultEmailTag';
import EmailAliasOptions from '../EmailAliasOptions';

const EmailAliasesContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  margin: 0 0 20px 0;
`;

const WalletAliasRow = styled.div<{ $selected: boolean }>`
  display: flex;
  justify-content: space-between;
  /* width: calc(100% - 52px); */
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : 'transparent')};
  border-radius: 6px;
  padding: 8px;
  :hover {
    background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : 'var(--bg-overlay-quaternary)')};
  }
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

const WalletButtonContainer = styled.div`
  width: 48%; // with flex wrap creates 2 cols
`;

const EmailAliasRowEnd = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

interface AddWalletAliasProps {
  walletAliases: string[];
  requestHcaptchaToken: () => Promise<string>;
  includeDeleteOption: boolean;
  walletAliasesWithName: WalletAliasWithName[];
  client: ApolloClient<NormalizedCacheObject>;
  setSelectedAddress: (selectedAddress: string | undefined) => void;
  selectedAddress?: string;
}

/**
 * Component for rendering the interface to add wallet aliases.
 */
export const AddWalletAlias = ({
  walletAliases,
  requestHcaptchaToken,
  includeDeleteOption,
  walletAliasesWithName,
  setSelectedAddress,
  selectedAddress,
  client
}: AddWalletAliasProps) => {
  const { enqueueToast } = useToast();
  const user = useRequiredCurrentUserData();
  const { userID } = user;

  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);

  const deleteEmailAlias = useDeleteEmailAlias(requestHcaptchaToken);
  const [verifyCreate] = useVerifyWalletAddressCreateAliasMutation();
  const [fetchUserLabels] = useUserLabelsLazyQuery();

  // isAddingWallet is a dict keeps track of if the user is currently adding any of the wallet options
  const initialIsAddingWallet: Record<WalletProvider, boolean> = {
    [EthProvider.MetaMask]: false,
    [EthProvider.Coinbase]: false,
    [EthProvider.Brave]: false,
    [SolanaProvider.Phantom]: false,
    [CosmosProvider.Keplr]: false,
    [MultichainProvider.BitKeep]: false
  };
  Object.values(EthProvider).forEach((provider) => ({ ...initialIsAddingWallet, [provider]: false }));
  Object.values(SolanaProvider).forEach((provider) => ({ ...initialIsAddingWallet, [provider]: false }));

  const [isAddingWallet, setIsAddingWallet] = useState(initialIsAddingWallet);

  const handleAddWalletError = (error: ApolloError) => {
    console.error(error.message);
    enqueueToast({
      title: 'Failed to add wallet',
      body: error.message
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

  const addWallet = async (providerName: WalletProvider, client: ApolloClient<NormalizedCacheObject>) => {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

      const { connectEthWallet, connectSolWallet, connectCosmosWallet } = await import(
        '../../../../utils/walletUtils/walletUtils'
      );
      let challenge = '';
      let challengeSignature = '';
      // Right now, we only support BitKeep's eth wallet
      if (isEth || isBitkeep) {
        ({ challenge, challengeSignature } = await connectEthWallet(provider as EthProvider, client));
      } else if (isSol) {
        ({ challenge, challengeSignature } = await connectSolWallet(provider as SolanaProvider, client));
      } else if (isCosmos) {
        ({ challenge, challengeSignature } = await connectCosmosWallet(provider as Keplr, client));
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
            // refetch user labels to update aliases labels in the sidebar
            void fetchUserLabels();
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
      <WalletButtonContainer>
        <Button
          fullWidth
          icon={<Icons color='source' icon={icon} />}
          key={`add-${walletName}`}
          loading={!!isAddingWallet[provider]}
          onClick={onClick}
          type={Type.SECONDARY}
        >
          {isAddingWallet[provider] ? `Check wallet...` : walletName}
        </Button>
      </WalletButtonContainer>
    );
  };

  const walletDescription = `${
    walletAliases.length ? 'S' : 'Connect a wallet to s'
  }end and receive email from your Web3 identity`;

  return (
    <>
      <TitleActionSection
        subtitle={walletDescription}
        title='Wallet addresses'
        actions={[
          {
            onClick: () => setShowAddWalletModal(true),
            label: 'Add wallet',
            type: 'button'
          }
        ]}
      />
      {!!walletAliases.length && (
        <EmailAliasesContainer>
          {walletAliases.map((email) => {
            const { alias, domain: mailDomain } = splitEmailToAliasAndDomain(email);
            // Do not render individual rows for name service addresses (ie ENS) or Cosmos
            // Hub addresses, as those are co-located with the wallet addresses that
            // the name service address resolves from (or in the case for Cosmos, the Juno address)
            if (isNameServiceAddress(alias) || isCosmosHubAddress(alias)) return;
            const abbreviatedWalletAddress = `${abbreviateWalletAddress(alias)}@${mailDomain}`;
            const isDefaultEmailAlias = defaultEmailAlias === email;
            const nameAddress = walletAliasesWithName.find(
              (walletAliasInfo) => walletAliasInfo.walletAlias === email
            )?.nameAlias;
            const { alias: nameAddressAlias } = nameAddress ? splitEmailToAliasAndDomain(nameAddress) : { alias: '' };
            // Abbreviate Cosmos name addresses
            const shouldAbbreviateDisplayNameAddress = isCosmosHubAddress(nameAddressAlias);
            const displayNameAddress =
              nameAddressAlias && shouldAbbreviateDisplayNameAddress
                ? `${abbreviateWalletAddress(nameAddressAlias)}@${mailDomain}`
                : nameAddress;
            const defaultEmailTooltip = nameAddressAlias ? '' : email;
            return (
              <WalletAliasRow
                key={email}
                onClick={() => setSelectedAddress(email)}
                $selected={email === selectedAddress}
              >
                <WalletAlias>
                  <UserAvatar label={alias} />
                  <div>
                    <Tooltip placement={TooltipPlacement.RIGHT}>
                      <TooltipContent>
                        {/**
                         * If we are abbreviating the wallet address, show the full value in the tooltip.
                         * If there is a nameAddressAlias we want to display but we do not
                         * want to abbreviate it (ie an ENS alias), render an empty string in the tooltip content.
                         */}
                        {nameAddressAlias && shouldAbbreviateDisplayNameAddress ? nameAddress : defaultEmailTooltip}
                      </TooltipContent>
                      <TooltipTrigger>
                        <Typography>{displayNameAddress ?? abbreviatedWalletAddress}</Typography>
                      </TooltipTrigger>
                    </Tooltip>
                    {!!nameAddress && (
                      <Tooltip placement={TooltipPlacement.RIGHT}>
                        <TooltipContent>{email}</TooltipContent>
                        <TooltipTrigger>
                          <Typography color='secondary' size={TypographySize.SMALL}>
                            {abbreviatedWalletAddress}
                          </Typography>
                        </TooltipTrigger>
                      </Tooltip>
                    )}
                  </div>
                </WalletAlias>
                <EmailAliasRowEnd>
                  {isDefaultEmailAlias && <DefaultEmailTag />}
                  <EmailAliasOptions
                    alias={email}
                    client={client}
                    deleteAlias={() => void deleteEmailAlias(email)}
                    includeDeleteOption={includeDeleteOption}
                    onSetDefaultAlias={(newValue: string) => void resolveAndSetENSDisplayName(newValue, user, client)}
                    userID={userID}
                    setSelectedAddress={setSelectedAddress}
                  />
                </EmailAliasRowEnd>
              </WalletAliasRow>
            );
          })}
        </EmailAliasesContainer>
      )}
      <Dialog
        title='Connect wallet'
        customContent
        open={showAddWalletModal}
        onClose={() => setShowAddWalletModal(false)}
      >
        <WalletButtons noWalletAliases={!walletAliases.length}>
          {Object.entries(WALLET_PROVIDERS)
            .filter(([provider]) => !(isFirefox && provider === EthProvider.MetaMask)) // hide MetaMask button on Firefox and Bitkeep
            .map(([provider, providerInfo]) =>
              renderWalletButton(provider as WalletProvider, providerInfo, () => {
                void addWallet(provider as WalletProvider, client);
              })
            )}
        </WalletButtons>
      </Dialog>
    </>
  );
};
