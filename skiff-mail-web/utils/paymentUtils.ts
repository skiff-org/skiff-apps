import { SubscriptionInterval, SubscriptionPlan, CheckoutSession, RequestStatus } from 'skiff-graphql';
import {
  GetCheckoutSessionUrlOrStripeUpdateStatusDocument,
  GetCheckoutSessionUrlOrStripeUpdateStatusQuery,
  GetCheckoutSessionUrlOrStripeUpdateStatusQueryVariables
} from 'skiff-mail-graphql';

import client from '../apollo/client';

/**
 * Get stripe checkout session URL from backend, or if criteria are met,
 * update the subscription directly via Stripe API.
 * @param {SubscriptionPlan} subscriptionPlan - The desired subscription plan type.
 * @returns {CheckoutSession} CheckoutSession, including status and possibly url.
 */
export const getCheckoutSessionOrUpdatePlan = async (
  subscriptionPlan: SubscriptionPlan,
  subscriptionInterval: SubscriptionInterval
): Promise<CheckoutSession> => {
  const response = await client.query<
    GetCheckoutSessionUrlOrStripeUpdateStatusQuery,
    GetCheckoutSessionUrlOrStripeUpdateStatusQueryVariables
  >({
    query: GetCheckoutSessionUrlOrStripeUpdateStatusDocument,
    variables: {
      request: {
        subscriptionPlan,
        interval: subscriptionInterval
      }
    },
    fetchPolicy: 'no-cache'
  });
  if (!response.data || response.data.checkoutPortal.status === RequestStatus.Failed) {
    console.error('getCheckoutSession: Request failed.');
    return { status: RequestStatus.Failed };
  }
  return response.data.checkoutPortal;
};
