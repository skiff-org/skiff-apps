import { useGetUserPaidUpStatusQuery } from '../../generated/graphql';

// check whether user's current plan covers current paid features enjoyed by this account
export function usePaidUpStatus() {
  const res = useGetUserPaidUpStatusQuery();

  const { paidUp: paidUpStatus, downgradeProgress } = res.data?.currentUser?.paidUpStatus || {};

  // fallback to 'true' in cases where query fails to return status for whatever reason;
  // better to let a delinquent user slip through for some action than to stop a paid-up
  // user erroneously
  const paidUp = !res.loading && paidUpStatus !== undefined ? paidUpStatus : true;

  return {
    ...res,
    data: {
      paidUp,
      downgradeProgress
    }
  };
}
