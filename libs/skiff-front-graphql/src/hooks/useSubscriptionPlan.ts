import { SubscriptionPlan } from 'skiff-graphql';

import { useGetSubscriptionInfoQuery } from '../../generated/graphql';

export function useSubscriptionPlan() {
  const res = useGetSubscriptionInfoQuery();

  const {
    subscriptionPlan: tierName,
    isCryptoSubscription,
    cancelAtPeriodEnd,
    supposedEndDate,
    stripeStatus,
    billingInterval,
    quantity
  } = res.data?.currentUser?.subscriptionInfo || {};

  const activeSubscription = tierName
    ? SubscriptionPlan[tierName as keyof typeof SubscriptionPlan]
    : SubscriptionPlan.Free;

  return {
    ...res,
    data: {
      activeSubscription,
      isCryptoSubscription,
      cancelAtPeriodEnd,
      supposedEndDate,
      stripeStatus,
      billingInterval,
      quantity
    }
  };
}
