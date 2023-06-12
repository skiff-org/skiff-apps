import { TierName } from 'skiff-utils';

import { SubscriptionPlan, SubscriptionInterval } from './types';

// Used to map all-caps Subscription Plan enum members to the db's Tier.name format,
// which is ultimately dictated by what we name our products on Stripe
export const TIER_NAME_BY_SUBSCRIPTION_PLAN: Record<SubscriptionPlan, TierName> = {
  [SubscriptionPlan.Free]: TierName.Free,
  [SubscriptionPlan.Essential]: TierName.Essential,
  [SubscriptionPlan.Pro]: TierName.Pro,
  [SubscriptionPlan.Business]: TierName.Business
};

const TIER_HIERARCHY: Record<TierName, number> = {
  [TierName.Free]: 0,
  [TierName.Essential]: 1,
  [TierName.Pro]: 2,
  [TierName.Business]: 3
};

const INTERVAL_HIERARCHY: Record<SubscriptionInterval, number> = {
  [SubscriptionInterval.Monthly]: 0,
  [SubscriptionInterval.Yearly]: 1
};

export enum PlanRelation {
  CURRENT = 'CURRENT',
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE'
}

export const isValidSubscriptionPlan = (planName: string): planName is SubscriptionPlan => {
  return Object.values<string>(SubscriptionPlan).includes(planName);
};

// Used to convert an all-caps Subscription Plan enum member to the db's corresponding Tier.name format,
// which is ultimately dictated by what we name our products on Stripe
export const getTierNameFromSubscriptionPlan = (subscriptionPlan: SubscriptionPlan) => {
  return TIER_NAME_BY_SUBSCRIPTION_PLAN[subscriptionPlan];
};

interface GetSubscriptionIntervalRelationParams {
  intendedSubscriptionInterval: SubscriptionInterval;
  activeSubscriptionInterval: SubscriptionInterval;
}
const getSubscriptionIntervalRelation = ({
  intendedSubscriptionInterval,
  activeSubscriptionInterval
}: GetSubscriptionIntervalRelationParams) => {
  const intendedIntervalRank = INTERVAL_HIERARCHY[intendedSubscriptionInterval];
  const activeIntervalRank = INTERVAL_HIERARCHY[activeSubscriptionInterval];
  if (intendedIntervalRank > activeIntervalRank) {
    return PlanRelation.UPGRADE;
  } else if (intendedIntervalRank < activeIntervalRank) {
    return PlanRelation.DOWNGRADE;
  } else {
    return PlanRelation.CURRENT;
  }
};

interface GetPlanRelationParams {
  intendedTier: TierName;
  activeTier: TierName;
  intendedSubscriptionInterval: SubscriptionInterval;
  activeSubscriptionInterval: SubscriptionInterval | null | undefined;
}
/**
 * Returns whether a reference plan is before, or after,
 * or is the same as the given plan in upgrade order.
 * @param {SubscriptionPlan} intendedPlan - The subscription plan type to which current plan is compared.
 * @param {SubscriptionPlan} activeSubscription - The user's current subscription plan.
 * @returns {PlanRelation}
 */
export const getPlanRelation = ({
  intendedTier,
  activeTier,
  intendedSubscriptionInterval,
  activeSubscriptionInterval
}: GetPlanRelationParams): PlanRelation => {
  if (activeTier !== TierName.Free && !activeSubscriptionInterval) {
    throw new Error('No billing interval found on a paid subscription. Cannot accurately compare plans.');
  }
  const intendedTierRank = TIER_HIERARCHY[intendedTier];
  const activeTierRank = TIER_HIERARCHY[activeTier];
  if (intendedTierRank > activeTierRank) {
    return PlanRelation.UPGRADE;
  } else if (intendedTierRank < activeTierRank) {
    return PlanRelation.DOWNGRADE;
  } else {
    return activeSubscriptionInterval // free tier doesn't have a subscription interval; paid tiers always should
      ? getSubscriptionIntervalRelation({ intendedSubscriptionInterval, activeSubscriptionInterval })
      : PlanRelation.CURRENT;
  }
};
