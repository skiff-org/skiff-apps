import EventEmitter from 'eventemitter3';
import { useEffect, useState } from 'react';

import { useRequiredCurrentUserData } from '../apollo/currentUser';
import { useGetCurrentUserEmailAliasesQuery } from '../generated/graphql';
import { getStorageKey, SkemailStorageTypes } from '../utils/storageUtils';

const DefaultAliasEE = new EventEmitter<string>();

export const getAliasKey = (userID: string) => `${getStorageKey(SkemailStorageTypes.DEFAULT_ALIAS)}:${userID}`;

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
  const { data } = useGetCurrentUserEmailAliasesQuery();
  const { userID } = useRequiredCurrentUserData();
  const curVal = getCurrentAliasValue(userID);
  const [currentValue, setCurrentValue] = useState<string | undefined>(
    curVal ?? data?.currentUser?.emailAliases?.[0] ?? undefined
  );
  const setter = (newValue: string) => {
    localStorage.setItem(getAliasKey(userID), newValue);
    DefaultAliasEE.emit(aliasUpdateEventName);
  };

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
