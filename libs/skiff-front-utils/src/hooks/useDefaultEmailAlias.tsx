import { useEffect, useState } from 'react';
import { useSetDefaultEmailAliasMutation, useCurrentUserDefaultEmailAliasQuery } from 'skiff-front-graphql';

import { ALIAS_UPDATE_EVENT_NAME, DefaultAliasEE, getDefaultEmailAlias, setDefaultEmailAlias } from '../utils';

/**
 * Returns current value and setter function to persist the user's default email alias in localStorage.
 * Default alias is userID specific.
 */
export default function useDefaultEmailAlias(
  userID?: string,
  onSetDefaultEmailAlias?: (newValue: string) => void
): [string, (newValue: string) => Promise<void>] {
  const { data: aliasData, loading, refetch } = useCurrentUserDefaultEmailAliasQuery({ variables: {} });

  const storedDefault = !!userID ? getDefaultEmailAlias(userID) : '';

  const [currentValue, setCurrentValue] = useState<string>(
    aliasData?.currentUser?.defaultEmailAlias ?? storedDefault ?? ''
  );
  const [setDefaultAliasMutation] = useSetDefaultEmailAliasMutation();

  useEffect(() => {
    if (!aliasData?.currentUser || loading) {
      return;
    }
    if (userID && aliasData?.currentUser?.defaultEmailAlias) {
      const userDefault = aliasData?.currentUser?.defaultEmailAlias;
      if (userDefault !== storedDefault) {
        setCurrentValue(userDefault);
        setDefaultEmailAlias(userID, userDefault);
      }
    }
    if (userID && !aliasData.currentUser.defaultEmailAlias && storedDefault) {
      try {
        const setAndRefetch = async () => {
          await setDefaultAliasMutation({
            variables: {
              request: {
                defaultAlias: storedDefault
              }
            },
            errorPolicy: 'all'
          });
          await refetch();
        };
        void setAndRefetch();
      } catch (error) {
        console.error('Failed to set alias to stored value', error);
      }
    }
  }, [userID, aliasData?.currentUser?.defaultEmailAlias, loading]);

  const setter = async (newValue: string) => {
    const res = await setDefaultAliasMutation({
      variables: {
        request: {
          defaultAlias: newValue
        }
      },
      errorPolicy: 'all'
    });
    if (res.errors) {
      console.error('Failed to set default alias', res.errors);
      return;
    }
    await refetch();
    setDefaultEmailAlias(userID, newValue);
    if (!!onSetDefaultEmailAlias) {
      onSetDefaultEmailAlias(newValue);
    }
  };

  useEffect(() => {
    const listener = () => setCurrentValue(getDefaultEmailAlias(userID));
    DefaultAliasEE.on(ALIAS_UPDATE_EVENT_NAME, listener);
    return () => {
      DefaultAliasEE.off(ALIAS_UPDATE_EVENT_NAME, listener);
    };
  }, [userID]);

  return [currentValue, setter];
}
