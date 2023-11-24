import { useEffect } from 'react';
import { useUserProfile } from 'skiff-front-graphql';
import { getStorageKey, StorageTypes } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../apollo/localState';
import { MAIL_DOMAIN } from '../utils';

import useDefaultEmailAlias from './useDefaultEmailAlias';

/**
 * Hook for updating and saving account info for logged out users
 * @returns
 */
const useSyncSavedAccount = () => {
  const { userID, username } = useRequiredCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const { data: userProfileData } = useUserProfile(userID);

  // Prefer defaultEmailAlias over username as a better visual display on login.
  // This  accounts for cases where users change their default alias and delete their
  // original alias (which is equal to their username), but the login selector still
  // shows the username.
  const getUsernameForLocalStorage = () => {
    if (!defaultEmailAlias) {
      return username;
    }
    const [alias, domain] = defaultEmailAlias.split('@');
    // If non-custom domain, e.g. "testing@skiff.com", we can truncate
    // to "testing" for login purposes
    if (domain === MAIL_DOMAIN) {
      return alias;
    }
    // If custtom domain, we must return the full alias and domain
    return defaultEmailAlias;
  };

  const usernameForLocalStorage = getUsernameForLocalStorage();
  // add the logged in users data to local storage
  // so users can log back in more easily
  useEffect(() => {
    localStorage.setItem(
      `${getStorageKey(StorageTypes.SAVED_ACCOUNT)}:${userID}`,
      JSON.stringify({
        username: usernameForLocalStorage,
        publicData: {
          displayName: userProfileData?.publicData?.displayName,
          displayPictureData: userProfileData?.publicData?.displayPictureData
        }
      })
    );
  }, [userID, username, userProfileData, usernameForLocalStorage]);
};

export default useSyncSavedAccount;
