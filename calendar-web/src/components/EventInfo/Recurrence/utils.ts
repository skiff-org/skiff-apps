import { Dayjs } from 'dayjs';
import { RecurrenceFrequency } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { StorageTypes } from 'skiff-utils';

import { DAY_UNIT, MONTH_UNIT, YEAR_UNIT } from '../../../constants/time.constants';
import { getLocalSettingCurrentValue } from '../../../utils/hooks/useLocalSetting';

import { RECURRENCE_DAYS_ORDERED } from './constants';

const getMonthlyDatePrefix = (date: Dayjs) => {
  switch (date.date() % 10) {
    case 1: {
      return 'st';
    }
    case 2: {
      return 'nd';
    }
    case 3: {
      return 'rd';
    }
    default: {
      return 'th';
    }
  }
};

export const generateRepeatLabel = (date: Dayjs, frequency?: RecurrenceFrequency) => {
  switch (frequency) {
    case RecurrenceFrequency.Weekly: {
      return `on ${date.format('ddd')}`;
    }
    case RecurrenceFrequency.Monthly: {
      return `on the ${date.format('D')}${getMonthlyDatePrefix(date)}`;
    }
    case RecurrenceFrequency.Yearly: {
      return `on ${date.format('MMM D')}`;
    }
    default: {
      return '';
    }
  }
};

export const createRRuleForFrequency = (date: Dayjs, frequency: RecurrenceFrequency, isAllDay: boolean) => {
  const timezone = getLocalSettingCurrentValue(StorageTypes.TIME_ZONE);
  return new RecurrenceRule({
    frequency,
    startDate: date.valueOf(),
    // dayjs will always return sunday as 0, monday 1...
    // We are using UTC to get the day of the week, because the RRule is saved using UTC and we want the byDays to match the startTime
    byDays:
      frequency === RecurrenceFrequency.Weekly ? [RECURRENCE_DAYS_ORDERED[date.utc(true).get(DAY_UNIT)]] : undefined,
    timezone,
    isAllDay
  });
};

export const isCustomRRule = (rrule?: RecurrenceRule | null) => {
  if (!rrule) return false;
  return !!(rrule.count || rrule.interval || rrule.until || (rrule.byDays?.length && rrule.byDays.length > 1));
};

const WEEK_DAYS_REGEX =
  /(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?=(,|\.|\s|$))/gi; // match the days only if they are followed by space | , | .
const MONTHS_NAMES_REGEX =
  /(January|Jan|February|Feb|March|Mar|April|Apr|May|June|Jun|July|Jul|August|Aug|Apr|September|Sep|Sept|October|Oct|November|Nov|December|Dec)(?=(,|\.|\s))/gi; // match the months only if they are followed by space | , | .

const SHORT_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const LONG_WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const toTitle = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

/**
 * This function will shift the week days by 1 if the start date and timezones make this necessary
 */
const shiftWeekDays = (byDaysShift: number) => (weekDay: string) => {
  if (weekDay.length > 3) return LONG_WEEKDAYS[(LONG_WEEKDAYS.indexOf(weekDay.toLowerCase()) + byDaysShift) % 7];
  else return SHORT_WEEKDAYS[(SHORT_WEEKDAYS.indexOf(weekDay.toLowerCase()) + byDaysShift) % 7];
};

export const formatRecurrenceRuleText = (text: string, byDaysShift: number) =>
  toTitle(text.toLowerCase())
    .replace(WEEK_DAYS_REGEX, shiftWeekDays(byDaysShift))
    .replace(WEEK_DAYS_REGEX, toTitle)
    .replace(MONTHS_NAMES_REGEX, toTitle);

export const getRecurrenceButtonTitle = (rrule: RecurrenceRule) =>
  toTitle(isCustomRRule(rrule) ? 'Custom' : rrule.frequency);

export const getDefaultRecurringEndDate = (startDate: Dayjs, frequency: RecurrenceFrequency) => {
  switch (frequency) {
    case RecurrenceFrequency.Daily:
      return startDate.add(1, MONTH_UNIT).valueOf();
    case RecurrenceFrequency.Weekly:
      return startDate.add(3, MONTH_UNIT).valueOf();
    case RecurrenceFrequency.Monthly:
      return startDate.add(1, YEAR_UNIT).valueOf();
    case RecurrenceFrequency.Yearly:
      return startDate.add(6, YEAR_UNIT).valueOf();
    default:
      return startDate.valueOf();
  }
};
