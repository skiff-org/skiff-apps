import React, { Suspense, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { SubscriptionInterval, SubscriptionPlan } from 'skiff-graphql';

import usePrevious from '../../../hooks/usePrevious';

import styled from 'styled-components';
import FeatureTable from './FeatureTable/FeatureTable';

const CryptoBanner = React.lazy(() => import('../CryptoBanner/CryptoBanner'));

const Spacer = styled.div`
  height: 0px;
`;

interface SubscriptionPlansProps {
  subscription: SubscriptionPlan;
  currentUserID: string;
  activeSubscriptionBillingInterval: SubscriptionInterval | null | undefined;
  startPolling: (pollInterval: number) => void;
  stopPolling: () => void;
  openBillingPage: () => void;
}

/**
 * Displays a list of features for each payment tier and
 * buttons to upgrade/downgrade
 */
function SubscriptionPlans({
  subscription,
  currentUserID,
  activeSubscriptionBillingInterval,
  startPolling,
  stopPolling,
  openBillingPage
}: SubscriptionPlansProps) {
  // we disable all buttons after a successful plan change until our db has sync'd with payment provider
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const previousActiveSubscription = usePrevious(subscription);

  const showCryptoBanner = subscription === SubscriptionPlan.Free && !isMobile;

  useEffect(() => {
    if (isUpdatingPlan && subscription !== previousActiveSubscription) {
      stopPolling();
      setIsUpdatingPlan(false);
    }
  }, [isUpdatingPlan, subscription, previousActiveSubscription, stopPolling]);

  return (
    <>
      {showCryptoBanner && (
        <Suspense fallback={null}>
          <CryptoBanner
            currentUserID={currentUserID}
            isUpdatingPlan={isUpdatingPlan}
            setIsUpdatingPlan={setIsUpdatingPlan}
            startPolling={startPolling}
          />
        </Suspense>
      )}
      {showCryptoBanner && <Spacer />}
      <FeatureTable
        activeSubscriptionBillingInterval={activeSubscriptionBillingInterval}
        isUpdatingPlan={isUpdatingPlan}
        setIsUpdatingPlan={setIsUpdatingPlan}
        startPolling={startPolling}
        subscription={subscription}
        openBillingPage={openBillingPage}
      />
    </>
  );
}

export default SubscriptionPlans;
