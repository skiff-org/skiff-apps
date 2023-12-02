/* eslint-disable max-len */
import EventEmitter from 'eventemitter3';
import { useEffect, useState } from 'react';

import {
  LocalSettings,
  LOCAL_SETTINGS_PARSERS,
  LOCAL_SETTINGS_VALIDATORS,
  DEFAULT_LOCAL_SETTINGS
} from '../../constants/userPreferences.constants';

const LocalSettingsEE = new EventEmitter<keyof LocalSettings>();

export function getLocalSettingCurrentValue<T extends keyof LocalSettings>(setting: T): LocalSettings[T] {
  const value = localStorage.getItem(`skiff:${setting}`);
  const isValid = LOCAL_SETTINGS_VALIDATORS[setting](value);

  return isValid
    ? (LOCAL_SETTINGS_PARSERS[setting](value) as LocalSettings[typeof setting])
    : DEFAULT_LOCAL_SETTINGS[setting];
}
/**
 * Simillar as useState for some defined settings which are stored in localStorage
 * @param setting one of dateFormat or hourFormat (as defined by the LocalSettings interface)
 * @returns [current value of setting, setting setter]
 */
export function useLocalSetting<T extends keyof LocalSettings>(
  setting: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): [LocalSettings[T], (newValue: LocalSettings[T]) => any] {
  const [currentValue, setCurrentValue] = useState<LocalSettings[T]>(getLocalSettingCurrentValue(setting));
  const setter = (newValue: LocalSettings[T]) => {
    localStorage.setItem(`skiff:${setting}`, newValue.toString());
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
  }, [setting]);

  return [currentValue, setter];
}
