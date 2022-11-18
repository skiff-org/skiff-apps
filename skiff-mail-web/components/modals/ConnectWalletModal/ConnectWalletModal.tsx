import { ApolloError } from '@apollo/client';
import { Keplr } from '@keplr-wallet/types';
import { Button, Dialog, DialogTypes, Icon, IconButton, Typography } from 'nightwatch-ui';
import { FC, useState } from 'react';
import { useToast } from 'skiff-front-utils';
import {
  WalletProviderInfo,
  WALLET_PROVIDERS,
  activateEthProvider,
  EthProvider,
  getSolanaProvider,
  isEthProvider,
  isSolProvider,
  isCosmosProvider,
  SolanaProvider,
  CosmosProvider,
  WalletProvider
} from 'skiff-front-utils';
import { useVerifyWalletAddressCreateAliasMutation } from 'skiff-mail-graphql';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import { updateEmailAliases } from '../../../utils/cache/cache';
import { resolveAndSetENSDisplayName } from '../../../utils/userUtils';
import { connectCosmosWallet, connectEthWallet, connectSolWallet } from '../../../utils/walletUtils/walletUtils';

const WalletButtons = styled.div`
  width: 100%;
  gap: 12px;
  display: flex;
  flex-direction: column;
`;

const BackButton = styled.div`
  position: absolute;
  cursor: pointer;
  left: 18px;
  top: 18px;
`;

interface ConnectWalletModalProps {
  onClose: () => void;
  onBack: (e: React.MouseEvent) => void;
  open: boolean;
  userID: string;
  closeParentModal: () => void;
  setUserPublicKey: () => void;
}

export const ConnectWalletModalDataTest = {
  addWalletBtn: 'add-wallet-btn',
  backBtn: 'back-btn',
  closeBtn: 'close-btn'
};

// TODO: consolidate with AddWalletAlias in editor
export const ConnectWalletModal: FC<ConnectWalletModalProps> = ({
  onClose,
  open,
  onBack,
  userID,
  closeParentModal,
  setUserPublicKey
}) => {
  // isAddingWallet is a dict keeps track of if the user is currently adding any of the wallet options
  const initialIsAddingWallet = {};
  Object.values(EthProvider).forEach((provider) => ({ ...initialIsAddingWallet, [provider]: false }));
  Object.values(SolanaProvider).forEach((provider) => ({ ...initialIsAddingWallet, [provider]: false }));

  const [isAddingWallet, setIsAddingWallet] = useState(initialIsAddingWallet);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyCreate] = useVerifyWalletAddressCreateAliasMutation();
  const { enqueueToast } = useToast();
  const user = useRequiredCurrentUserData();

  const handleAddWalletError = (error: ApolloError) => {
    console.error(error.message);
    setErrorMsg('Could not connect wallet.');
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
    }
    if (walletURL) window.open(walletURL, '_blank');
  };

  const addWallet = async (providerName: WalletProvider) => {
    const isEth = isEthProvider(providerName);
    const isSol = isSolProvider(providerName);
    const isCosmos = isCosmosProvider(providerName);
    if (!isEth && !isSol && !isCosmos) {
      console.error(`We currently do not support ${providerName}.`);
      return;
    }

    setErrorMsg('');
    try {
      setIsAddingWallet((prev) => ({ ...prev, [providerName]: true }));
      try {
        // Only set public key on the first wallet connection try
        if (!errorMsg) await setUserPublicKey();
      } catch (e: any) {
        // Log the error message and continue. Unless the error is caused by
        // the user already being in the mail db, the connect wallet calls below
        // will also fail, and the error will be caught in the surrounding try/catch
        console.error('Did not add mail user.', e.message);
      }

      // Selecting the provider prevents multiple wallet windows from popping up
      let provider: any = null;
      if (isEth) {
        provider = activateEthProvider(providerName as EthProvider);
      } else if (isSol) {
        provider = getSolanaProvider(providerName as SolanaProvider);
      } else if (isCosmos) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        provider = window.keplr;
      }

      // Redirect to external wallet download page is the wallet is not detected
      if (!provider) {
        redirectToWalletDownloadPage(providerName);
        setIsAddingWallet((prev) => ({ ...prev, [providerName]: false }));
        return;
      }

      let challenge, challengeSignature;
      if (isEth) {
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
            source: 'ONBOARDING'
          }
        },
        update: (cache, response) => {
          const emailAliases = response.data?.verifyWalletAddressCreateAlias?.emailAliases;
          if (!response.errors && emailAliases) {
            updateEmailAliases(cache, userID, emailAliases);
          }

          // User has only added one email alias, so it's the default
          const defaultEmail = emailAliases?.[0] || '';
          void resolveAndSetENSDisplayName(defaultEmail, user);
        }
      });

      closeParentModal();
      enqueueToast({
        body: `Connected ${WALLET_PROVIDERS[providerName].walletName} wallet.`,
        icon: Icon.Check
      });
    } catch (e: any) {
      handleAddWalletError(e as ApolloError);
    }
    setIsAddingWallet((prev) => ({ ...prev, [providerName]: false }));
  };

  const backButton = (
    <BackButton>
      <IconButton dataTest={ConnectWalletModalDataTest.backBtn} icon={Icon.Backward} onClick={onBack} />
    </BackButton>
  );

  const renderWalletButton = (provider: WalletProvider, providerInfo: WalletProviderInfo, onClick: () => void) => {
    const { walletName, icon } = providerInfo;
    return (
      <Button
        align='center'
        dataTest={`${ConnectWalletModalDataTest.addWalletBtn}-${walletName}`}
        disabled={isAddingWallet[provider]}
        fullWidth
        iconColor='source'
        key={`add-${walletName}`}
        onClick={onClick}
        startIcon={icon}
        type='secondary'
      >
        {isAddingWallet[provider] ? `Check ${walletName} Wallet` : walletName}
      </Button>
    );
  };

  return (
    <Dialog
      closeBtnDataTest={ConnectWalletModalDataTest.closeBtn}
      customContent
      description='Send and receive emails from your wallet address.'
      onClose={onClose}
      open={open}
      title='Connect wallet'
      type={DialogTypes.Promotional}
    >
      {errorMsg && <Typography color='destructive'>{errorMsg}</Typography>}
      <WalletButtons>
        {Object.entries(WALLET_PROVIDERS).map(([provider, providerInfo]) =>
          renderWalletButton(provider as WalletProvider, providerInfo, async () => {
            await addWallet(provider as WalletProvider);
          })
        )}
      </WalletButtons>
      {backButton}
    </Dialog>
  );
};
