import dayjs, { Dayjs } from 'dayjs';
import { EventReminder, EventReminderTimeUnit } from 'skiff-graphql';

import { DAY_UNIT, HOUR_UNIT, MINUTES_IN_HOUR } from './constants';

/**
 * Return if a parsed event should be marked as all day.
 */
export const isAllDay = (start: Dayjs, end: Dayjs) => {
  const startEndDiff = end.diff(start, 'day', true);
  const isWholeDays = startEndDiff === 0 || startEndDiff % 1 === 0;

  const startHour = start.hour();
  const startMinute = start.minute();
  const startsAtMidnight = startHour === 0 && startMinute === 0;

  return isWholeDays && startsAtMidnight;
};

/**
 * Return if a parsed event should be marked as all day given the start & end date objects
 */
export const isAllDayFromDate = (start: Date, end: Date) => {
  return isAllDay(dayjs(start, { utc: true }), dayjs(end, { utc: true }));
};

export const getOrdinalSuffix = (ordinal: number) => {
  switch (ordinal) {
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

/**
 * Converts reminder time to UTC.
 * @param {EventReminder} reminder - The reminder object with local time.
 * @param {string} userTimezone - The user's local timezone.
 * @returns {EventReminder} - The reminder with time converted to UTC.
 */

export const convertReminderToUTC = (reminder: EventReminder, userTimezone: string): EventReminder => {
  let adjustedTimeValue = reminder.timeValue;
  let adjustedTimeUnit = reminder.timeUnit;

  const customTimeUserTimezone = reminder.timeForAllDay ?? '';
  const [hours, minutes] = customTimeUserTimezone.split(':').map(Number);

  // A dayjs (date doesn't matter) with the reminder custom time
  // If for some reason hours/minutes are undefined we fallback to the default which is 9am
  const localTime = dayjs()
    .tz(userTimezone)
    .hour(hours ?? 9)
    .minute(minutes ?? 0);
  // Get hours difference between UTC and user's timezone
  const differenceInHours = -localTime.utcOffset() / MINUTES_IN_HOUR;
  // Reminder custom time in UTC
  const customTimeUTC = localTime.add(differenceInHours, HOUR_UNIT);
  // Check if the day has changed after conversion to the local timezone
  // If it did this means the custom time is now in a day before or after the original day
  const dayDifference = localTime.get(DAY_UNIT) - customTimeUTC.get(DAY_UNIT);

  // Adjust timeValue if crossing over to a different day
  // Check if the day has changed after conversion to UTC
  if (dayDifference !== 0) {
    if (reminder.timeUnit === EventReminderTimeUnit.Day) {
      // For day unit we just adjust the value
      adjustedTimeValue = reminder.timeValue + dayDifference;
    } else if (reminder.timeUnit === EventReminderTimeUnit.Week) {
      // For week unit we calculate new value in days
      adjustedTimeValue = reminder.timeValue * 7 + dayDifference;
      adjustedTimeUnit = EventReminderTimeUnit.Day;
    }
  }

  return {
    ...reminder,
    timeValue: adjustedTimeValue,
    timeUnit: adjustedTimeUnit,
    timeForAllDay: customTimeUTC.format('HH:mm')
  };
};
