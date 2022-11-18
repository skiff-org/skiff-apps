import { Icon } from 'nightwatch-ui';
import React, { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Setting, SettingType, SettingValue, SETTINGS_LABELS, SubscriptionPlans } from 'skiff-front-utils';
import { SubscriptionPlan } from 'skiff-graphql';
import { useGetCoinbaseCheckoutIdQuery } from 'skiff-mail-graphql';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import { useSubscriptionPlan } from '../../../utils/userUtils';

import TierButton, { getTierTitle } from './SubscriptionPlans/TierButton/TierButton';

export const usePlansSettings: () => Setting[] = () => {
  const { userID } = useRequiredCurrentUserData();
  const {
    data: { activeSubscription },
    loading: subscriptionLoading,
    startPolling,
    stopPolling
  } = useSubscriptionPlan(userID);

  const {
    loading: coinbaseCheckoutLoading,
    error: coinbaseCheckoutError,
    data: coinbaseCheckoutData
  } = useGetCoinbaseCheckoutIdQuery({
    variables: { request: { plan: SubscriptionPlan.Pro } }
  });

  const showCryptoBanner =
    activeSubscription === SubscriptionPlan.Free && !coinbaseCheckoutError && !coinbaseCheckoutLoading && !isMobile;

  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.SubscriptionPlans,
        component: (
          <SubscriptionPlans
            coinbaseCheckoutID={coinbaseCheckoutData?.getCoinbaseCheckoutID.coinbaseCheckoutID}
            currentUserID={userID}
            getTierTitle={getTierTitle}
            showCryptoBanner={showCryptoBanner}
            startPolling={startPolling}
            stopPolling={stopPolling}
            subscription={activeSubscription}
            tierButton={TierButton}
          />
        ),
        label: SETTINGS_LABELS[SettingValue.SubscriptionPlans],
        icon: Icon.Map,
        color: 'orange'
      }
    ],
    [activeSubscription, showCryptoBanner, coinbaseCheckoutData, userID, startPolling, stopPolling]
  );

  if (subscriptionLoading) return [];

  return settings;
};
