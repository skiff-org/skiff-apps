import { ApolloClient, makeVar, NormalizedCacheObject, useReactiveVar } from '@apollo/client';
import debounce from 'lodash-es/debounce';
import omit from 'lodash-es/omit';
import { models, uploadDocumentData } from 'skiff-front-graphql';
import { assertExists } from 'skiff-utils';

import { storeBrowserShare } from '../../utils/recoveryUtils';

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
 * @returns {User | null} user data
 */
export const getCurrentUserData = () => currentUserData();

/**
 * Same as `getCurrentUserData` but throw an error if no current user data is present (if user is logged out)
 * @returns {User} user data
 */
export const requireCurrentUserData = () => {
  const userData = currentUserData();
  assertExists(userData, 'no user data provided');
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
 * @returns {User} user data
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
  (client: ApolloClient<NormalizedCacheObject>) => {
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
 * Save a user public key which will be shown a "verified" anywhere else in the app
 * @param {UserID} userID user id
 * @param {string} publicKey user public key
 */
export const saveVerifiedUserPublicKey = (
  userID: string,
  publicKey: string,
  client: ApolloClient<NormalizedCacheObject>
) => {
  const userData = getCurrentUserData();
  if (!userData) {
    return;
  }
  saveCurrentUserData({
    ...userData,
    privateDocumentData: {
      ...userData.privateDocumentData,
      verifiedKeys: {
        ...userData.privateDocumentData.verifiedKeys,
        keys: {
          ...userData.privateDocumentData.verifiedKeys.keys,
          [userID]: publicKey
        },
        lastVerifiedDate: new Date().toISOString()
      }
    }
  });
  debouncedUploadCurrentUserPrivateDocumentData(client);
};

/**
 * Revoke a user verified public key
 * @param {UserID} userID user id
 */
export const purgeVerifiedUserPublicKey = (userID: string, client: ApolloClient<NormalizedCacheObject>) => {
  const userData = getCurrentUserData();
  if (!userData) {
    return;
  }
  saveCurrentUserData({
    ...userData,
    privateDocumentData: {
      ...userData.privateDocumentData,
      verifiedKeys: {
        ...userData.privateDocumentData.verifiedKeys,
        keys: omit(userData.privateDocumentData.verifiedKeys.keys, [userID]),
        lastVerifiedDate: new Date().toISOString()
      }
    }
  });
  debouncedUploadCurrentUserPrivateDocumentData(client);
};

/**
 * Used to identify the browser when trying to recover an account
 * @param {string} browserShare recovery browser share secret
 */
export const setBrowserRecoveryShare = (browserShare: string, client: ApolloClient<NormalizedCacheObject>) => {
  const userData = requireCurrentUserData();
  saveCurrentUserData({
    ...userData,
    privateDocumentData: {
      ...userData.privateDocumentData,
      recoveryBrowserShare: browserShare
    }
  });
  storeBrowserShare(userData.username, browserShare);
  debouncedUploadCurrentUserPrivateDocumentData(client);
};

export const deleteCurrentUserRecoveryEmail = () => {
  const userData = requireCurrentUserData();
  saveCurrentUserData({
    ...userData,
    recoveryEmail: null
  });
};
