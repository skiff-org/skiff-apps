import dayjs from 'dayjs';
import { HourFormatValue, HourFormats } from 'skiff-front-utils';

/**
 * This function returns the correct time format for the event by doing the following:
 * - Removing the AM/PM if the start date is on the same date as the end date
 * - Removes the minutes if the time ends on the hour
 */
export const abbreviateHourFormat = (
  date: number,
  selectedHourFormat: HourFormats,
  timezone?: string,
  endDate?: number,
  userHourFormat?: HourFormatValue
): HourFormats => {
  const dayjsObj = dayjs(date).tz(timezone);
  const minute = dayjsObj.minute();
  const hour = dayjsObj.hour();
  const sameMeridianDay =
    !!endDate &&
    ((dayjs(endDate).tz(timezone).hour() < 12 && hour < 12) ||
      (dayjs(endDate).tz(timezone).hour() >= 12 && hour >= 12));

  // if both times are AM or PM, only show meridian on second time
  const noMeridian = selectedHourFormat.replace(' A', '') as HourFormats;
  const displayFormat = sameMeridianDay ? noMeridian : selectedHourFormat;
  if (minute === 0 && userHourFormat === HourFormatValue.Twelve) {
    // omit minutes if time ends on the hour and 12 hour time
    return displayFormat.replace(':mm', '') as HourFormats;
  }
  return displayFormat;
};
