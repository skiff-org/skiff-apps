import { Icon } from 'nightwatch-ui';
import React, { useMemo } from 'react';
import { useSubscriptionPlan } from 'skiff-front-graphql';
import {
  SETTINGS_LABELS,
  Setting,
  SettingType,
  SettingValue,
  SubscriptionPlans,
  TabPage,
  isMobileApp,
  useRequiredCurrentUserData
} from 'skiff-front-utils';

import { useOpenSettings } from './useOpenCloseSettings';

export const usePlansSettings: () => Setting[] = () => {
  const { userID } = useRequiredCurrentUserData();
  const {
    data: { activeSubscription, billingInterval },
    loading: subscriptionLoading,
    startPolling,
    stopPolling
  } = useSubscriptionPlan();
  const openSettings = useOpenSettings();
  const openBillingPage = () =>
    openSettings({
      indices: { tab: TabPage.Billing }
    });

  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.SubscriptionPlans,
        component: (
          <SubscriptionPlans
            activeSubscriptionBillingInterval={billingInterval}
            currentUserID={userID}
            openBillingPage={openBillingPage}
            startPolling={startPolling}
            stopPolling={stopPolling}
            subscription={activeSubscription}
          />
        ),
        label: SETTINGS_LABELS[SettingValue.SubscriptionPlans],
        icon: Icon.Map,
        color: 'orange'
      }
    ],
    [activeSubscription, userID, startPolling, stopPolling, billingInterval]
  );

  if (subscriptionLoading || isMobileApp()) return [];

  return settings;
};
