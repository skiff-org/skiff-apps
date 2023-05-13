import { useCallback } from 'react';
import { useClearSessionCacheMutation } from 'skiff-front-graphql';
import {
  isMobileApp,
  sendRNWebviewMsg,
  getSessionCacheKeyForUserID,
  removeCurrentUserData,
  useCurrentUserData,
  DEFAULT_WORKSPACE_EVENT_VERSION
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';

import client from '../apollo/client';
import { storeWorkspaceEvent } from '../utils/userUtils';

/**
 * hook that returns the skemail logout function
 */
export const useMailLogout = () => {
  const [clearSessionCache] = useClearSessionCacheMutation();
  const userData = useCurrentUserData();

  const skemailLogout = useCallback(async () => {
    try {
      await storeWorkspaceEvent(WorkspaceEventType.Logout, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    } catch (error) {
      // proceed
    }

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
