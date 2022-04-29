import { makeVar, useReactiveVar } from '@apollo/client';

import { User } from '../models/user';
import { assertExists } from '../utils/typeUtils';

// This stores the current user data with its private info. It is a apollo reactive var and so can be used in other types resolvers (like document to decrypt data)
// and can be used inside components which will rerender on change
const currentUserData = makeVar<User | null>(null);

/**
 * Store user data in the cache, used anywhere else in the app
 * @param {User} data user data
 */
export const saveCurrentUserData = (data: User) => {
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
 * @returns {User} user data
 */
export const useRequiredCurrentUserData = () => {
  const userData = useReactiveVar(currentUserData);
  assertExists(userData);
  return userData;
};
