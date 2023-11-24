import { useGetCreditsQuery, useGetUserMailStorageUsedQuery, useGetUserStorageUsedQuery } from 'skiff-front-graphql';
import { CreditInfo, EntityType } from 'skiff-graphql';

import useStorageLimit from './useStorageLimit';

export const useStorageUsage = (userID: string) => {
  const { data: pagesStorageData, loading: pagesStorageLoading } = useGetUserStorageUsedQuery({
    variables: {
      request: { userID }
    }
  });
  const { data: mailStorageData, loading: mailStorageLoading } = useGetUserMailStorageUsedQuery();

  const { data: currentCreditsData } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [CreditInfo.CurrentCredits]
      }
    }
  });

  const currentStorageCreditAmount = currentCreditsData?.credits?.credits.find(
    (credit) => credit.info === CreditInfo.CurrentCredits
  )?.amount ?? { editorStorageBytes: '0', skemailStorageBytes: '0' };
  const skemailCreditStorageBytes = Number.parseInt(currentStorageCreditAmount.skemailStorageBytes);
  const editorCreditStorageBytes = Number.parseInt(currentStorageCreditAmount.editorStorageBytes);
  const { storageLimitValueInMb, loading: storageLoading } = useStorageLimit();

  const maxTotalStorageMB: number =
    storageLimitValueInMb + editorCreditStorageBytes / 1_000_000 + skemailCreditStorageBytes / 1_000_000;

  const storageUsed = mailStorageData?.currentUser?.skemailStorageUsage ?? {
    attachmentUsageBytes: 0,
    messageUsageBytes: 0
  };

  const totalMailUsageBytes = Number(storageUsed.attachmentUsageBytes) + Number(storageUsed.messageUsageBytes);
  const totalPagesUsageBytes = Number(pagesStorageData?.user?.storageUsed || 0);
  const totalUsageBytes = totalMailUsageBytes + totalPagesUsageBytes;
  return { totalUsageBytes, maxTotalStorageMB, isLoading: pagesStorageLoading || mailStorageLoading || storageLoading };
};
