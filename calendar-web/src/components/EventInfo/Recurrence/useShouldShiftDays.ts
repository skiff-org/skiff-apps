import { Dayjs } from 'dayjs';
import { RecurrenceDay } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { DAY_UNIT } from '../../../constants/time.constants';
import { useLocalSetting } from '../../../utils';

import { RECURRENCE_DAYS_ORDERED } from './constants';

/**
 * We are saving the RRule using timezone, but the byDays are displayed using the user's timezone (and not the event's timezone)
 * We need to make sure that the byDays of the displayed startDate match the byDays of the saved RRule
 * And if not we need to shift the byDays by one day
 *
 * @returns the number of days to shift the byDays
 */
export const useByDaysShift = (startDate?: Dayjs, recurrenceTZ?: string) => {
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);

  if (!startDate || !recurrenceTZ) return 0;

  // Convert the given date to the user's preferred timezone
  // Normalize both dates to the start of their respective days in order to compare the days regardless of their time zones
  const userStartDate = startDate.tz(userPreferredTimezone).startOf(DAY_UNIT);

  // Convert the original start date to the recurrence timezone
  const recurrenceStartDate = startDate.tz(recurrenceTZ).startOf(DAY_UNIT);

  // Check if the converted date is a day before or after the original date
  const isBefore = userStartDate.isBefore(recurrenceStartDate, DAY_UNIT);
  const isAfter = userStartDate.isAfter(recurrenceStartDate, DAY_UNIT);

  // Return -1 if it's a day before, 1 if it's a day after, 0 otherwise
  if (isBefore) {
    return -1;
  } else if (isAfter) {
    return 1;
  } else {
    return 0;
  }
};

export const shiftDays = (days: RecurrenceDay[], amount: number) => {
  return days.map(
    (day) => RECURRENCE_DAYS_ORDERED[(RECURRENCE_DAYS_ORDERED.indexOf(day) + amount) % RECURRENCE_DAYS_ORDERED.length]
  );
};
