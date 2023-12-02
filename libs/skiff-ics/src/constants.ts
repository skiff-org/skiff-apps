import { CalendarMethodTypes } from './types';

export const ICAL_COMPANY = 'Skiff';
export const ICAL_PRODUCT = 'Skiff Calendar';
export const ICAL_LANGUAGE = 'EN';
const joinedMethods = Object.values(CalendarMethodTypes).join('|');
export const METHOD_REGEX_PATTERN = `METHOD:(${joinedMethods})`;
export const GMT_TZID_PATTERN = 'GMT[+-]\\d{4}';

export const CONFERENCE_KEY = 'X-SKIFF-MEET';

// Time constants
export const SECONDS_IN_MIN = 60;
export const MINUTES_IN_HOUR = 60;
export const DEFAULT_ALL_DAY_REMINDER_HOURS_BEFORE = 15;
export const DEFAULT_TIMED_REMINDER_MINS_BEFORE = 10;

export const HOUR_UNIT = 'hour';
export const DAY_UNIT = 'day';
export const DAYS_IN_WEEK = 'week';
