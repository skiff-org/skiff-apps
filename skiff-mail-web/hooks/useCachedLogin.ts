import client from '../apollo/client';
import { saveCurrentUserData } from '../apollo/currentUser';
import { GetSessionCacheDocument, GetSessionCacheQuery, GetSessionCacheQueryVariables } from '../generated/graphql';
import { decryptSessionCacheData } from '../utils/crypto/v1/user';
import { getStorageKey, SkemailStorageTypes } from '../utils/storageUtils';

export const getSessionCacheKey = async () => {
  const sessionCacheResponse = await client.query<GetSessionCacheQuery, GetSessionCacheQueryVariables>({
    query: GetSessionCacheDocument
  });

  const { cacheKey } = sessionCacheResponse?.data?.sessionCache || {};
  return cacheKey;
};

/**
 * Attempt to use session cache from local storage to login client.
 */
export const tryCachedLogin = async (): Promise<boolean> => {
  const encryptedSessionCacheData = localStorage.getItem(getStorageKey(SkemailStorageTypes.SESSION_CACHE));
  let loginSucceeded = false;
  if (encryptedSessionCacheData) {
    try {
      // request cache key from server (request is authenticated
      // with httpOnly jwt cookie)
      const cacheKeys = await getSessionCacheKey();
      if (!cacheKeys) throw new Error('Failed to restore login: no cache key');

      const cacheKeyArr = JSON.parse(cacheKeys);
      let sessionCacheData;
      for (const cacheKey of cacheKeyArr) {
        try {
          sessionCacheData = decryptSessionCacheData(encryptedSessionCacheData, cacheKey);
        } catch (error) {
          console.log('Failed cache', cacheKey);
        }
      }
      // decrypt sessionCache with the retrieved cacheKey
      if (!sessionCacheData) throw new Error('Failed to restore login: invalid encrypted session');

      // restore user
      saveCurrentUserData(sessionCacheData.user);
      loginSucceeded = true;
    } catch ({ message }) {
      // log failure reason
      console.error(message);

      // if cached login fails, cached session is deemed
      // invalid, clear from localStorage and continue
      // normal login
      localStorage.removeItem(getStorageKey(SkemailStorageTypes.SESSION_CACHE));
    }
  }
  return loginSucceeded;
};
