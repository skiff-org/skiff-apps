import { motion } from 'framer-motion';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
  Button,
  Dialog,
  Icon,
  Icons,
  Size,
  Surface,
  ThemeMode,
  Type,
  Typography,
  TypographySize,
  TypographyWeight,
  themeNames
} from 'nightwatch-ui';
import { useState } from 'react';
import { useGetCoinbaseCheckoutIdLazyQuery, useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { SubscriptionPlan, WorkspaceEventType } from 'skiff-graphql';
import {
  TierName,
  bytesToHumanReadable,
  getMaxCustomDomains,
  getStorageLimitInMb,
  mbToBytes,
  FreeCustomDomainFeatureFlag
} from 'skiff-utils';
import styled from 'styled-components';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../../constants';
import { useMediaQuery } from '../../../hooks';
import Illustration, { Illustrations } from '../../../svgs/Illustration';

import CoinbaseIframe from './CoinbaseIframe';
import {
  BTC_ROTATION,
  CRYPTO_BANNER_ANIMATION_DELAY_INCREMENT,
  CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
  CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
  CRYPTO_SYMBOL_BREAKPOINT,
  CRYTPO_BANNER_ANIMATION_DURATION,
  ETH_ROTATION,
  USDC_ROTATION
} from './cryptobanner.constants';

/**
 * Displays instructions on paying for skiff via cryptocurrency.
 */

const MotionSurface = motion(Surface);

const BannerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: fit-content;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  user-select: none;
  margin: 4px 0;
`;

const LogoBox = styled.div`
  display: flex;
  margin-right: 16px;
`;

const BitcoinContainer = styled(motion.div)<{ displayCrypto: boolean }>`
  visibility: ${(props) => !props.displayCrypto && 'hidden'};
  transform: rotate(${BTC_ROTATION}deg);
  margin-top: 16px;
  box-sizing: border-box;
`;

const EthContainer = styled(motion.div)<{ displayCrypto: boolean }>`
  visibility: ${(props) => !props.displayCrypto && 'hidden'};
  transform: rotate(${ETH_ROTATION}deg);
  margin-bottom: 24px;
  box-sizing: border-box;
`;

const USDCContainer = styled(motion.div)<{ displayCrypto: boolean }>`
  visibility: ${(props) => !props.displayCrypto && 'hidden'};
  transform: rotate(${USDC_ROTATION}deg);
  margin-top: 32px;
  box-sizing: border-box;
`;

const OptionContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 16px;

  width: 100%;
  height: 75px;

  background: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  gap: 16px;

  &:hover {
    background: var(--bg-overlay-tertiary);
    cursor: pointer;
  }
`;

const PriceBox = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;
  aspect-ratio: 1;
  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  border-bottom-width: 2px;
`;

const OptionContainerText = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
  gap: 2px;
`;

const ButtonBox = styled.div`
  margin-top: 12px;
`;

const getCryptoSymbolVariants = (startRotation: number, delay: number) => ({
  anim: {
    y: [
      0,
      1 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      2 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      2 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      1 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      0,
      -1 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      -2 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      -2 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      -1 * CRYPTO_BANNER_ANIMATION_VERTICAL_INCREMENT,
      0
    ],
    rotate: [
      startRotation,
      startRotation + 1 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 2 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 3 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 4 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 5 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 4 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 3 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 2 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation + 1 * CRYPTO_BANNER_ANIMATION_ROTATION_INCREMENT,
      startRotation
    ],
    transition: {
      repeat: Infinity,
      duration: CRYTPO_BANNER_ANIMATION_DURATION,
      delay: delay
    }
  }
});

interface CryptoBannerProps {
  currentUserID: string;
  isUpdatingPlan: boolean;
  setIsUpdatingPlan: (isUpdating: boolean) => void;
  startPolling: (pollInterval: number) => void;
}

function CryptoBanner({ currentUserID, isUpdatingPlan, setIsUpdatingPlan, startPolling }: CryptoBannerProps) {
  const displayCryptoSymbols = useMediaQuery(`(min-width:${CRYPTO_SYMBOL_BREAKPOINT})`);
  const flags = useFlags();
  const freeCustomDomainFlag = flags.freeCustomDomain as FreeCustomDomainFeatureFlag;
  const [showModal, setShowModal] = useState(false);
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const [cryptoPlanOptionDialogOpen, setCryptoPlanOptionDialogOpen] = useState(false);
  const [curCoinbaseCheckoutId, setCurCoinbaseCheckoutId] = useState('');

  const [getCoinbaseCheckoutId] = useGetCoinbaseCheckoutIdLazyQuery();
  const getAndSetCheckoutId = async (subscriptionPlan: SubscriptionPlan) => {
    const res = await getCoinbaseCheckoutId({
      variables: {
        request: {
          plan: subscriptionPlan
        }
      }
    });
    const checkoutId = res.data?.getCoinbaseCheckoutID.coinbaseCheckoutID;
    if (checkoutId) {
      setCurCoinbaseCheckoutId(checkoutId);
      setShowModal(true);
    }
  };

  return (
    // use this background color for the crypto banner on both dark and light themes
    <>
      <MotionSurface
        size='full-width'
        style={{ background: themeNames.dark['--bg-l3-solid'], position: 'relative' }}
        whileHover='anim'
      >
        <BannerContainer>
          <TextContainer>
            <Typography forceTheme={ThemeMode.DARK} size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
              Interested in paying with crypto?
            </Typography>
            <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
              Skiff accepts BTC, ETH, USDC and many other cryptocurrencies.
            </Typography>
            <ButtonBox>
              <Button
                disabled={isUpdatingPlan}
                forceTheme={ThemeMode.DARK}
                onClick={() => {
                  if (isUpdatingPlan) {
                    return;
                  }
                  void storeWorkspaceEvent({
                    variables: {
                      request: {
                        eventName: WorkspaceEventType.CryptoCheckoutStarted,
                        data: '',
                        version: DEFAULT_WORKSPACE_EVENT_VERSION
                      }
                    }
                  });
                  setCryptoPlanOptionDialogOpen(true);
                }}
                size={Size.SMALL}
                type={Type.SECONDARY}
              >
                Upgrade with crypto
              </Button>
            </ButtonBox>
          </TextContainer>
          <LogoBox>
            <BitcoinContainer
              displayCrypto={displayCryptoSymbols}
              variants={getCryptoSymbolVariants(BTC_ROTATION, 0 * CRYPTO_BANNER_ANIMATION_DELAY_INCREMENT)}
            >
              <Illustration illustration={Illustrations.bitcoinSymbol} scale={1.1} />
            </BitcoinContainer>
            <EthContainer
              displayCrypto={displayCryptoSymbols}
              variants={getCryptoSymbolVariants(ETH_ROTATION, 1 * CRYPTO_BANNER_ANIMATION_DELAY_INCREMENT)}
            >
              <Illustration illustration={Illustrations.ethSymbol} scale={0.66} />
            </EthContainer>
            <USDCContainer
              displayCrypto={displayCryptoSymbols}
              variants={getCryptoSymbolVariants(USDC_ROTATION, 2 * CRYPTO_BANNER_ANIMATION_DELAY_INCREMENT)}
            >
              <Illustration illustration={Illustrations.USDCSymbol} scale={0.9} />
            </USDCContainer>
          </LogoBox>
        </BannerContainer>
      </MotionSurface>
      <Dialog
        customContent
        disableTextSelect
        hideCloseButton
        onClose={() => {
          setCryptoPlanOptionDialogOpen(false);
        }}
        open={cryptoPlanOptionDialogOpen}
        title='Select a plan'
      >
        <OptionContainer
          onClick={() => {
            void getAndSetCheckoutId(SubscriptionPlan.Essential);
          }}
        >
          <PriceBox>
            <Typography color='secondary' weight={TypographyWeight.MEDIUM}>
              $36
            </Typography>
          </PriceBox>
          <OptionContainerText>
            <Typography color='primary'>Essential (Yearly)</Typography>
            <Typography color='secondary' wrap>
              {`${getMaxCustomDomains(TierName.Essential, freeCustomDomainFlag)} custom domain, ${bytesToHumanReadable(
                mbToBytes(getStorageLimitInMb(TierName.Essential)),
                0
              )} storage, extra aliases`}
            </Typography>
          </OptionContainerText>
          <Icons color='disabled' icon={Icon.Forward} />
        </OptionContainer>
        <OptionContainer
          onClick={() => {
            void getAndSetCheckoutId(SubscriptionPlan.Pro);
          }}
        >
          <PriceBox>
            <Typography color='secondary' weight={TypographyWeight.MEDIUM}>
              $96
            </Typography>
          </PriceBox>
          <OptionContainerText>
            <Typography color='primary'>Pro (Yearly)</Typography>
            <Typography color='secondary' wrap>
              {`${getMaxCustomDomains(TierName.Pro, freeCustomDomainFlag)} custom domains, ${bytesToHumanReadable(
                mbToBytes(getStorageLimitInMb(TierName.Pro)),
                0
              )} storage, extra aliases`}
            </Typography>
          </OptionContainerText>
          <Icons color='disabled' icon={Icon.Forward} />
        </OptionContainer>
      </Dialog>
      {showModal && curCoinbaseCheckoutId && (
        <Dialog customContent onClose={() => setShowModal(false)} open={showModal}>
          <CoinbaseIframe
            checkoutID={curCoinbaseCheckoutId}
            onModalClosed={() => setShowModal(false)}
            setIsUpdatingPlan={setIsUpdatingPlan}
            startPolling={startPolling}
            userID={currentUserID}
          />
        </Dialog>
      )}
    </>
  );
}

export default CryptoBanner;
