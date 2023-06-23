import { Icon } from '@skiff-org/skiff-ui';
import { useMemo } from 'react';
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

import { useSubscriptionPlan } from '../../../utils/userUtils';
import { useSettings } from '../useSettings';

export const usePlansSettings: () => Setting[] = () => {
  const { userID } = useRequiredCurrentUserData();
  const { openSettings } = useSettings();
  const openBillingPage = () => openSettings({ tab: TabPage.Billing, setting: SettingValue.CurrentSubscriptions });
  const {
    data: { activeSubscription, billingInterval },
    loading: subscriptionLoading,
    startPolling,
    stopPolling
  } = useSubscriptionPlan();

  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.SubscriptionPlans,
        component: (
          <SubscriptionPlans
            activeSubscriptionBillingInterval={billingInterval}
            currentUserID={userID}
            startPolling={startPolling}
            stopPolling={stopPolling}
            subscription={activeSubscription}
            openBillingPage={openBillingPage}
          />
        ),
        label: SETTINGS_LABELS[SettingValue.SubscriptionPlans],
        icon: Icon.Map,
        color: 'yellow'
      }
    ],
    [activeSubscription, userID, startPolling, stopPolling, billingInterval]
  );

  if (subscriptionLoading || isMobileApp()) return [];

  return settings;
};
