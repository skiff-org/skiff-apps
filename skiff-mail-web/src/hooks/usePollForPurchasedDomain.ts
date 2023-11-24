import { usePrevious } from 'skiff-front-utils';
import { CustomDomainRecord } from 'skiff-graphql';
import { PaymentQueryParam } from 'skiff-utils';

/**
 * Polls for a new Skiff Domain after a successful Stripe checkout.
 */

interface PollForPurchasedDomainParams {
  isPolling: boolean;
  customDomains: CustomDomainRecord[] | undefined;
  setIsPolling: (isPolling: boolean) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

// TODO: delete and use skiff-front-utils
export const usePollForPurchasedDomain = ({
  isPolling,
  customDomains,
  setIsPolling,
  startPolling,
  stopPolling
}: PollForPurchasedDomainParams) => {
  const url = new URL(window.location.href);
  // we attach the purchased domain as a query param to the url after a successful Stripe checkout
  const newlyRegisteredCustomDomainName = url.searchParams.get(PaymentQueryParam.DOMAIN_REGISTRATION_SUCCESS);
  const customDomainNames = customDomains?.map((customDomain) => customDomain.domain);
  const isWaitingForNewCustomDomain =
    !!newlyRegisteredCustomDomainName && !customDomainNames?.includes(newlyRegisteredCustomDomainName);
  const wasPreviouslyWaiting = usePrevious(isWaitingForNewCustomDomain);

  if (typeof window !== 'object') return;

  if (isWaitingForNewCustomDomain && !isPolling) {
    startPolling();
    setIsPolling(true);
  } else if (!isWaitingForNewCustomDomain && wasPreviouslyWaiting) {
    if (isPolling) {
      stopPolling();
      setIsPolling(false);
    }
    // remove the query string without altering the history stack after domain is returned from db
    if (newlyRegisteredCustomDomainName) {
      url.searchParams.delete(PaymentQueryParam.DOMAIN_REGISTRATION_SUCCESS);
      // window api is favored over Next router here because Next router
      // causes a full page re-render whenever changing routes/params even with shallow=true
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }
};
