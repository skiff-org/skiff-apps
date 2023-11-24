import { getStorageKey, StorageTypes } from 'skiff-utils';

export const getLatestUserID = () => {
  return localStorage.getItem(getStorageKey(StorageTypes.LATEST_USER_ID));
};

export const clearLatestUserID = () => {
  localStorage.removeItem(getStorageKey(StorageTypes.LATEST_USER_ID));
};

export const storeLatestUserID = (userID: string) => {
  localStorage.setItem(getStorageKey(StorageTypes.LATEST_USER_ID), userID);
};

export const getSessionCacheKeyForUserID = (userID: string) => {
  return `${getStorageKey(StorageTypes.SESSION_CACHE)}:${userID}`;
};

export const getSavedAccountKeyForUserID = (userID: string) => {
  return `${getStorageKey(StorageTypes.SAVED_ACCOUNT)}:${userID}`;
};

export const getAllLocalStorageUUIDs = () => {
  const allKeys = Object.keys(localStorage);
  const sessionCachePrefix = `${getStorageKey(StorageTypes.SESSION_CACHE)}:`;
  const relevantKeys = allKeys.filter((key) => key.startsWith(sessionCachePrefix));
  const allUUIDs = relevantKeys.map((key) => key.replace(sessionCachePrefix, ''));
  return allUUIDs;
};

const getStorageKeysfromType = (type: StorageTypes) => {
  const allKeys = Object.keys(localStorage);
  const prefix = `${getStorageKey(type)}:`;
  const relevantKeys = allKeys.filter((key) => key.startsWith(prefix));
  return relevantKeys;
};

export const getAllLocalStorageAccounts = () => {
  const relevantKeys = getStorageKeysfromType(StorageTypes.SAVED_ACCOUNT);
  const allAccounts = relevantKeys.map((key) => localStorage.getItem(key));
  // allAllAccounts returns JSON.stringified object
  // the object is a UserPublicProfile, { username, publicData: { displayName, displayPictureData } }
  return allAccounts;
};

export const signOutAllLocalStorageAccounts = () => {
  const relevantKeys = getStorageKeysfromType(StorageTypes.SAVED_ACCOUNT);
  relevantKeys.forEach((key) => localStorage.removeItem(key));
};

export const signOutOfLocalStorageAccount = (userID: string) => {
  localStorage.removeItem(`${getStorageKey(StorageTypes.SAVED_ACCOUNT)}:${userID}`);
};

export const getSessionCacheForLatestUser = () => {
  const latestUserID = getLatestUserID();
  // get default key if no userID, otherwise get from userID
  if (!latestUserID) {
    return localStorage.getItem(getStorageKey(StorageTypes.SESSION_CACHE));
  }
  return localStorage.getItem(getSessionCacheKeyForUserID(latestUserID));
};

// if stored in localstorage, redirect to mail or calendar
export const MAIL_REDIRECT_KEY = 'mail';
export const CALENDAR_REDIRECT_KEY = 'calendar';

// store org everyone team ID (a docID) in local storage, or store 'mail'
export const storeRedirectInLocalStorage = (docIDOrRedirect: string | null | undefined) => {
  const localStorageKey = getStorageKey(StorageTypes.ORGANIZATION_EVERYONE_TEAM);
  if (docIDOrRedirect) {
    localStorage.setItem(localStorageKey, docIDOrRedirect);
  } else {
    localStorage.removeItem(localStorageKey);
  }
};

export const clearLatestUserIDCache = () => {
  // new format
  const latestID = getLatestUserID();
  if (latestID) {
    localStorage.removeItem(getSessionCacheKeyForUserID(latestID));
  }
};

// Cycle the default userID parameter set in localstorage to the next one
export const setNextUUID = (curUserID?: string) => {
  let shouldReload = false;
  clearLatestUserID();
  const allUUIDs = getAllLocalStorageUUIDs();
  const allUUIDsWithoutUser = allUUIDs.filter((uuidElem) => uuidElem !== curUserID);
  if (allUUIDsWithoutUser.length >= 1) {
    storeLatestUserID(allUUIDsWithoutUser[0]);
    console.log(getLatestUserID());
    shouldReload = true;
    // should reload to log in other user
  }
  return shouldReload;
};

export const readRedirectFromLocalStorage = () => {
  const existingTeam = localStorage.getItem(getStorageKey(StorageTypes.ORGANIZATION_EVERYONE_TEAM));
  if (existingTeam) {
    return existingTeam;
  }
  // no key exists
  // return mail as the default key
  if (!window.ReactNativeWebView && window.location.hostname !== 'localhost') {
    return MAIL_REDIRECT_KEY;
  }

  // return as if no value read
  return null;
};
