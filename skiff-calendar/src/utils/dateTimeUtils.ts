import dayjs, { Dayjs, PluginFunc } from 'dayjs';
import advanced from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import IsSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';
import { DayOfWeek, uniqueTimezones } from 'skiff-front-utils';
import { HourFormats, Formats } from 'skiff-front-utils';
import { isAllDay } from 'skiff-ics';

import {
  HOUR_HEIGHT,
  MOBILE_HEADING_CELL_CONTAINER_HEIGHT,
  MOBILE_TOP_BAR_Y_PADDING
} from '../constants/calendar.constants';
import {
  DATE_UNIT,
  DAYS_IN_WEEK,
  DAY_UNIT,
  DEFAULT_EVENT_DURATION,
  HALF_AN_HOUR_IN_MILLISECONDS,
  HOURS_IN_DAY,
  HOUR_UNIT,
  MINUTE_UNIT,
  MONTH_UNIT,
  MS_UNIT,
  ONE_HOUR_IN_MILLISECONDS,
  YEAR_UNIT
} from '../constants/time.constants';
import { DecryptedDraft } from '../storage/models/draft/types';
import { DecryptedEvent, UpdateEventArgs } from '../storage/models/event/types';

dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advanced);
dayjs.extend(IsSameOrBefore);
dayjs.extend(isBetween);

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

// Calculate correct date hour relative to timezone
export const calculateTrueHour = (date: Dayjs, timeZone: string) => {
  const localTimeZoneOffset = date.tz().utcOffset() / 60; // dayjs timezone offset in hours
  const userSelectedTimezoneOffset = (uniqueTimezones.find((tz) => tz.name === timeZone)?.rawOffsetInMinutes || 0) / 60; // user selected timezone offset in hours
  return (HOURS_IN_DAY - localTimeZoneOffset + userSelectedTimezoneOffset) % HOURS_IN_DAY;
};

export const hourToFormatString = (hour: number, format: HourFormats) =>
  dayjs().set('minute', 0).hour(hour).format(format);

export const dateToFormatString = (date: Dayjs, format: Formats | string) => date.format(format);

export const getTimeHeight = (time: number) => (time / ONE_HOUR_IN_MILLISECONDS) * HOUR_HEIGHT;

export const getHourTop = (time: Dayjs) => time.hour() * HOUR_HEIGHT + time.minute() * (HOUR_HEIGHT / 60);

export const getHourTopMobile = (time: Dayjs) =>
  getHourTop(time) - window.innerHeight / 2 + MOBILE_HEADING_CELL_CONTAINER_HEIGHT + MOBILE_TOP_BAR_Y_PADDING * 2;

export const getHourFromTop = (top: number) => top / HOUR_HEIGHT;

export const setMonthDateYear = (currentDate: Dayjs, newMonth: number, newDate: number, newYear: number) =>
  currentDate.set(MONTH_UNIT, newMonth).set(DATE_UNIT, newDate).set(YEAR_UNIT, newYear);

export const setMinuteHour = (currentDate: Dayjs, newMinute: number, newHour: number) =>
  currentDate.set(MINUTE_UNIT, newMinute).set(HOUR_UNIT, newHour);

export const getDefaultEndTime = (startTime: Dayjs) => startTime.add(DEFAULT_EVENT_DURATION, MINUTE_UNIT);

// Get new end time based on duration of existing event
export const getNewEndTime = (newStartTime: Dayjs, oldStartTime: Dayjs, oldEndTime: Dayjs) => {
  const eventDuration = oldEndTime.diff(oldStartTime);
  const newEndTime = newStartTime.add(eventDuration);
  return newEndTime;
};

export const getMonthDateYear = (time: Date) => {
  const currDate = dayjs(time);
  const month = currDate.month();
  const date = currDate.date();
  const year = currDate.year();
  return { month, date, year };
};

export const getMinuteHour = (time: Date | Dayjs) => {
  const currDate = dayjs(time);
  const minute = currDate.minute();
  const hour = currDate.hour();
  return { minute, hour };
};

export const getTimezoneMinuteHour = (time: Date | Dayjs) => {
  const timezoneDate = dayjs.tz(time);
  const minute = timezoneDate.minute();
  const hour = timezoneDate.hour();
  return { minute, hour };
};

export const getUserGuessedTimeZone = () => dayjs.tz.guess() ?? 'America/New_York';

export const getStartDateFromParsedICS = (startDate: Dayjs, endDate: Dayjs) => {
  const isAllDayEvent = isAllDay(startDate, endDate);
  // For all day events, convert to UTC as we do not want to factor in the timezone
  return isAllDayEvent ? startDate.utc(true).valueOf() : startDate.valueOf();
};

export const getEndDateFromParsedICS = (startDate: Dayjs, endDate: Dayjs) => {
  const isAllDayEvent = isAllDay(startDate, endDate);
  const endAndStartDateEqual = startDate.valueOf() === endDate.valueOf();

  // For all day events, convert to UTC as we do not want to factor in the timezone
  if (isAllDayEvent) {
    // some calendars set the end day of all-day events as the exact time as the start - so we need to make it take the whole day
    if (endAndStartDateEqual) return startDate.utc(true).add(1, DAY_UNIT).subtract(1, MINUTE_UNIT).valueOf();
    // some calendars set the end day of all-day events as the start of the next day,
    // so we need to trim it to make sure it will take only one day
    return endDate.utc(true).subtract(1, HOUR_UNIT).endOf(DATE_UNIT).valueOf();
  }
  return endDate.valueOf();
};

/**
 * Given a selected date and current time in day, get the selected date with time rounded to the next half hour of the current time
 */
export const getStartDateWithRoundedTime = (selectedDate: Dayjs, currentTime: Dayjs) => {
  // Set current time
  const selectedDateWithCurrentTime = selectedDate
    .set(HOUR_UNIT, currentTime.hour())
    .set(MINUTE_UNIT, currentTime.minute());
  // Round time to the next half hour
  const selectedDateWithRoundedTime: Dayjs = dayjs(
    new Date(
      Math.ceil(selectedDateWithCurrentTime.valueOf() / HALF_AN_HOUR_IN_MILLISECONDS) * HALF_AN_HOUR_IN_MILLISECONDS
    )
  );
  return selectedDateWithRoundedTime;
};

export const hasStartTimeChanged = (originalEvent: DecryptedEvent | DecryptedDraft, newDetails: UpdateEventArgs) => {
  return (
    (newDetails.plainContent?.startDate &&
      !dayjs(newDetails.plainContent.startDate).isSame(originalEvent.plainContent.startDate)) ||
    (newDetails?.decryptedContent?.isAllDay !== undefined &&
      newDetails.decryptedContent.isAllDay !== originalEvent.decryptedContent.isAllDay)
  );
};

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

  return { weekStartDate: firstDay, weekEndDate: lastDay };
};

/**
 * Given a Dayjs date, gets the start of the date and converts just the timezone to UTC
 * For example, given 2023-05-02T16:15:00-07:00, it will convert it to 2023-05-02T00:00:00Z
 */
export const getStartOfDateInUTC = (date: Dayjs) => date.startOf(DATE_UNIT).utc(true);

/**
 * Given a unix timestamp, converts it to a Dayjs date in UTC, and then returns the start of that date.
 * This can be used to convert the startDate of all day events to a Dayjs object, since
 * all day events should always be interpreted as UTC.
 */
export const unixDateToStartOfDateInUTC = (unixTimestamp: number | Date) => dayjs.utc(unixTimestamp).startOf(DATE_UNIT);
