import { makeVar, useReactiveVar } from '@apollo/client';
import { debounce } from 'lodash';
import { storeBrowserShare } from 'skiff-front-utils';
import { uploadDocumentData, models } from 'skiff-mail-graphql';
import { assertExists } from 'skiff-utils';

import client from './client';
// eslint-disable-next-line import/no-cycle

// This stores the current user data with its private info. It is a apollo reactive var and so can be used in other types resolvers (like document to decrypt data)
// and can be used inside components which will rerender on change
const currentUserData = makeVar<models.User | null>(null);

/**
 * Store user data in the cache, used anywhere else in the app
 * @param {models.User} data user data
 */
export const saveCurrentUserData = (data: models.User) => {
  currentUserData(data);
};

/**
 * Clear the user data from the cache
 */
export const removeCurrentUserData = () => {
  currentUserData(null);
};

/**
 * Returns the current user data, if needed in a react component render function, use `useCurrentUserData` instead
 * @returns {models.User | null} user data
 */
export const getCurrentUserData = () => currentUserData();

/**
 * Same as `getCurrentUserData` but throw an error if no current user data is present (if user is logged out)
 * @returns {models.User} user data
 */
export const requireCurrentUserData = () => {
  const userData = currentUserData();
  assertExists(userData);
  return userData;
};

/**
 * use current user data in a react component, need to use this instead of getCurrentUserData to make sure the component rerender if the data changes
 * @returns User data
 */
export const useCurrentUserData = () => useReactiveVar(currentUserData);

/**
 * use current user data in a react component, need to use this instead of getCurrentUserData to make sure the component rerender if the data changes
 * throws an error if no user data is present
 * @returns {models.User} user data
 */
export const useRequiredCurrentUserData = () => {
  const userData = useReactiveVar(currentUserData);
  assertExists(userData);
  return userData;
};

/**
 * Upload user private document data with a 200ms debounce delay
 */
const debouncedUploadCurrentUserPrivateDocumentData = debounce(
  () => {
    const userData = getCurrentUserData();
    if (!userData) {
      return;
    }
    void uploadDocumentData(userData, client);
  },
  200,
  {
    leading: true
  }
);

/**
 * Used to identify the browser when trying to recover an account
 * @param {string} browserShare recovery browser share secret
 */
export const setBrowserRecoveryShare: (browserShare: string) => void = (browserShare: string): void => {
  const userData: models.User = requireCurrentUserData();
  saveCurrentUserData({
    ...userData,
    privateDocumentData: {
      ...userData.privateDocumentData,
      recoveryBrowserShare: browserShare
    }
  });
  const username: string = userData.username;
  storeBrowserShare(username, browserShare);
  debouncedUploadCurrentUserPrivateDocumentData();
};
