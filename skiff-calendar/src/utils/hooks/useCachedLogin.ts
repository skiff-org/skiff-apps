import { ApolloError } from '@apollo/client';
import {
  decryptSessionCacheData,
  writeSessionCacheData,
  models,
  CurrentUserEmailAliasesDocument,
  CurrentUserEmailAliasesQuery,
  CurrentUserEmailAliasesQueryVariables,
  GetSessionCacheWithCalendarsDocument,
  GetSessionCacheWithCalendarsQuery,
  GetSessionCacheWithCalendarsQueryVariables
} from 'skiff-front-graphql';
import {
  getSessionCacheForLatestUser,
  clearLatestUserIDCache,
  getSessionCacheKeyForUserID,
  setNextUUID,
  initializeDefaultEmailAlias,
  requireCurrentUserData,
  saveCurrentUserData
} from 'skiff-front-utils';
import { BadRequest, isApolloLogicErrorType, NotAuthorized, NotFound } from 'skiff-graphql';
import { StorageTypes, getStorageKey } from 'skiff-utils';

import client from '../../apollo/client';

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

const setDefaultEmailAlias = async () => {
  const { data: emailAliasesData } = await client.query<
    CurrentUserEmailAliasesQuery,
    CurrentUserEmailAliasesQueryVariables
  >({
    query: CurrentUserEmailAliasesDocument,
    variables: {},
    fetchPolicy: 'network-only'
  });
  const emailAliases = emailAliasesData.currentUser?.emailAliases || [];
  const user = requireCurrentUserData();
  const defaultEmailAlias = initializeDefaultEmailAlias(user.userID, emailAliases);
  const newUserObj = {
    ...user,
    defaultEmailAlias
  };
  saveCurrentUserData(newUserObj);
};

/**
 * Attempt to use session cache from local storage to refresh JWT. Returns login success status.
 * @returns {boolean} True on login success, false otherwise.
 */
export const tryCachedLogin = async (): Promise<boolean> => {
  const encryptedSessionCacheData = getSessionCacheForLatestUser();
  if (!encryptedSessionCacheData) {
    return false;
  }

  let cacheKey: string;
  let alternativeCacheKeys: string[];
  let userDataToRefresh: undefined | GetSessionCacheWithCalendarsQuery['currentUser'] = undefined;

  // NOTE: This query is different than other apps, because we fetch the calendars and primary calendar
  try {
    // request cache key from server (request is authenticated with httpOnly session cookie)
    const res = await client.query<GetSessionCacheWithCalendarsQuery, GetSessionCacheWithCalendarsQueryVariables>({
      query: GetSessionCacheWithCalendarsDocument
    });
    cacheKey = res.data.sessionCache.cacheKey;
    alternativeCacheKeys = res.data.sessionCache.alternativeCacheKeys;
    userDataToRefresh = res.data.currentUser;
  } catch (e) {
    if (
      e instanceof ApolloError &&
      (isApolloLogicErrorType(e.graphQLErrors[0], NotFound) ||
        isApolloLogicErrorType(e.graphQLErrors[0], BadRequest) ||
        isApolloLogicErrorType(e.graphQLErrors[0], NotAuthorized))
    ) {
      // session cache is invalid, cleaning it
      console.error('Server-side session cache is invalid, cleaning local state', e);
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

  // Refresh critical data on user load. Update if null or defined.
  if (userDataToRefresh) {
    if (userDataToRefresh.recoveryEmail !== undefined) {
      decryptedUser.recoveryEmail = userDataToRefresh.recoveryEmail;
    }
    if (userDataToRefresh.unverifiedRecoveryEmail !== undefined) {
      decryptedUser.unverifiedRecoveryEmail = userDataToRefresh.unverifiedRecoveryEmail;
    }
    if (userDataToRefresh.walletAddress) {
      decryptedUser.walletAddress = userDataToRefresh.walletAddress;
    }
    if (userDataToRefresh.rootOrgID) {
      decryptedUser.rootOrgID = userDataToRefresh.rootOrgID;
    }
    if (userDataToRefresh.calendars) {
      decryptedUser.calendars = userDataToRefresh.calendars;
    }
    if (userDataToRefresh.primaryCalendar) {
      decryptedUser.primaryCalendar = userDataToRefresh.primaryCalendar;
    }
  }
  saveCurrentUserData(decryptedUser);
  // need to wait for setting default email alias because it's necessary in order to create new events
  await setDefaultEmailAlias();

  return true;
};
