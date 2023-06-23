import { AccentColor, isAccentColor, Color } from '@skiff-org/skiff-ui';
import { BottomDrawerModes, ThreadDisplayFormat, SwipeSetting } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { getUserGuessedTimeZone } from '../utils/dateUtils';

import { VALID_START_DAYS_OF_WEEK, validDateFormats, validHourFormats, validTimeZones } from './dateTime.constants';
import {
  DayOfWeek,
  StartDayOfTheWeek,
  DateFormat,
  HourFormat,
  HourFormatValue,
  DateInputFormats
} from './dateTime.constants';

export type DocID = string;

export { BottomDrawerModes };

export const MAX_SKEMAIL_MOBILE_BANNER_APPEARANCES = 1;

const validThreadFormats = [ThreadDisplayFormat.Full, ThreadDisplayFormat.Right] as const;
type ThreadFormat = (typeof validThreadFormats)[number];

// TODO: Combine LocalSettings and UserPreferences into a single interface

// These preferences are stored in localStorage
export interface LocalSettings {
  // These are settings related to toasts and banners
  // Will be removed in the future
  hasSeenCustomDomainPage: boolean;
  hasSeenCustomDomainTrialOffer: boolean;
  hasSeenCalendar: boolean;
  calMobileBannerAppearances: number;
  hasSeenEssential: boolean;
  hasSeenAliasInboxes: boolean;
  introducingEmailModalShown: boolean;
  skemailMobileBannerAppearances: number;
  hasSeenActivationChecklist: boolean;

  // The following are only-local settings
  defaultEmailAlias: string;
  uploadedDocIDs: DocID[];
  timeZone: string;
  bottomDrawerState: BottomDrawerModes;

  // The following settings are also present in UserPreferences, but are maintained for backwards compatibility
  dateFormat: DateFormat;
  hourFormat: HourFormat;

  // Calendar-specific settings
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: AccentColor;
  threadFormat: ThreadFormat;
  startDayOfTheWeek: StartDayOfTheWeek;

  // Email specific settings
  leftSwipeGesture: SwipeSetting;
  rightSwipeGesture: SwipeSetting;
  [StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED]: boolean;
  showAliasInboxes: boolean;

  // Editor specific settings
  showPageIcon: boolean;
}

// These preferences are stored in the database
export interface UserPreferences {
  theme: string;
  dateFormat: DateFormat;
  hourFormat: HourFormat;
  showPageIcon: boolean;

  // Calendar-specific settings
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: AccentColor;
  startDayOfTheWeek: StartDayOfTheWeek;

  // Email specific settings
  leftSwipeGesture: SwipeSetting;
  rightSwipeGesture: SwipeSetting;
  [StorageTypes.BLOCK_REMOTE_CONTENT]: boolean;
  [StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED]: boolean;
  showAliasInboxes: boolean;
  threadFormat: ThreadFormat;
  hideActivationChecklist: boolean;
}

export interface AllUserPreferences extends LocalSettings, UserPreferences {}

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  defaultEmailAlias: '',
  hasSeenCustomDomainPage: false,
  hasSeenCustomDomainTrialOffer: false,
  hasSeenCalendar: false,
  calMobileBannerAppearances: 0,
  hasSeenEssential: false,
  hasSeenAliasInboxes: false,
  introducingEmailModalShown: false,
  bottomDrawerState: BottomDrawerModes.Closed,
  uploadedDocIDs: [],
  timeZone: getUserGuessedTimeZone(),
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: 'blue',
  threadFormat: ThreadDisplayFormat.Full,
  dateFormat: DateInputFormats.MonthDayYear,
  hourFormat: HourFormatValue.Twelve,
  startDayOfTheWeek: DayOfWeek.Sunday,
  leftSwipeGesture: SwipeSetting.Delete,
  rightSwipeGesture: SwipeSetting.Unread,
  showAliasInboxes: true,
  showPageIcon: true,
  [StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED]: false,
  skemailMobileBannerAppearances: 0,
  hasSeenActivationChecklist: false
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'dark',
  dateFormat: DateInputFormats.MonthDayYear,
  hourFormat: HourFormatValue.Twelve,
  startDayOfTheWeek: DayOfWeek.Sunday,
  [StorageTypes.DEFAULT_CALENDAR_COLOR]: 'blue',
  [StorageTypes.BLOCK_REMOTE_CONTENT]: false,
  leftSwipeGesture: SwipeSetting.Delete,
  rightSwipeGesture: SwipeSetting.Unread,
  showPageIcon: true,
  securedBySkiffSigDisabled: false,
  showAliasInboxes: true,
  threadFormat: ThreadDisplayFormat.Full,
  hideActivationChecklist: false
};

