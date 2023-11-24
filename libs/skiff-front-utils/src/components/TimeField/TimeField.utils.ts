import { Dayjs } from 'dayjs';

import { Formats, HourFormat, HourFormatValue, HourFormats } from '../../constants';
import { TwelveHourPeriod } from '../../types';

export const hourFormatParser = (hourFormat: HourFormat, isShortFormat?: boolean): HourFormats => {
  if (hourFormat === HourFormatValue.Twelve) {
    return isShortFormat ? HourFormats.Short : HourFormats.Long;
  }
  return HourFormats.MediumFull;
};

export const dateToFormatString = (date: Dayjs, format: Formats | string) => date.format(format);

/** Returns the first <= 4 integers in the given time string */
export const getCustomTimeHoursAndMinutes = (time: string) => {
  let parsedTime = '';
  let colonFound = false;
  // We iterate 5 times in case there's a colon
  for (let i = 0; i < 5; i += 1) {
    const el = time.charAt(i);
    if (!isNaN(parseInt(el)) || el === ':') {
      parsedTime += el;
      if (el === ':' && !colonFound) colonFound = true;
    }
    if (!colonFound && parsedTime.length === 4) break;
  }

  return parsedTime;
};

/** Adds a colon to the mid-point of the string and returns it */
export const addMissingColon = (timeWithoutColon: string) => {
  // Do nothing if the given time string is empty
  if (!timeWithoutColon.length) return timeWithoutColon;

  if (timeWithoutColon.length <= 2) {
    // If the time string is of length 1 or 2, we assume the user entered a 1 or 2-digit hour value,
    // so we add trailing zeroes for each hour digit entered
    timeWithoutColon += '0'.repeat(timeWithoutColon.length);
  } else if (timeWithoutColon.length <= 3) {
    // If the time string is of length 3, we assume the user entered a 2-digit hour value and a 1-digit minute value,
    // so we add a leading 0 to the minute value
    timeWithoutColon = timeWithoutColon.substring(0, 2) + '0' + timeWithoutColon.substring(2);
  }

  // The colon is added to the mid-point of the string
  const colonIndex = timeWithoutColon.length / 2;
  const hours = timeWithoutColon.slice(0, colonIndex);
  const minutes = timeWithoutColon.slice(colonIndex);
  return hours + ':' + minutes;
};

/** Returns the last <= 2 non-integer characters in the time string which correspond to AM / PM */
export const getExistingCustomTimeXM = (time: string) => {
  let xm = '';
  const xValue = time.charAt(time.length - 2);
  const mValue = time.charAt(time.length - 1);
  if (isNaN(parseInt(xValue)) && xValue !== ' ') xm += xValue;
  if (isNaN(parseInt(mValue))) xm += mValue;
  return xm;
};

/** Gets the correct AM / PM value that should be added to the end of the time string */
export const getMissingCustomTimeXM = (xm: string, hoursAndMinutes: string, initialTime?: Dayjs) => {
  if (xm.length === 1 && (xm === 'A' || xm === 'P')) {
    // If AM / PM is incomplete (user only entered A or P)
    // Auto-add missing M
    return xm + 'M';
  } else {
    // If AM / PM does not exist in the time string, derive XM from the initial time
    const newTimeArr = hoursAndMinutes.split(':');
    const [newTimeHour, newTimeMinute] = [parseInt(newTimeArr[0]), parseInt(newTimeArr[1])];

    // Even though we're in 12-hour format, the user can still input the time in 24-hour format
    // Hour 0 should always be AM
    if (newTimeHour === 0) return TwelveHourPeriod.AM;

    // Default initial time hour / minute / XM values
    let [initialTimeHour, initialTimeMinute, initialTimeXM] = [12, 0, TwelveHourPeriod.AM];

    if (!!initialTime && newTimeHour <= 12) {
      // If the user entered the time in 12-hour format,
      // convert the initial time into 12-hour format
      const formattedInitialTime = dateToFormatString(initialTime, HourFormats.Long);
      const initialTimeArr = getCustomTimeHoursAndMinutes(formattedInitialTime).split(':');
      [initialTimeHour, initialTimeMinute, initialTimeXM] = [
        parseInt(initialTimeArr[0] ?? '0'),
        parseInt(initialTimeArr[1] ?? '0'),
        getExistingCustomTimeXM(formattedInitialTime) as TwelveHourPeriod
      ];
    } else if (!!initialTime && newTimeHour > 12) {
      // If the user entered the time in 24-hour format,
      // keep the initial time as it is
      [initialTimeHour, initialTimeMinute, initialTimeXM] = [
        initialTime.hour(),
        initialTime.minute(),
        initialTime.hour() < 12 ? TwelveHourPeriod.AM : TwelveHourPeriod.PM
      ];
    }

    // Switch the initial time's XM if the new time is 12 and the initial time is either not 12
    // or is 12 but its minutes precede the new time's minutes.
    // eg. if the initial time is 10 AM and the user entered "12", it should return PM for "12 PM"
    // We also switch if the new time is smaller than the initial time
    // eg. if the initial time is 10 AM and the user entered "1", it should return PM for "1 PM"
    const shouldSwitchXM =
      (newTimeHour === 12 && (initialTimeHour !== 12 || newTimeMinute < initialTimeMinute)) || // If new time is at noon or midnight
      (newTimeHour < initialTimeHour && initialTimeHour !== 12) ||
      (newTimeHour === initialTimeHour && newTimeMinute < initialTimeMinute);

    return shouldSwitchXM
      ? initialTimeXM === TwelveHourPeriod.AM
        ? TwelveHourPeriod.PM
        : TwelveHourPeriod.AM
      : initialTimeXM;
  }
};

/**
 * Parses the user-entered custom time string by:
 * - Auto-adding missing colons
 * - Auto-adding / Auto-completing missing AM / PM for 12-hour time formats
 * - Auto-adding a space between the hours and minutes and AM / PM for 12-hour time formats
 * @param {string} customTime custom time entered by the user
 * @param {HourFromats} hourFormat user-selected hour format
 * @param {Dayjs | undefined} initialTime user-selected start time
 * @returns {string} The parsed custom time in string format
 */
export const parseCustomTime = (customTime: string, hourFormat: HourFormats, initialTime?: Dayjs): string => {
  const time = customTime.trim().toUpperCase();
  // Get the hours and minutes section of the time string
  let hoursAndMinutes = getCustomTimeHoursAndMinutes(time);
  // If time is in the 12h format, get the AM / PM section of the time string
  let xm = hourFormat === HourFormats.Long ? getExistingCustomTimeXM(time) : undefined;

  // Auto-add colon if it's missing
  const isColonMissing = !time.includes(':');
  if (isColonMissing) hoursAndMinutes = addMissingColon(hoursAndMinutes);

  // XM is only defined if time is in the 12h format
  if (xm !== undefined) {
    // Get the correct AM / PM value if it's missing or incomplete
    const isXmMissing = xm !== TwelveHourPeriod.AM && xm !== TwelveHourPeriod.PM;
    if (isXmMissing) xm = getMissingCustomTimeXM(xm, hoursAndMinutes, initialTime);
  }

  return `${hoursAndMinutes}${xm ? ` ${xm}` : ''}`;
};
