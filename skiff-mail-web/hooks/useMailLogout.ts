import { useCallback } from 'react';
import { isMobileApp, sendRNWebviewMsg, getSessionCacheKeyForUserID } from 'skiff-front-utils';
import { useClearSessionCacheMutation } from 'skiff-mail-graphql';

import client from '../apollo/client';
import { removeCurrentUserData, useCurrentUserData } from '../apollo/currentUser';

/**
 * hook that returns the skemail logout function
 */
export const useMailLogout = () => {
  const [clearSessionCache] = useClearSessionCacheMutation();
  const userData = useCurrentUserData();

  const skemailLogout = useCallback(async () => {
    const clearCacheAsync = async () => {
      try {
        await clearSessionCache();
      } catch (err) {
        console.error('Failed to clear cache');
        console.error(err);
      }
    };

    await clearCacheAsync();

    const curUserID = userData?.userID;
    // delete session cache for current user
    if (curUserID) {
      localStorage.removeItem(getSessionCacheKeyForUserID(curUserID));
    }

    // Flush cookies on mobile app
    if (isMobileApp()) {
      sendRNWebviewMsg('userLoggedOut', {});
    }

    /* Need to first redirect and then clear userData to prevent from components
  who use it to throw error when they re-render */
    window.location.replace('/');

    const clearStoreAsync = async () => {
      await client.clearStore();
    };

    void clearStoreAsync();
    removeCurrentUserData();
  }, [clearSessionCache]);

  return skemailLogout;
};
