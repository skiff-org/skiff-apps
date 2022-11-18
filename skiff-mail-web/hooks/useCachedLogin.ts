import { ApolloError } from '@apollo/client';
import {
  getStorageKey,
  getSessionCacheForLatestUser,
  clearLatestUserIDCache,
  getSessionCacheKeyForUserID,
  StorageTypes,
  setNextUUID
} from 'skiff-front-utils';
import { BadRequest, isApolloLogicErrorType, NotAuthorized, NotFound } from 'skiff-graphql';
import {
  GetSessionCacheDocument,
  GetSessionCacheQuery,
  GetSessionCacheQueryVariables,
  GetUserEmailAndWalletDocument,
  GetUserEmailAndWalletQuery,
  GetUserEmailAndWalletQueryVariables
} from 'skiff-mail-graphql';
import { decryptSessionCacheData, writeSessionCacheData } from 'skiff-mail-graphql';
import { models } from 'skiff-mail-graphql';

import client from '../apollo/client';
import { requireCurrentUserData, saveCurrentUserData } from '../apollo/currentUser';

const setNextIDAndReload = () => {
  // if login broke for this user, try moving to another user
  // clear old format
  clearLatestUserIDCache();
  // now, if a new user was set, reload the page and try to login again
  const shouldReload = setNextUUID();
  if (shouldReload) {
    window.location.reload();
  }
};

const refreshUserEmailAndWallet = async () => {
  const userID = requireCurrentUserData().userID;
  const walletAndEmail = await client.query<GetUserEmailAndWalletQuery, GetUserEmailAndWalletQueryVariables>({
    query: GetUserEmailAndWalletDocument,
    variables: {
      request: {
        userID
      }
    }
  });

  if (walletAndEmail.data.user) {
    const { walletAddress, email, rootOrgID } = walletAndEmail.data.user;
    const user = { ...requireCurrentUserData() };
    if (walletAddress) {
      user.walletAddress = walletAddress;
    }
    if (email) {
      user.email = email;
    }
    if (rootOrgID) {
      user.rootOrgID = rootOrgID;
    }
    saveCurrentUserData(user);
  }
};

/**
 * Attempt to use session cache from local storage to refresh JWT. Returns login success status.
 * @returns {boolean} True on login success, false otherwise.
 */
export const tryCachedLogin = async (): Promise<boolean> => {
  // skip inside frame
  if (window.location !== window.parent.location) {
    return false;
  }
  const encryptedSessionCacheData = getSessionCacheForLatestUser();
  if (!encryptedSessionCacheData) {
    return false;
  }

  let cacheKey: string;
  let alternativeCacheKeys: string[];

  try {
    // request cache key from server (request is authenticated with httpOnly session cookie)
    const res = await client.query<GetSessionCacheQuery, GetSessionCacheQueryVariables>({
      query: GetSessionCacheDocument
    });
    cacheKey = res.data.sessionCache.cacheKey;
    alternativeCacheKeys = res.data.sessionCache.alternativeCacheKeys;
  } catch (e) {
    if (
      e instanceof ApolloError &&
      (isApolloLogicErrorType(e.graphQLErrors[0], NotFound) ||
        isApolloLogicErrorType(e.graphQLErrors[0], BadRequest) ||
        isApolloLogicErrorType(e.graphQLErrors[0], NotAuthorized))
    ) {
      // session cache is invalid, cleaning it
      console.log('Server-side session cache is invalid, cleaning local state');
      setNextIDAndReload();
    } else {
      // if it's another error, the problem is most likely a temporary error (like no internet), we shouldn't do anything and try again next time
      console.error('Unexpected error while getting session cache:', e);
    }

    return false;
  }

  let decryptedUser: models.User | null = null;

  try {
    // first try using cache key from the cookie session ID
    const sessionCacheData = decryptSessionCacheData(encryptedSessionCacheData, cacheKey);
    decryptedUser = sessionCacheData.user;

    if (localStorage.getItem(getSessionCacheKeyForUserID(sessionCacheData.user.userID)) === null) {
      // write the cache data again to migrate format
      writeSessionCacheData(sessionCacheData, cacheKey);
      localStorage.removeItem(getStorageKey(StorageTypes.SESSION_CACHE));
    }
  } catch {}

  if (!decryptedUser) {
    // if the correct key doesn't match the stored cache, try every other key returned by the server
    // TODO[session-cache-refactoring]: remove this logic 28 days after deploying
    for (const alternativeCacheKey of alternativeCacheKeys) {
      try {
        const sessionCacheData = decryptSessionCacheData(encryptedSessionCacheData, alternativeCacheKey);
        decryptedUser = sessionCacheData.user;
        // if a key matches the encrypted cache data, re-encrypt the session cache data with the new cache key
        writeSessionCacheData(sessionCacheData, cacheKey);
        break;
      } catch {}
    }
  }

  if (!decryptedUser) {
    // if login broke for this user, try moving to another user
    setNextIDAndReload();
    return false;
  }

  saveCurrentUserData(decryptedUser);
  void refreshUserEmailAndWallet();

  return true;
};
