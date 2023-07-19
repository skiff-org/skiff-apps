import { Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import { SubscriptionPlan } from 'skiff-graphql';
import styled from 'styled-components';

import { FEATURE_TABLE_RESPONSIVE_BREAKPOINT } from '../../../../constants';
import { useMediaQuery } from '../../../../hooks';
import { getTierButtonSecondaryText } from '../../../../utils/planUtils';

type PriceBlockProps = {
  price: number; // price of plan
  subscriptionPlan: SubscriptionPlan;
  spotlightPlan: SubscriptionPlan;
};

// use fixed height ensure alignment across tiers in wide view
const Container = styled.div<{ fixedHeight?: boolean }>`
  height: ${(props) => (props.fixedHeight ? '56px' : 'auto')};
`;

const PriceLabelContainer = styled.div`
  padding-top: 8px;
`;

/**
 * Component that displays the price of a tier.
 */
function PriceBlock(props: PriceBlockProps) {
  const { price, subscriptionPlan, spotlightPlan } = props;
  const isFreeTier = subscriptionPlan === SubscriptionPlan.Free;
  const secondaryText = getTierButtonSecondaryText({ subscriptionPlan, spotlightPlan });
  const layoutBreakpoint = useMediaQuery(`(min-width:${FEATURE_TABLE_RESPONSIVE_BREAKPOINT}px)`);

  return (
    <Container fixedHeight={layoutBreakpoint}>
      <PriceLabelContainer>
        <Typography mono uppercase size={TypographySize.H3} weight={TypographyWeight.BOLD}>{`$${price}${
          !isFreeTier ? '/mo' : ''
        }`}</Typography>
      </PriceLabelContainer>
      {secondaryText && (
        <Typography mono uppercase color={secondaryText.color} size={TypographySize.SMALL}>
          {secondaryText.text}
        </Typography>
      )}
    </Container>
  );
}

export default PriceBlock;
