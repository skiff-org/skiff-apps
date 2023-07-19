import { ApolloError } from '@apollo/client';
import {
  CircularProgress,
  colors,
  Icon,
  Icons,
  Size,
  Skeleton,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { TabPage, TABS_QUERY_PARAM, useToast } from 'skiff-front-utils';
import { getPaywallErrorCode } from 'skiff-graphql';
import { GODADDY_PRICE_SCALE_FACTOR } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { usePaywall } from '../../../../hooks/usePaywall';
import { getCustomDomainCheckoutSession } from '../../../../utils/paymentUtils';

const SearchRowContainer = styled(motion.li)<{ available?: boolean }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  gap: 10px;
  list-style: none;
  margin: 0;

  box-sizing: border-box;
  height: 72px;

  // Hide hover behavior if domain not available
  ${(props) =>
    props.available
      ? css`
          &:hover {
            cursor: pointer;
            background: rgb(var(--orange-500));
            border-radius: 8px;
          }
        `
      : ''}
`;

const DomainInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
`;

const DomainPrice = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding: 0px;
  gap: 2px;
`;

const DomainRegistrationInterval = styled.div<{ $isHovering: boolean }>`
  ${(props) =>
    props.$isHovering
      ? css`
          color: rgba(${colors['--white']}, 0.68) !important;
        `
      : ''}
`;

const LoadingCustomDomainSearchRow: React.FC = () => {
  return (
    <SearchRowContainer>
      <Skeleton borderRadius={4} forceTheme={ThemeMode.DARK} height='24px' width='80px' />
      <DomainPrice>
        <Skeleton borderRadius={4} forceTheme={ThemeMode.DARK} height='16px' width='60px' />
        <Skeleton borderRadius={4} forceTheme={ThemeMode.DARK} height='12px' width='80px' />
      </DomainPrice>
    </SearchRowContainer>
  );
};

export interface CustomDomainSearchRowProps {
  domainResult: {
    available: boolean;
    domain: string;
    price?: number | null; // GraphQL
  };
}

const CustomDomainSearchRow: React.FC<CustomDomainSearchRowProps> = ({ domainResult }) => {
  const [showArrow, setShowArrow] = useState(false);
  const handleMouseOver = () => setShowArrow(true);
  const handleMouseOut = () => setShowArrow(false);
  const openPaywallModal = usePaywall();
  const [checkoutQueryLoading, setCheckoutQueryLoading] = useState(false);
  const { enqueueToast } = useToast();

  const onClickRow = async () => {
    try {
      setCheckoutQueryLoading(true);
      const { checkoutSession, errors } = await getCustomDomainCheckoutSession(
        domainResult.domain,
        // direct to custom domains tab on completion, regardless of whether that's where they started
        // (e.g. they may have come from a promo modal)
        `${window.location.origin}${window.location.pathname}?${new URLSearchParams({
          [TABS_QUERY_PARAM]: TabPage.CustomDomains
        }).toString()}`
      );
      if (errors?.length) {
        const paywallErrorCode = getPaywallErrorCode(errors);
        if (paywallErrorCode) {
          openPaywallModal(paywallErrorCode);
          return;
        }
        throw new Error(errors.join(' '));
      }

      if (!checkoutSession?.url) {
        throw new Error('Checkout session url not present');
      }

      window.location.href = checkoutSession.url;
    } catch (err: any) {
      setCheckoutQueryLoading(false);
      const paywallErrorCode = getPaywallErrorCode((err as ApolloError).graphQLErrors);
      if (paywallErrorCode) {
        openPaywallModal(paywallErrorCode);
      } else {
        console.error(err);
        enqueueToast({
          title: 'Failed to check out with this domain',
          body: 'Please refresh and try again'
        });
      }
    }
  };

  return (
    <SearchRowContainer
      animate={{ opacity: 1 }}
      available={domainResult.available}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      layout
      onClick={() => void onClickRow()}
      onMouseOut={handleMouseOut}
      onMouseOver={handleMouseOver}
      transition={{ duration: 0.2 }}
    >
      <Typography
        mono
        uppercase
        color={domainResult.available ? 'primary' : 'disabled'}
        forceTheme={ThemeMode.DARK}
        size={TypographySize.H3}
        weight={TypographyWeight.MEDIUM}
      >
        {domainResult.domain}
      </Typography>
      <DomainInfo>
        {domainResult.available && domainResult.price && (
          <DomainPrice>
            <Typography mono uppercase color='white' size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
              ${(domainResult.price * GODADDY_PRICE_SCALE_FACTOR).toFixed(2)}
            </Typography>
            <Typography mono uppercase color='disabled' forceTheme={ThemeMode.DARK}>
              <DomainRegistrationInterval $isHovering={showArrow}>FIRST YEAR</DomainRegistrationInterval>
            </Typography>
          </DomainPrice>
        )}
        {!domainResult.available && (
          <Typography mono uppercase color='destructive' forceTheme={ThemeMode.DARK} mono>
            DOMAIN TAKEN
          </Typography>
        )}
        {domainResult.available &&
          showArrow &&
          (checkoutQueryLoading ? (
            <CircularProgress progressColor='white' size={Size.SMALL} />
          ) : (
            <Icons color='white' icon={Icon.ArrowRight} />
          ))}
      </DomainInfo>
    </SearchRowContainer>
  );
};

export { CustomDomainSearchRow, LoadingCustomDomainSearchRow };
