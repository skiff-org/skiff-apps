"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanRelation = exports.getTierNameFromSubscriptionPlan = exports.isValidSubscriptionPlan = exports.PlanRelation = exports.TIER_NAME_BY_SUBSCRIPTION_PLAN = void 0;
const skiff_utils_1 = require("skiff-utils");
const types_1 = require("./types");
// Used to map all-caps Subscription Plan enum members to the db's Tier.name format,
// which is ultimately dictated by what we name our products on Stripe
exports.TIER_NAME_BY_SUBSCRIPTION_PLAN = {
    [types_1.SubscriptionPlan.Free]: skiff_utils_1.TierName.Free,
    [types_1.SubscriptionPlan.Essential]: skiff_utils_1.TierName.Essential,
    [types_1.SubscriptionPlan.Pro]: skiff_utils_1.TierName.Pro,
    [types_1.SubscriptionPlan.Business]: skiff_utils_1.TierName.Business
};
const TIER_HIERARCHY = {
    [skiff_utils_1.TierName.Free]: 0,
    [skiff_utils_1.TierName.Essential]: 1,
    [skiff_utils_1.TierName.Pro]: 2,
    [skiff_utils_1.TierName.Business]: 3
};
const INTERVAL_HIERARCHY = {
    [types_1.SubscriptionInterval.Monthly]: 0,
    [types_1.SubscriptionInterval.Yearly]: 1
};
var PlanRelation;
(function (PlanRelation) {
    PlanRelation["CURRENT"] = "CURRENT";
    PlanRelation["UPGRADE"] = "UPGRADE";
    PlanRelation["DOWNGRADE"] = "DOWNGRADE";
})(PlanRelation || (exports.PlanRelation = PlanRelation = {}));
const isValidSubscriptionPlan = (planName) => {
    return Object.values(types_1.SubscriptionPlan).includes(planName);
};
exports.isValidSubscriptionPlan = isValidSubscriptionPlan;
// Used to convert an all-caps Subscription Plan enum member to the db's corresponding Tier.name format,
// which is ultimately dictated by what we name our products on Stripe
const getTierNameFromSubscriptionPlan = (subscriptionPlan) => {
    return exports.TIER_NAME_BY_SUBSCRIPTION_PLAN[subscriptionPlan];
};
exports.getTierNameFromSubscriptionPlan = getTierNameFromSubscriptionPlan;
const getSubscriptionIntervalRelation = ({ intendedSubscriptionInterval, activeSubscriptionInterval }) => {
    const intendedIntervalRank = INTERVAL_HIERARCHY[intendedSubscriptionInterval];
    const activeIntervalRank = INTERVAL_HIERARCHY[activeSubscriptionInterval];
    if (intendedIntervalRank > activeIntervalRank) {
        return PlanRelation.UPGRADE;
    }
    else if (intendedIntervalRank < activeIntervalRank) {
        return PlanRelation.DOWNGRADE;
    }
    else {
        return PlanRelation.CURRENT;
    }
};
/**
 * Returns whether a reference plan is before, or after,
 * or is the same as the given plan in upgrade order.
 * @param {SubscriptionPlan} intendedPlan - The subscription plan type to which current plan is compared.
 * @param {SubscriptionPlan} activeSubscription - The user's current subscription plan.
 * @returns {PlanRelation}
 */
const getPlanRelation = ({ intendedTier, activeTier, intendedSubscriptionInterval, activeSubscriptionInterval }) => {
    if (activeTier !== skiff_utils_1.TierName.Free && !activeSubscriptionInterval) {
        throw new Error('No billing interval found on a paid subscription. Cannot accurately compare plans.');
    }
    const intendedTierRank = TIER_HIERARCHY[intendedTier];
    const activeTierRank = TIER_HIERARCHY[activeTier];
    if (intendedTierRank > activeTierRank) {
        return PlanRelation.UPGRADE;
    }
    else if (intendedTierRank < activeTierRank) {
        return PlanRelation.DOWNGRADE;
    }
    else {
        return activeSubscriptionInterval // free tier doesn't have a subscription interval; paid tiers always should
            ? getSubscriptionIntervalRelation({ intendedSubscriptionInterval, activeSubscriptionInterval })
            : PlanRelation.CURRENT;
    }
};
exports.getPlanRelation = getPlanRelation;
//# sourceMappingURL=planUtils.js.map