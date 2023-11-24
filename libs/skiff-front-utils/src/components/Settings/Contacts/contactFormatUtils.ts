import dayjs from 'dayjs';
import { Maybe } from 'skiff-graphql';
import { DateFormat, DateInputFormats } from '../../../constants';

export const getFormattedBirthdate = (dateString: Maybe<string>, dateFormat: DateFormat): dayjs.Dayjs | undefined => {
  const today = dayjs();

  if (!dateString) return today;

  const delimiter = dateFormat.includes('/') ? '/' : '-';

  let [part1, part2, part3] = dateString.split(delimiter).map((part) => part.trim());

  let year, month, day;

  // Assign year, month, day based on format
  if (dateFormat === DateInputFormats.YearMonthDay) {
    [year, month, day] = [part1, part2, part3];
  } else if (dateFormat === DateInputFormats.DayMonthYear) {
    [day, month, year] = [part1, part2, part3];
  } else if (dateFormat === DateInputFormats.MonthDayYear) {
    [month, day, year] = [part1, part2, part3];
  }

  // Pad month, day, or year if they don't meet the expected length
  if (month && month.length === 1) month = month.padStart(2, '0');
  if (day && day.length === 1) day = day.padStart(2, '0');
  if (year && year.length >= 1 && year.length <= 3) year = year.padStart(4, '0');

  // Ensure year is greater than 1900, otherwise use the current year
  if (year && parseInt(year, 10) <= 1900) {
    year = today.format('YYYY');
  }

  // Construct the date string based on format
  if (dateFormat === DateInputFormats.YearMonthDay) {
    dateString = [year, month, day].filter(Boolean).join(delimiter);
  } else if (dateFormat === DateInputFormats.DayMonthYear) {
    dateString = [day, month, year].filter(Boolean).join(delimiter);
  } else if (dateFormat === DateInputFormats.MonthDayYear) {
    dateString = [month, day, year].filter(Boolean).join(delimiter);
  }

  // If format expects a year and year is not completely provided, append the current year
  if (dateFormat.includes('YYYY') && !/\d{4}$/.test(dateString)) {
    dateString += delimiter + today.format('YYYY');
  }

  // If day is missing in YYYY-MM-DD format, insert current day
  if (dateFormat === DateInputFormats.YearMonthDay && !day) {
    dateString = year + delimiter + month + delimiter + today.format('DD');
  }

  const parsedDate = dayjs(dateString, dateFormat);
  if (parsedDate.isValid()) {
    return parsedDate;
  }

  return today;
};
