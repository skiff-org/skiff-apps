import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);

/*
 * Returns date in format like 'April 1st'
 */
export const dateToMonthAndOrdinalDay = (date: Date) => {
  return dayjs(date).format('MMMM Do');
};

/*
 * Convert date object to an ISO format string (UTC)
 */
export const dateToString = (date: Date): string => date.toISOString();

/*
 * Returns date in future by numDays. Date object incorporates daylight savings time.
 */
export const getFutureDate = (numDays: number): Date => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + numDays);
  return futureDate;
};

export const daysToMilliseconds = (numDays: number) => {
  return numDays * 24 * 60 * 60 * 1000;
};
