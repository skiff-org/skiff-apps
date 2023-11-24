import { AccentColor } from 'nightwatch-ui';
import {
  DateFormat,
  DateInputFormats,
  DayOfWeek,
  HourFormat,
  HourFormatValue,
  StartDayOfTheWeek,
  VALID_START_DAYS_OF_WEEK,
  validDateFormats,
  validHourFormats,
  validTimeZones
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import { DEFAULT_EVENT_COLOR } from '../constants';
import { getUserGuessedTimeZone } from '../utils/dateTimeUtils';

export interface LocalSettings {
  dateFormat: DateFormat;
  hourFormat: HourFormat;
  startDayOfTheWeek: StartDayOfTheWeek;
  timeZone: string;
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: AccentColor;
  allDayRowCollapsed: boolean;
}

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  dateFormat: DateInputFormats.MonthDayYear,
  hourFormat: HourFormatValue.Twelve,
  startDayOfTheWeek: DayOfWeek.Sunday,
  timeZone: getUserGuessedTimeZone(),
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: DEFAULT_EVENT_COLOR,
  allDayRowCollapsed: true
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LOCAL_SETTINGS_VALIDATORS: Record<keyof LocalSettings, (setting: any) => boolean> = {
  hourFormat: (value: string | null) => validHourFormats.includes(value as HourFormatValue),
  dateFormat: (value: string | null) => validDateFormats.includes(value as DateInputFormats),
  startDayOfTheWeek: (value: string | null) =>
    value !== null && VALID_START_DAYS_OF_WEEK.includes(parseInt(value) as StartDayOfTheWeek),
  timeZone: (value: string | null) => validTimeZones.includes(value as string),
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: (value: string | null) => !!(value as AccentColor),
  allDayRowCollapsed: (value: string | null) => value === 'true' || value === 'false'
};

export const LOCAL_SETTINGS_PARSERS: Record<
  keyof LocalSettings,
  (value: string | null) => LocalSettings[keyof LocalSettings]
> = {
  hourFormat: (value) => value as HourFormat,
  dateFormat: (value) => value as DateFormat,
  startDayOfTheWeek: (value) => parseInt(value ?? '') as StartDayOfTheWeek,
  timeZone: (value) => value as string,
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: (value) => value as AccentColor,
  allDayRowCollapsed: (value) => value === 'true'
};

export enum UserPreferenceKey {
  AUTO_ADVANCE = 'autoAdvance',
  ADVANCE_TO_NEXT = 'advanceToNext',
  THEME = 'theme',
  HAS_SEEN_CUSTOM_DOMAIN_TRIAL_OFFER = 'hasSeenCustomDomainTrialOffer',
  HAS_SEEN_CALENDAR = 'hasSeenCalendar',
  HAS_SEEN_CUSTOM_DOMAIN_PAGE = 'hasSeenCustomDomainPage',
  CAL_MOBILE_BANNER_APPEARANCES = 'calMobileBannerAppearances',
  DEFAULT_APP = 'defaultApp',
  TIMEZONE = 'timezone',
  BLOCK_REMOTE_CONTENT = 'blockRemoteContent',
  DATE_FORMAT = 'dateFormat',
  HOUR_FORMAT = 'hourFormat',
  LEFT_MAIL_SWIPE_ACTION = 'leftMailSwipeAction',
  RIGHT_MAIL_SWIPE_ACTION = 'rightMailSwipeAction'
}

export const UserPreferenceKeys = Object.values(UserPreferenceKey) as UserPreferenceKey[];
