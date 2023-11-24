import { Dialog, Icon, IconText, Icons, MonoTag, Typography } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import { SubscriptionInterval, getSubscriptionPlanFromTierName } from 'skiff-graphql';
import {
  FreeCustomDomainFeatureFlag,
  TierName,
  filterExists,
  filterTruthy,
  getMaxCustomDomains,
  getMaxInactiveAliases,
  getStorageLimitInMb,
  mbToGb
} from 'skiff-utils';
import styled from 'styled-components';

import { MONO_TYPE_TAG_STYLES_BY_PLAN } from '../../../constants';
import { useGetFF, useToast } from '../../../hooks';
import { getTierPrice } from '../../../utils';
import { getCheckoutSessionOrUpdatePlan } from '../../../utils/paymentUtils';

import { UpgradeModalProps } from './UpgradeModal.types';

const PlanOption = styled.div`
  border-radius: 8px;
  background: var(--bg-l1-solid);
  display: flex;
  padding: 16px;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
  cursor: pointer;
`;

const PlanContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1 0 0;
`;

const PlanHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Tags = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ExceededItemCountContainer = styled.div`
  display: flex;
  align-self: stretch;
  padding: 8px;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
  border-radius: 8px;
  border: 1px solid var(--border-secondary);
`;

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  client,
  description,
  open,
  onClose,
  exceededItems,
  title
}: UpgradeModalProps) => {
  const freeCustomDomainFlag = useGetFF<FreeCustomDomainFeatureFlag>('freeCustomDomain');
  const { enqueueToast } = useToast();
  const [hover, setHover] = useState<TierName>();

  const checkoutOnStripe = async (tierName: TierName) => {
    const subscriptionPlan = getSubscriptionPlanFromTierName(tierName);
    // default to monthly, since they can upgrade in cart
    const checkoutPortal = await getCheckoutSessionOrUpdatePlan(
      client,
      subscriptionPlan,
      SubscriptionInterval.Monthly,
      window.location.href
    );
    if (checkoutPortal.url) {
      window.location.href = checkoutPortal.url;
    } else {
      enqueueToast({
        title: 'Failed to upgrade your plan',
        body: 'Please try again later.'
      });
    }
  };

  const renderPlanOption = (tierName: TierName) => {
    const storageAmountInMb = getStorageLimitInMb(tierName);
    const numAliases = getMaxInactiveAliases(tierName);
    const numCustomDomains = getMaxCustomDomains(tierName, freeCustomDomainFlag);
    const isEssentialTier = tierName === TierName.Essential;
    const subscriptionPlan = getSubscriptionPlanFromTierName(tierName);
    const tagStyles = MONO_TYPE_TAG_STYLES_BY_PLAN[subscriptionPlan];
    const tierPrice = getTierPrice(subscriptionPlan, SubscriptionInterval.Yearly);

    return (
      <PlanOption
        onClick={() => void checkoutOnStripe(tierName)}
        onMouseLeave={() => setHover(undefined)}
        onMouseOver={() => setHover(tierName)}
      >
        <PlanContent>
          <PlanHeader>
            <Tags>
              <MonoTag {...tagStyles} label={tierName} />
              <MonoTag color='secondary' label={`$${tierPrice} per month`} />
            </Tags>
            <Icons color={hover === tierName ? 'primary' : 'secondary'} icon={Icon.ChevronRight} />
          </PlanHeader>
          <Typography color='secondary' wrap>
            Get unlimited labels and folders, {mbToGb(storageAmountInMb)} GB of storage, <br />
            {isEssentialTier ? `${numAliases} mail aliases` : `${numCustomDomains} custom domains`}, and more with Skiff{' '}
            {tierName}
          </Typography>
        </PlanContent>
      </PlanOption>
    );
  };

  const renderExceededItemCount = () => {
    if (!exceededItems) return '';

    const getJoinText = (index: number, totalNumElements: number) => {
      if (index === 0) return '';
      if (index !== totalNumElements - 1) return ',';
      return ' and';
    };

    const types = Object.keys(exceededItems);
    // Get the list of types, ie 'labels and folders'
    const typesText = types.reduce((acc, currType, index) => {
      return `${acc}${getJoinText(index, types.length)} ${currType.toLowerCase()}s`;
    }, '');

    const maxAllowedValues = Object.values(exceededItems)
      .map((item) => item?.maxAllowed)
      .filter(filterExists);
    const getMaxAllowedText = () => {
      const numMaxAllowedValues = maxAllowedValues.length;
      // If there is only one exceeded item with a max value
      if (numMaxAllowedValues === 1 && maxAllowedValues[0]) {
        return `, max ${maxAllowedValues[0]} allowed`;
      }
      // If all the max values are the same
      if (maxAllowedValues[0] && maxAllowedValues.every((val) => val === maxAllowedValues[0])) {
        return `, max ${maxAllowedValues[0]} of each allowed`;
      }
      // If each exceeded item has a different max value
      // ie '5 labels and 3 folders'
      if (maxAllowedValues.filter(filterTruthy).length) {
        const maxValueText = maxAllowedValues.reduce((acc, currMaxVal, index) => {
          const currType = types[index];
          if (!currType) return acc;
          return `${acc}${getJoinText(index, maxAllowedValues.length)} ${pluralize(
            currType.toLowerCase(),
            currMaxVal,
            true
          )}`;
        }, '');
        return `, max ${maxValueText} allowed`;
      }
      return '';
    };

    return (
      <ExceededItemCountContainer>
        <IconText
          color='destructive'
          label={`Too many ${typesText}${getMaxAllowedText()}`}
          startIcon={Icon.Warning}
          wrap
        />
      </ExceededItemCountContainer>
    );
  };

  return (
    <Dialog
      customContent
      description={description}
      onClose={onClose}
      open={open}
      title={title ?? 'Get more with Skiff Essential or Pro'}
    >
      {exceededItems && !!Object.keys(exceededItems).length && renderExceededItemCount()}
      {renderPlanOption(TierName.Essential)}
      {renderPlanOption(TierName.Pro)}
    </Dialog>
  );
};

export default UpgradeModal;
