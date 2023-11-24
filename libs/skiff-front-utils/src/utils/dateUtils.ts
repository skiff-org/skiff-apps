import dayjs, { Dayjs, PluginFunc } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import IsSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

import { uniqueTimezones } from '../components/TimeZonePicker';
import { DayOfWeek } from '../constants/dateTime.constants';
import { DAYS_IN_WEEK, DAY_UNIT, HOURS_IN_DAY, HOUR_UNIT, MINUTE_UNIT, MS_UNIT } from '../constants/time.constants';

dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(IsSameOrBefore);
dayjs.extend(isBetween);

/*
 * Renders a date in a "Jan. 31, 2023" style format
 */
export const renderDate = (date: Date) => {
  return dayjs(date).format('MMM. D, YYYY');
};

/*
 * Returns a boolean that indicates if 2 dates are equal or not
 */
export const isSameDate = (firstDate: Dayjs, secondDate: Dayjs) => {
  return (
    firstDate.year() === secondDate.year() &&
    firstDate.month() === secondDate.month() &&
    firstDate.date() === secondDate.date()
  );
};

/**
 * There is bug in dayjs when modifying dayjs instance on timezone GTM+00:00 it corrupts the dayjs instance
 * (see https://github.com/iamkun/dayjs/issues/2126)
 *
 * this fix is copied from a pr that fixes this bug (https://github.com/iamkun/dayjs/pull/2118)
 */
const tempTimezonePluginFix: PluginFunc = (_options, dayjsClass, dayjsFactory) => {
  dayjsClass.prototype.tz = function (tzone?: string | undefined, keepLocalTime?: boolean | undefined) {
    const oldOffset = this.utcOffset();
    const date = this.toDate();
    const target = date.toLocaleString('en-US', { timeZone: tzone });
    const diff = Math.round((date.getTime() - new Date(target).getTime()) / 1000 / 60);

    const offset = -date.getTimezoneOffset() - diff;
    if (offset === 0) {
      return this.utc(keepLocalTime);
    }

    let ins: Dayjs & { $x?: { timezone?: string } } = (
      dayjsFactory(target) as Dayjs & { $set: (unit: string, value: number) => Dayjs }
    )
      .$set(MS_UNIT, (this as Dayjs & { $ms: number }).$ms)
      .utcOffset(offset, true);

    if (keepLocalTime) {
      const newOffset = ins.utcOffset();
      ins = ins.add(oldOffset - newOffset, MINUTE_UNIT);
    }

    (ins as Dayjs & { $x: { $timezone?: string } }).$x.$timezone = tzone;
    return ins;
  };
};

// TODO: remove this and bump to the new version when it's merged - https://linear.app/skiff/issue/PROD-2112/remove-dayjs-patch-and-bump-version
dayjs.extend(tempTimezonePluginFix);

export { dayjs };

export const getUserGuessedTimeZone = () => dayjs.tz.guess();

// TODO: Dedupe when dayjs versions are synced across projects

/** Calculate correct date hour relative to timezone */
export const calculateTrueHour = (date: Dayjs, timeZone: string) => {
  const localTimeZoneOffset = date.tz().utcOffset() / 60; // dayjs timezone offset in hours
  const userSelectedTimezoneOffset = (uniqueTimezones.find((tz) => tz.name === timeZone)?.rawOffsetInMinutes || 0) / 60; // user selected timezone offset in hours
  return (HOURS_IN_DAY - localTimeZoneOffset + userSelectedTimezoneOffset) % HOURS_IN_DAY;
};

export const setMinuteHour = (currentDate: Dayjs, newMinute: number, newHour: number) =>
  currentDate.set(MINUTE_UNIT, newMinute).set(HOUR_UNIT, newHour);

/**
 * Given a date and a week start day, get the start and end dates for that week.
 * @param selectedDate The date that we're getting the wrapping week for.
 * @param localStartDay Start day stored in LocalStorage
 * @returns {{ weekStartDate: Dayjs, weekEndDate: Dayjs}} Start and End dates
 */
export const getWeekStartAndEndDates = (
  selectedDate: Dayjs,
  localStartDay: DayOfWeek,
  timeZone: string
): { weekStartDate: Dayjs; weekEndDate: Dayjs } => {
  // If the user's local start day is Saturday
  // but the selected date is not Saturday, we'll want to get the Saturday BEFORE (-1)
  const usersLocalStartDayIsSaturday = localStartDay === DayOfWeek.Saturday;
  const selectedDayIsSaturday = selectedDate.day() === DayOfWeek.Saturday;

  const usersLocalStartDayIsMonday = localStartDay === DayOfWeek.Monday;
  const selectedDayIsSunday = selectedDate.day() === DayOfWeek.Sunday;

  // -1: represents the saturday before
  //  6: represents the saturday ahead
  let userStartDay = localStartDay;
  if (usersLocalStartDayIsSaturday && !selectedDayIsSaturday) userStartDay = DayOfWeek.PriorSaturday;
  else if (usersLocalStartDayIsMonday && selectedDayIsSunday) userStartDay = DayOfWeek.PriorMonday;

  const firstDay = selectedDate.weekday(userStartDay);

  // Clear time on first day so it starts at the true beginning of the day
  const hour = calculateTrueHour(firstDay, timeZone);
  const firstDayWithClearedTime = setMinuteHour(firstDay, 0, hour);
  // Add a week minus 1 to get end day in current week
  const lastDay = firstDayWithClearedTime.add(DAYS_IN_WEEK - 1, DAY_UNIT).endOf(DAY_UNIT);

  return { weekStartDate: firstDayWithClearedTime, weekEndDate: lastDay };
};
