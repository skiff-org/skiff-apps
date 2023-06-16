import { useGetInvoiceHistoryQuery } from '../../generated/graphql';

export function useInvoiceHistory() {
  const res = useGetInvoiceHistoryQuery();

  const { invoiceHistory } = res.data?.currentUser?.invoiceHistory || {};

  return {
    ...res,
    data: {
      invoiceHistory
    }
  };
}
