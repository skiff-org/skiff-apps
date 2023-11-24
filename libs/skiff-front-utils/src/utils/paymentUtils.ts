import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  GetCheckoutSessionUrlOrStripeUpdateStatusDocument,
  GetCheckoutSessionUrlOrStripeUpdateStatusQuery,
  GetCheckoutSessionUrlOrStripeUpdateStatusQueryVariables
} from 'skiff-front-graphql';
import { CheckoutSession, RequestStatus, SubscriptionInterval, SubscriptionPlan } from 'skiff-graphql';

/**
 * Get stripe checkout session URL from backend, or if criteria are met,
 * update the subscription directly via Stripe API.
 * @param {SubscriptionPlan} subscriptionPlan - The desired subscription plan type.
 * @returns {CheckoutSession} CheckoutSession, including status and possibly url.
 */
export const getCheckoutSessionOrUpdatePlan = async (
  client: ApolloClient<NormalizedCacheObject>,
  subscriptionPlan: SubscriptionPlan,
  subscriptionInterval: SubscriptionInterval,
  redirectURL: string
): Promise<CheckoutSession> => {
  const response = await client.query<
    GetCheckoutSessionUrlOrStripeUpdateStatusQuery,
    GetCheckoutSessionUrlOrStripeUpdateStatusQueryVariables
  >({
    query: GetCheckoutSessionUrlOrStripeUpdateStatusDocument,
    variables: {
      request: {
        subscriptionPlan,
        interval: subscriptionInterval,
        redirectURL
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
