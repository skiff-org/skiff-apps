import { useRequiredCurrentUserData } from '../../../apollo';
import { useStorageUsage } from '../../../hooks';
import TitleActionSection from '../TitleActionSection';

import StorageBar from './StorageBar';

export default function StorageUsage() {
  const { userID } = useRequiredCurrentUserData();

  const { totalUsageBytes, maxTotalStorageMB, isLoading } = useStorageUsage(userID);

  if (isLoading) return null;

  const totalMeter = <StorageBar maxStorageMegabytes={maxTotalStorageMB} storageBytesUsed={totalUsageBytes} swap />;

  return (
    <>
      <TitleActionSection
        actions={[
          {
            content: totalMeter,
            type: 'custom'
          }
        ]}
        subtitle='Storage remaining across all Skiff products'
        title='Storage usage'
      />
    </>
  );
}
