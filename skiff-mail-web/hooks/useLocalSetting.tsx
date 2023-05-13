/* eslint-disable max-len */
import EventEmitter from 'eventemitter3';
import toNumber from 'lodash/toNumber';
import { useEffect, useState } from 'react';
import { SwipeSetting } from 'skiff-graphql';

import {
  DEFAULT_INBOX_LEFT_SWIPE,
  DEFAULT_INBOX_RIGHT_SWIPE
} from '../components/Settings/Appearance/Swipe/SwipeSettings.constants';

const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
type DateFormat = (typeof validDateFormats)[number];

const validHourFormats = ['12', '24'] as const;
type HourFormat = (typeof validHourFormats)[number];

export enum ThreadDisplayFormat {
  Full = 'Full',
  Right = 'Right'
}
const validThreadFormats = [ThreadDisplayFormat.Full, ThreadDisplayFormat.Right] as const;
type ThreadFormat = (typeof validThreadFormats)[number];

export interface LocalSettings {
  dateFormat: DateFormat;
  hourFormat: HourFormat;
  lastTourVersion: number;
  // temporary credit promotion banner
  skemailCreditPromotionBannerAppearances: number;
  introducingEmailModalShown: boolean;
  threadFormat: ThreadFormat;
  // only store if disabled
  securedBySkiffSigDisabled?: boolean;
  // only store if disabled
  disableLoadRemoteContent?: boolean;
  // swipe settings
  leftSwipeGesture?: SwipeSetting;
  rightSwipeGesture?: SwipeSetting;
  showAliasInboxes: boolean;
}

const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  dateFormat: 'MM/DD/YYYY',
  hourFormat: '12',
  lastTourVersion: 0,
  introducingEmailModalShown: false,
  threadFormat: ThreadDisplayFormat.Full,
  skemailCreditPromotionBannerAppearances: 0,
  leftSwipeGesture: DEFAULT_INBOX_LEFT_SWIPE,
  rightSwipeGesture: DEFAULT_INBOX_RIGHT_SWIPE,
  showAliasInboxes: true
};

const LOCAL_SETTINGS_VALIDATORS: Record<keyof LocalSettings, (setting: any) => boolean> = {
  hourFormat: (value) => validHourFormats.includes(value),
  dateFormat: (value) => validDateFormats.includes(value),
  // -1 is used to disable all tours
  lastTourVersion: (value) => value !== null && !isNaN(value) && toNumber(value) >= -1,
  introducingEmailModalShown: (value) => value === 'true' || value === 'false',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  threadFormat: (value) => validThreadFormats.includes(value),
  securedBySkiffSigDisabled: (value) => value === 'true',
  skemailCreditPromotionBannerAppearances: (value) =>
    value !== null && !isNaN(value as unknown as number) && toNumber(value) >= 0,
  disableLoadRemoteContent: (value) => value === 'true',
  leftSwipeGesture: (value) => typeof value === 'string' && (Object.values(SwipeSetting) as string[]).includes(value),
  rightSwipeGesture: (value) => typeof value === 'string' && (Object.values(SwipeSetting) as string[]).includes(value),
  showAliasInboxes: (value) => value === 'true' || value === 'false'
};

const LOCAL_SETTINGS_PARSERS: Record<keyof LocalSettings, (value: any) => LocalSettings[keyof LocalSettings]> = {
  hourFormat: (value) => value as LocalSettings['hourFormat'],
  dateFormat: (value) => value as LocalSettings['dateFormat'],
  lastTourVersion: (value) => parseInt(value as unknown as string),
  introducingEmailModalShown: (value) => value === 'true',
  threadFormat: (value) => value as LocalSettings['threadFormat'],
  securedBySkiffSigDisabled: (value) => value === 'true',
  disableLoadRemoteContent: (value) => value === 'true',
  skemailCreditPromotionBannerAppearances: (value) => parseInt(value as unknown as string),
  leftSwipeGesture: (value) => value as SwipeSetting | undefined,
  rightSwipeGesture: (value) => value as SwipeSetting | undefined,
  showAliasInboxes: (value) => value === 'true'
};

const LocalSettingsEE = new EventEmitter<keyof LocalSettings>();

function getLocalSettingCurrentValue<T extends keyof LocalSettings>(setting: T): LocalSettings[T] {
  const value = localStorage.getItem(`skiff:${setting}`);
  const isValid = LOCAL_SETTINGS_VALIDATORS[setting](value);

  return isValid
    ? (LOCAL_SETTINGS_PARSERS[setting](value) as LocalSettings[typeof setting])
    : DEFAULT_LOCAL_SETTINGS[setting];
}
/**
 * Similar as useState for some defined settings which are stored in localStorage
 * @param setting one of dateFormat or hourFormat (as defined by the LocalSettings interface)
 * @returns [current value of setting, setting setter]
 */
export default function useLocalSetting<T extends keyof LocalSettings>(
  setting: T
): [LocalSettings[T], (newValue: LocalSettings[T]) => any] {
  const [currentValue, setCurrentValue] = useState<LocalSettings[T]>(getLocalSettingCurrentValue(setting));
  const setter = (newValue: LocalSettings[T]) => {
    if (newValue !== undefined) {
      localStorage.setItem(`skiff:${setting}`, newValue.toString());
    } else {
      // if value is undefined, we remove the key, e.g. removal of securedBySkiffSigDisabled setting
      localStorage.removeItem(`skiff:${setting}`);
    }
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
