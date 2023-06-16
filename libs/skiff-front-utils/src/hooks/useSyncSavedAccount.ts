import { useEffect } from 'react';
import { useUserProfile } from 'skiff-front-graphql';
import { getStorageKey, StorageTypes } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../apollo/localState';

/**
 * Hook for updating and saving account info for logged out users
 * @returns
 */
const useSyncSavedAccount = () => {
  const { username, userID } = useRequiredCurrentUserData();
  const { data: userProfileData } = useUserProfile(userID);
  // add the logged in users data to local storage
  // so users can log back in more easily
  useEffect(() => {
    localStorage.setItem(
      `${getStorageKey(StorageTypes.SAVED_ACCOUNT)}:${userID}`,
      JSON.stringify({
        username,
        publicData: {
          displayName: userProfileData?.publicData?.displayName,
          displayPictureData: userProfileData?.publicData?.displayPictureData
        }
      })
    );
  }, [userID, username, userProfileData]);
};

export default useSyncSavedAccount;