export const DEFAULT_ALL_USER_PREFERENCES: AllUserPreferences = {
  ...DEFAULT_LOCAL_SETTINGS,
  ...DEFAULT_USER_PREFERENCES
};

// used to validate strings stored in local settings
export const LOCAL_SETTINGS_VALIDATORS: Record<keyof LocalSettings, (setting: any) => boolean> = {
  defaultEmailAlias: (value: string | null) => value !== null && typeof value === 'string',
  hasSeenCustomDomainPage: (value: string | null) => value === 'true' || value === 'false',
  hasSeenCustomDomainTrialOffer: (value: string | null) => value === 'true' || value === 'false',
  hasSeenCalendar: (value: string | null) => value === 'true' || value === 'false',
  calMobileBannerAppearances: (value: string | null) =>
    value !== null && !isNaN(parseInt(value)) && parseInt(value) >= 0,
  hasSeenEssential: (value: string | null) => value === 'true' || value === 'false',
  hasSeenAliasInboxes: (value: string | null) => value === 'true' || value === 'false',
  introducingEmailModalShown: (value: string | null) => value === 'true' || value === 'false',
  bottomDrawerState: (value: string | null) =>
    value !== null && (Object.values(BottomDrawerModes) as string[]).includes(value),
  uploadedDocIDs: (value: string | null) => value !== null && Array.isArray(JSON.parse(value)),
  timeZone: (value: string | null) => value !== null && validTimeZones.includes(value),
  defaultCalendarColor: (value: string | null) => value !== null && isAccentColor(value as Color),
  threadFormat: (value: string | null) => value !== null && validThreadFormats.includes(value as ThreadDisplayFormat),
  hourFormat: (value: string | null) => value !== null && validHourFormats.includes(value as HourFormatValue),
  dateFormat: (value: string | null) => value !== null && validDateFormats.includes(value as DateInputFormats),
  showPageIcon: (value: string | null) => value === 'true' || value === 'false',
  [StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED]: (value: string | null) => value === 'true' || value === 'false',
  startDayOfTheWeek: (value: string | null) =>
    value !== null && VALID_START_DAYS_OF_WEEK.includes(parseInt(value) as StartDayOfTheWeek),
  leftSwipeGesture: (value: string | null) =>
    typeof value === 'string' && (Object.values(SwipeSetting) as string[]).includes(value),
  rightSwipeGesture: (value: string | null) =>
    typeof value === 'string' && (Object.values(SwipeSetting) as string[]).includes(value),
  showAliasInboxes: (value: string | null) => value === 'true' || value === 'false',
  skemailMobileBannerAppearances: (value: string | null) =>
    value !== null && !isNaN(parseInt(value)) && parseInt(value) >= 0,
  hasSeenActivationChecklist: (value: string | null) => value === 'true' || value === 'false'
};

export const LOCAL_SETTINGS_TO_STRING: Record<
  keyof Pick<AllUserPreferences, keyof LocalSettings>,
  (value: LocalSettings[keyof LocalSettings]) => string
