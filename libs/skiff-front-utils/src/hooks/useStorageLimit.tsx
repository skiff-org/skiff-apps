import { useGetSubscriptionInfoQuery } from 'skiff-front-graphql';
import { TierName, getStorageLimitInMb } from 'skiff-utils';

export default function useStorageLimit() {
  const { data, loading } = useGetSubscriptionInfoQuery();
  const tierName = (data?.currentUser?.subscriptionInfo.subscriptionPlan as TierName) ?? TierName.Free;
  const storageLimitValueInMb = getStorageLimitInMb(tierName);
  return { storageLimitValueInMb, loading };
}
