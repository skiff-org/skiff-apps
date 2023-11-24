/* eslint-disable max-len */
import EventEmitter from 'eventemitter3';
import { useEffect, useState } from 'react';

import { LOCAL_SETTINGS_TO_STRING, LocalSettings } from '../constants/userPreferences.constants';

import { getLocalSettingCurrentValue } from './useUserPreference';
const LocalSettingsEE = new EventEmitter<keyof LocalSettings>();

/**
 * Simillar as useState for some defined settings which are stored in localStorage
 * @param setting one of dateFormat or hourFormat (as defined by the LocalSettings interface)
 * @returns [current value of setting, setting setter]
 */
export default function useLocalSetting<T extends keyof LocalSettings>(
  setting: T
): [LocalSettings[T], (newValue: LocalSettings[T]) => any] {
  const [currentValue, setCurrentValue] = useState<LocalSettings[T]>(getLocalSettingCurrentValue(setting));
  const setter = (newValue: LocalSettings[T]) => {
    localStorage.setItem(`skiff:${setting}`, LOCAL_SETTINGS_TO_STRING[setting](newValue));
    LocalSettingsEE.emit(setting);
  };

  useEffect(() => {
    const listener = () => {
      setCurrentValue(getLocalSettingCurrentValue(setting));
    };
    LocalSettingsEE.on(setting, listener);
    return () => {
      LocalSettingsEE.off(setting, listener);
    };
  }, []);

  return [currentValue, setter];
}
