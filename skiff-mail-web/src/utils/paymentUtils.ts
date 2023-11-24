import { GraphQLError } from 'graphql';
import {
  GetCheckoutSessionUrlOrStripeUpdateStatusDocument,
  GetCheckoutSessionUrlOrStripeUpdateStatusQuery,
  GetCheckoutSessionUrlOrStripeUpdateStatusQueryVariables,
  GetCustomDomainCheckoutPortalDocument,
  GetCustomDomainCheckoutPortalQuery,
  GetCustomDomainCheckoutPortalQueryVariables
} from 'skiff-front-graphql';
import { SubscriptionInterval, SubscriptionPlan, CheckoutSession, RequestStatus } from 'skiff-graphql';

import client from '../apollo/client';

/**
 * Get stripe checkout session URL from backend, or if criteria are met,
 * update the subscription directly via Stripe API.
 * @param {SubscriptionPlan} subscriptionPlan - The desired subscription plan type.
 * @returns {CheckoutSession} CheckoutSession, including status and possibly url.
 */
export const getCheckoutSessionOrUpdatePlan = async (
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

/**
 * Get stripe checkout session URL for buying a one-click custom domain from backend.
 * @param {string} customDomain - the desired one-click domain to buy
 * @returns {CheckoutSession} CheckoutSession, including status and possibly url.
 */
export const getCustomDomainCheckoutSession = async (
  customDomain: string,
  redirectURL: string
): Promise<{ errors?: readonly GraphQLError[]; checkoutSession?: CheckoutSession }> => {
  const response = await client.query<GetCustomDomainCheckoutPortalQuery, GetCustomDomainCheckoutPortalQueryVariables>({
    query: GetCustomDomainCheckoutPortalDocument,
    variables: {
      request: {
        customDomain,
        redirectURL
      }
    },
    errorPolicy: 'all',
    fetchPolicy: 'no-cache'
  });
  if (response.errors?.length) {
    return { errors: response.errors };
  }
  if (!response.data || response.data.customDomainCheckoutPortal.status === RequestStatus.Failed) {
    console.error('getCustomDomainCheckoutSession: Request failed.');
    return { checkoutSession: { status: RequestStatus.Failed } };
  }
  return { checkoutSession: response.data.customDomainCheckoutPortal };
};