> = {
  defaultEmailAlias: (value) => value.toString(),
  hasSeenCustomDomainPage: (value) => value.toString(),
  hasSeenCustomDomainTrialOffer: (value) => value.toString(),
  hasSeenCalendar: (value) => value.toString(),
  calMobileBannerAppearances: (value) => value.toString(),
  hasSeenEssential: (value) => value.toString(),
  hasSeenAliasInboxes: (value) => value.toString(),
  introducingEmailModalShown: (value) => value.toString(),
  bottomDrawerState: (value) => value.toString(),
  uploadedDocIDs: (value) => JSON.stringify(value),
  timeZone: (value) => value.toString(),
  defaultCalendarColor: (value) => value.toString(),
  // Setting below value to uppercase for backwards compatibility with graphql enum update
  threadFormat: (value) => value.toString().toUpperCase(),
  hourFormat: (value) => value.toString(),
  dateFormat: (value) => value.toString(),
  showPageIcon: (value) => value.toString(),
  leftSwipeGesture: (value) => value.toString(),
  rightSwipeGesture: (value) => value.toString(),
  showAliasInboxes: (value) => value.toString(),
  [StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED]: (value) => value.toString(),
  startDayOfTheWeek: (value) => value.toString(),
  skemailMobileBannerAppearances: (value) => value.toString(),
  hasSeenActivationChecklist: (value) => value.toString()
};

export const LOCAL_SETTINGS_PARSERS: Record<keyof LocalSettings, (value: any) => LocalSettings[keyof LocalSettings]> = {
  defaultEmailAlias: (value) => value as LocalSettings['defaultEmailAlias'],
  hasSeenCustomDomainPage: (value) => value === 'true',
  hasSeenCustomDomainTrialOffer: (value) => value === 'true',
  hasSeenCalendar: (value) => value === 'true',
  calMobileBannerAppearances: (value) => parseInt(value as unknown as string),
  hasSeenEssential: (value) => value === 'true',
  hasSeenAliasInboxes: (value) => value === 'true',
  introducingEmailModalShown: (value) => value === 'true',
  bottomDrawerState: (value) => value as LocalSettings['bottomDrawerState'],
  uploadedDocIDs: (value) => JSON.parse(value as string) as LocalSettings['uploadedDocIDs'],
  timeZone: (value) => value as string,
  defaultCalendarColor: (value) => value as LocalSettings[StorageTypes.DEFAULT_CALENDAR_COLOR],
  // Setting below value to uppercase for backwards compatibility with graphql enum update
  threadFormat: (value) => (value as LocalSettings['threadFormat']).toUpperCase(),
  hourFormat: (value: string | null) => value as LocalSettings['hourFormat'],
  dateFormat: (value: string | null) => value as LocalSettings['dateFormat'],
  showPageIcon: (value: string | null) => value === 'true',
  leftSwipeGesture: (value) => value as LocalSettings['leftSwipeGesture'],
  rightSwipeGesture: (value) => value as LocalSettings['rightSwipeGesture'],
  [StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED]: (value: string) => value === 'true',
  startDayOfTheWeek: (value) => parseInt(value ?? '') as StartDayOfTheWeek,
  showAliasInboxes: (value) => value === 'true',
  skemailMobileBannerAppearances: (value) => parseInt(value as unknown as string),
  hasSeenActivationChecklist: (value) => value === 'true'
};

export enum UserPreferenceKey {
  THEME = StorageTypes.THEME,
  DEFAULT_CALENDAR_COLOR = StorageTypes.DEFAULT_CALENDAR_COLOR,
  START_DAY_OF_THE_WEEK = StorageTypes.START_DAY_OF_THE_WEEK,
  BLOCK_REMOTE_CONTENT = StorageTypes.BLOCK_REMOTE_CONTENT,
  DATE_FORMAT = StorageTypes.DATE_FORMAT,
  HOUR_FORMAT = StorageTypes.HOUR_FORMAT,
  LEFT_SWIPE_GESTURE = StorageTypes.LEFT_SWIPE_GESTURE,
  RIGHT_SWIPE_GESTURE = StorageTypes.RIGHT_SWIPE_GESTURE,
  SHOW_PAGE_ICON = StorageTypes.SHOW_PAGE_ICON,
  SECURED_BY_SKIFF_SIG_DISABLED = StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED,
  SHOW_ALIAS_INBOXES = StorageTypes.SHOW_ALIAS_INBOXES,
  THREAD_FORMAT = StorageTypes.THREAD_FORMAT,
  HIDE_ACTIVATION_CHECKLIST = 'hideActivationChecklist'
}

export const UserPreferenceKeys = Object.values(UserPreferenceKey) as UserPreferenceKey[];
