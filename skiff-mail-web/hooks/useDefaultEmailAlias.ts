import EventEmitter from 'eventemitter3';
import { useEffect, useState, useCallback } from 'react';
import { getStorageKey, StorageTypes } from 'skiff-front-utils';

import { useRequiredCurrentUserData } from '../apollo/currentUser';
import { resolveAndSetENSDisplayName } from '../utils/userUtils';

import { useCurrentUserEmailAliases } from './useCurrentUserEmailAliases';

const DefaultAliasEE = new EventEmitter<string>();

export const getAliasKey = (userID: string) => `${getStorageKey(StorageTypes.DEFAULT_ALIAS)}:${userID}`;

export const getCurrentAliasValue = (userID: string) => {
  const localStorageKey = getAliasKey(userID);
  const localStorageValue = localStorage.getItem(localStorageKey);
  return localStorageValue || undefined;
};

const aliasUpdateEventName = 'aliasUpdate';

/**
 * Returns current value and setter function to persist the user's default email alias in localStorage.
 * Default alias is userID specific.
 */
export function useDefaultEmailAlias(): [string | undefined, (newValue: string) => void] {
  const emailAliases = useCurrentUserEmailAliases();
  const user = useRequiredCurrentUserData();
  const { userID } = user;
  const curVal = getCurrentAliasValue(userID);
  const [currentValue, setCurrentValue] = useState<string | undefined>(curVal ?? emailAliases?.[0] ?? undefined);

  const setter = useCallback(
    async (newValue: string) => {
      localStorage.setItem(getAliasKey(userID), newValue);
      DefaultAliasEE.emit(aliasUpdateEventName);
      // Update display name to be in sync with the default email alias
      await resolveAndSetENSDisplayName(newValue, user);
    },
    [user, userID]
  );

  useEffect(() => {
    if (!currentValue) {
      setCurrentValue(emailAliases?.[0] ?? undefined);
    }
  }, [currentValue, emailAliases]);

  useEffect(() => {
    const listener = () => {
      setCurrentValue(getCurrentAliasValue(userID));
    };
    DefaultAliasEE.on(aliasUpdateEventName, listener);
    return () => {
      DefaultAliasEE.off(aliasUpdateEventName, listener);
    };
  }, [userID]);

  return [currentValue, setter];
}
