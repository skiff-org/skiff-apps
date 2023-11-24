import { timeZonesNames } from '@vvo/tzdb';

// https://day.js.org/docs/en/get-set/day
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  PriorSaturday = -1,
  PriorMonday = -6
}
export const VALID_START_DAYS_OF_WEEK = [DayOfWeek.Sunday, DayOfWeek.Saturday, DayOfWeek.Monday] as const;

export type StartDayOfTheWeek = (typeof VALID_START_DAYS_OF_WEEK)[number];

export const validTimeZones = [...timeZonesNames] as const;

export enum HourFormats {
  ShortOnlyHour = 'h',
  ShortOnlyFullHour = 'H',
  Short = 'h A',
  Medium = 'h:mm',
  MediumFull = 'H:mm', // 24 hour
  Long = 'h:mm A',
  Complete = 'h:mm A z' // time zone
}

export enum DayFormats {
  Short = 'ddd D',
  ShortName = 'ddd',
  ExtraShortName = 'dd',
  ShortDate = 'D'
}

export enum DateFormats {
  Normal = 'MMM DD',
  Long = 'dddd, MMM D',
  ShortWithYear = 'MMM D, YYYY',
  FullMonth = 'MMMM',
  FullYear = 'YYYY',
  AbbreviatedMonth = 'MMM'
}

export enum DateInputFormats {
  DayMonthYear = 'DD/MM/YYYY',
  MonthDayYear = 'MM/DD/YYYY',
  YearMonthDay = 'YYYY-MM-DD'
}

export const VerbalDayDateMonth = 'ddd D MMM';

export enum DateTimeFormats {
  DayAndMedTime = 'ddd, h:mm A',
  DayAndHourOnly = 'ddd, h',
  DayAndMedTimeShortFullHour = 'ddd, H:mm', // 24 hour
  DayAndFullHourOnly = 'ddd, H'
}

export type Formats = DayFormats | HourFormats | DateFormats | DateTimeFormats | DateInputFormats;

export enum HourFormatValue {
  Twelve = '12',
  TwentyFour = '24'
}

export enum ShortDateFormatValue {
  MonthDayYear = 'MM/DD',
  DayMonthYear = 'DD/MM',
  YearMonthDay = 'MM-DD'
}

export const ShortFormat = {
  [DateInputFormats.MonthDayYear]: ShortDateFormatValue.MonthDayYear,
  [DateInputFormats.DayMonthYear]: ShortDateFormatValue.DayMonthYear,
  [DateInputFormats.YearMonthDay]: ShortDateFormatValue.YearMonthDay
};

export const validDateFormats = [
  DateInputFormats.MonthDayYear,
  DateInputFormats.DayMonthYear,
  DateInputFormats.YearMonthDay
] as const;

export type DateFormat = (typeof validDateFormats)[number];

export const validHourFormats = [HourFormatValue.Twelve, HourFormatValue.TwentyFour] as const;
export type HourFormat = (typeof validHourFormats)[number];
