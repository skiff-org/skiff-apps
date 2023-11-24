import { useCallback } from 'react';
import { isAndroid, isIOS, isMacOs, isMobile } from 'react-device-detect';
import { useClearSessionCacheMutation, useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import {
  CALENDAR_REDIRECT_KEY,
  getSessionCacheKeyForUserID,
  isMobileApp,
  sendRNWebviewMsg,
  setNextUUID,
  storeRedirectInLocalStorage,
  useRequiredCurrentUserData,
  DEFAULT_WORKSPACE_EVENT_VERSION
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';

import { useUnsetCalendarPushTokenMutation } from '../../../generated/graphql';
import { db } from '../../storage/db/db';

export const useCalendarLogout = () => {
  const [clearSessionCache] = useClearSessionCacheMutation();
  const [unsetToken] = useUnsetCalendarPushTokenMutation();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const userData = useRequiredCurrentUserData();

  const handleLogout = useCallback(async () => {
    // Handle many users session logic
    const curUserID = userData?.userID;
    const shouldReload = setNextUUID(curUserID);

    // Remove the cached session from local
    if (curUserID) localStorage.removeItem(getSessionCacheKeyForUserID(curUserID));

    try {
      await storeWorkspaceEvent({
        variables: {
          request: {
            eventName: WorkspaceEventType.Logout,
            version: DEFAULT_WORKSPACE_EVENT_VERSION,
            data: '',
            platformInfo: {
              isMobile: isMobile,
              isIos: isIOS,
              isAndroid: isAndroid,
              isMacOs: isMacOs,
              isReactNative: !!window.ReactNativeWebView,
              isSkiffWindowsDesktop: !!window.IsSkiffWindowsDesktop
            }
          }
        }
      });
    } catch (error) {
      // just continue
    }

    // Revoke current user session
    try {
      // unset pushToken
      // window.deviceID will only be defined on mobile apps
      // must be before clear session cache
      const deviceID = window.deviceID;
      if (isMobileApp() && !!deviceID && typeof deviceID === 'string') {
        await unsetToken({
          variables: {
            request: {
              deviceID
            }
          }
        });
      }
      await clearSessionCache();
    } catch (error) {
      console.error('Failed clear cache call', error);
    }

    // Delete local DB
    // When we will have many local calendars this may need to change
    if (db) await db.delete();

    // Handle mobile logout
    if (isMobileApp()) {
      sendRNWebviewMsg('userLoggedOut', {});
      storeRedirectInLocalStorage(CALENDAR_REDIRECT_KEY);
    }

    // Redirect client after logout
    if (shouldReload) {
      window.location.reload();
    } else {
      window.location.replace('/');
    }
  }, [clearSessionCache, userData?.userID, unsetToken]);

  return handleLogout;
};
