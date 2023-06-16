import EventEmitter from 'eventemitter3';
import { useState, useEffect } from 'react';
import {
  useSetUserPreferencesMutation,
  useGetUserPreferencesQuery,
  GetUserPreferencesDocument
} from 'skiff-front-graphql';

import {
  DEFAULT_LOCAL_SETTINGS,
  DEFAULT_ALL_USER_PREFERENCES,
  LocalSettings,
  UserPreferences,
  AllUserPreferences,
  LOCAL_SETTINGS_PARSERS,
  LOCAL_SETTINGS_TO_STRING,
  LOCAL_SETTINGS_VALIDATORS,
  UserPreferenceKey,
  UserPreferenceKeys
} from '../constants/userPreferences.constants';

const UserPreferencesEE = new EventEmitter<keyof AllUserPreferences>();

/**
 * Type guards
 */
const isLocalSettingsKey = (key: string): key is keyof LocalSettings => key in LOCAL_SETTINGS_VALIDATORS;

const isValidLocalSettingValue = <T extends keyof LocalSettings>(
  key: T,
  value: LocalSettings[keyof LocalSettings]
): value is LocalSettings[T] => isLocalSettingsKey(key) && LOCAL_SETTINGS_VALIDATORS[key](value);

const isValidUserPreferenceKey = (preference: string): preference is keyof UserPreferences =>
  UserPreferenceKeys.includes(preference as UserPreferenceKey);

const isValidUserPreferenceValue = <T extends keyof UserPreferences>(
  key: T,
  newValue: AllUserPreferences[keyof AllUserPreferences]
): newValue is UserPreferences[T] =>
  isValidUserPreferenceKey(key) && typeof newValue === typeof DEFAULT_ALL_USER_PREFERENCES[key];

const isValidAllUserPreferenceValue = <T extends keyof AllUserPreferences>(
  key: T,
  newValue: AllUserPreferences[keyof AllUserPreferences]
): newValue is AllUserPreferences[T] =>
  (isValidUserPreferenceKey(key) && isValidUserPreferenceValue(key, newValue)) ||
  (isLocalSettingsKey(key) && isValidLocalSettingValue(key, newValue));

export const getLocalSettingCurrentValue = <T extends keyof LocalSettings>(setting: T): LocalSettings[T] => {
  const value = localStorage.getItem(`skiff:${setting}`);

  if (value === null || value === undefined) {
    return DEFAULT_LOCAL_SETTINGS[setting];
  }

  const isValid = isValidLocalSettingValue(setting, value);

  return isValid
    ? (LOCAL_SETTINGS_PARSERS[setting](value) as LocalSettings[typeof setting])
    : DEFAULT_LOCAL_SETTINGS[setting];
};

/**
 * Hook to get/ update the value of the specified user preference.
 * If the specified preference is not found in the database, a value
 * from localStorage (if present) or a default value will be returned.
 *
 * User preferences are currently split between the database and localStorage.
 * The user preference keys in the database are defined in `UserPreferences` interface, while
 * the user preference keys in localStorage are defined in `LocalSettings` interface.
 *
 * The `AllUserPreferences` interface is a union of both interfaces. This hook accepts any key
 * which is present in this union and returns the value/ setter accordingly.
 *
 * @param preference preference key
 */
export default function useUserPreference<T extends keyof AllUserPreferences>(
  preference: T
): [AllUserPreferences[T], (newValue: AllUserPreferences[T]) => void] {
  const [currentValue, setCurrentValue] = useState<AllUserPreferences[T]>(DEFAULT_ALL_USER_PREFERENCES[preference]);

  const { data } = useGetUserPreferencesQuery();
  const [setPreference] = useSetUserPreferencesMutation();
  const preferenceInLocalStorage = isLocalSettingsKey(preference);

  /* Define setter functions */
  const setLocalValue = (newValue: AllUserPreferences[T]) => {
    if (preferenceInLocalStorage) {
      const proposedLocalSettingValue = LOCAL_SETTINGS_TO_STRING[preference](newValue);
      const isValid = LOCAL_SETTINGS_VALIDATORS[preference](proposedLocalSettingValue);
      if (isValid) {
        localStorage.setItem(`skiff:${preference}`, proposedLocalSettingValue);
      }
    }
    UserPreferencesEE.emit(preference, newValue);
  };

  const setRemoteValue = async (newValue: AllUserPreferences[T]) => {
    await setPreference({
      variables: {
        request: {
          [preference]: newValue
        }
      },
      refetchQueries: [{ query: GetUserPreferencesDocument }]
    });
    UserPreferencesEE.emit(preference, newValue);
  };

  const removeLocalAndSetRemoteValue = async (newValue: AllUserPreferences[T]) => {
    localStorage.removeItem(`skiff:${preference}`);
    await setRemoteValue(newValue);
  };

  // 1. Check if the specified preference is a valid key for userPreferences.
  // 2. Check if user preference data contains the requested preference.
  // 3. If the preference is not present in the database, check local storage.
  // 4. Since `preference` is neither a valid key for userPreferences nor present in the database, check local storage for the preference.

  const getValueAndSetter = (): {
    initialValue: AllUserPreferences[keyof AllUserPreferences];
    setter: ((newValue: AllUserPreferences[T]) => Promise<void>) | ((newValue: AllUserPreferences[T]) => void);
  } => {
    const isValidUserPrefKey = isValidUserPreferenceKey(preference);

    if (isValidUserPrefKey) {
      // If the preference is present in localStorage, set the value in both the database as well as in localStorage for backwards compatibility.
      const prefValue = localStorage.getItem(`skiff:${preference}`);
      const preferenceIsPresent = prefValue !== null && prefValue !== undefined;
      if (preferenceInLocalStorage && preferenceIsPresent) {
        return {
          initialValue: getLocalSettingCurrentValue(preference),
          setter: removeLocalAndSetRemoteValue
        };
      }
      // Check if user preference data contains the requested preference.
      const remotePreferenceIsPresent =
        data?.userPreferences?.[preference] !== null && data?.userPreferences?.[preference] !== undefined;
      if (remotePreferenceIsPresent && data.userPreferences) {
        // need to repeat data.userPreferences for lint
        return {
          initialValue: data.userPreferences[preference] ?? '',
          setter: setRemoteValue
        };
      }

      // Use default value if preference value cannot be found elsewhere
      return {
        initialValue: DEFAULT_ALL_USER_PREFERENCES[preference],
        setter: setRemoteValue
      };
    }

    // Since `preference` is not a valid key for userPreferences, it must be a possible local setting
    return {
      initialValue: getLocalSettingCurrentValue(preference),
      setter: setLocalValue
    };
  };

  const { initialValue, setter } = getValueAndSetter();

  useEffect(() => {
    if (!isValidAllUserPreferenceValue(preference, initialValue)) return;
    setCurrentValue(initialValue);
  }, [preference, initialValue]);

  useEffect(() => {
    const listener = (newValue: AllUserPreferences[T]) => {
      setCurrentValue(newValue);
    };
    UserPreferencesEE.on(preference, listener);
    return () => {
      UserPreferencesEE.off(preference, listener);
    };
  }, [preference]);

  return [currentValue, setter];
}
