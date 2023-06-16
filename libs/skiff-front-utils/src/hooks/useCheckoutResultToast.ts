import { useEffect } from 'react';
import { PaymentQueryParam, PaymentQueryParamValue } from 'skiff-utils';

import useToast from './useToast';

// we increase default duration given the context shift after a redirect from Stripe
const CHECKOUT_RESULT_TOAST_DURATION = 8000;

const useCheckoutResultToast = () => {
  const { enqueueToast } = useToast();
  useEffect(() => {
    if (typeof window !== 'object') return;
    const url = new URL(window.location.href);
    const paymentQueryValue = url.searchParams.get(PaymentQueryParam.PAYMENT_SUCCESS);
    if (!paymentQueryValue) return;
    const onClose = () => {
      // remove the query string without altering the history stack
      url.searchParams.delete(PaymentQueryParam.PAYMENT_SUCCESS);
      window.history.replaceState(window.history.state, '', url.toString());
    };
    if (paymentQueryValue === PaymentQueryParamValue.Succeeded) {
      enqueueToast({
        title: 'Payment complete',
        body: 'Your purchase was successful!',
        duration: CHECKOUT_RESULT_TOAST_DURATION,
        onClose
      });
    } else if (paymentQueryValue === PaymentQueryParamValue.Cancelled) {
      enqueueToast({
        title: 'Payment cancelled',
        body: 'Your purchase was cancelled.',
        duration: CHECKOUT_RESULT_TOAST_DURATION,
        onClose
      });
    }
  }, [enqueueToast]);
};

export default useCheckoutResultToast;
