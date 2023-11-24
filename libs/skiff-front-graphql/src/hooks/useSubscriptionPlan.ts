import { QueryHookOptions } from '@apollo/client';
import { Exact, SubscriptionPlan } from 'skiff-graphql';
import { TierName } from 'skiff-utils';

import { GetSubscriptionInfoQuery, useGetSubscriptionInfoQuery } from '../../generated/graphql';

export function useSubscriptionPlan(
  baseOptions?: QueryHookOptions<GetSubscriptionInfoQuery, Exact<{ [key: string]: never }>> | undefined
) {
  const res = useGetSubscriptionInfoQuery(baseOptions);

  const {
    subscriptionPlan,
    isCryptoSubscription,
    isAppleSubscription,
    isGoogleSubscription,
    cancelAtPeriodEnd,
    supposedEndDate,
    stripeStatus,
    billingInterval,
    quantity
  } = res.data?.currentUser?.subscriptionInfo || {};

  const tierName = (subscriptionPlan as TierName) ?? TierName.Free;
  const activeSubscription = SubscriptionPlan[tierName as keyof typeof SubscriptionPlan];

  return {
    ...res,
    data: {
      tierName,
      activeSubscription,
      isCryptoSubscription,
      isAppleSubscription,
      isGoogleSubscription,
      cancelAtPeriodEnd,
      supposedEndDate,
      stripeStatus,
      billingInterval,
      quantity
    }
  };
}
