import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ICalEventRepeatingFreq, ICalRepeatingOptions, ICalWeekday } from 'ical-generator';
import * as t from 'io-ts';
import { Frequency, RRule, Weekday } from 'rrule';
import {
  RecurrenceFrequency,
  RecurrenceRuleInput as gql_RecurrenceRuleInput,
  RecurrenceRule as gql_RecurrenceRule,
  RecurrenceDay
} from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import { ExtendedCalendarComponent } from './types';
import { getOrdinalSuffix } from './utils';

dayjs.extend(utc);
dayjs.extend(tz);

export const MAX_RECURRENCE_COUNT = 1000;
export const DATE_UNIT = 'date';

/**
 * all-day events need to be always normalized to UTC, to be consistent across all time zones.
 * @param unix
 * @returns
 */
const toUTC = (unix: number) => dayjs.utc(unix).startOf(DATE_UNIT).valueOf();

// https://github.com/jakubroztocil/rrule/issues/556#issuecomment-1264585649
const toRRuleInput = (date: Date, rruleTZ?: string): Date => {
  const tzDate = dayjs(date).tz(rruleTZ);
  /**
   * Handle old events (without timezone) the same way we did
   *
   * For old Events (without timezone):
   *   date.getTimezoneOffset() <- This changes based on the timezone of the *USER*
   *
   * For new Events (with timezone):
   *   -tzDate.utcOffset()      <- This changes based on the timezone of the *RULE*
   */
  const tzOffset = !rruleTZ ? date.getTimezoneOffset() : -tzDate.utcOffset();
  return new Date(date.getTime() - tzOffset * 60 * 1000);
};

const fromRRuleOutput = (date: Date, rruleTZ?: string): Date => {
  const tzDate = dayjs(date).tz(rruleTZ);
  // Handle old events (without timezone) the same way we did
  const tzOffset = !rruleTZ ? date.getTimezoneOffset() : -tzDate.utcOffset();
  return new Date(date.getTime() + tzOffset * 60 * 1000);
};
/**
 * ========================================================
 *                    ENCODING UTILS
 * ========================================================
 */

const fromRRuleFreqToGQL = (freq: Frequency | undefined): RecurrenceFrequency => {
  switch (freq) {
    case Frequency.DAILY:
      return RecurrenceFrequency.Daily;
    case Frequency.HOURLY:
      return RecurrenceFrequency.Hourly;
    case Frequency.MINUTELY:
      return RecurrenceFrequency.Minutely;
    case Frequency.MONTHLY:
      return RecurrenceFrequency.Monthly;
    case Frequency.SECONDLY:
      return RecurrenceFrequency.Secondly;
    case Frequency.WEEKLY:
      return RecurrenceFrequency.Weekly;
    case Frequency.YEARLY:
      return RecurrenceFrequency.Yearly;
    default:
      return RecurrenceFrequency.Daily;
  }
};

const fromGQLFreqToRRule = (freq: RecurrenceFrequency): Frequency => {
  switch (freq) {
    case RecurrenceFrequency.Daily:
      return Frequency.DAILY;
    case RecurrenceFrequency.Hourly:
      return Frequency.HOURLY;
    case RecurrenceFrequency.Minutely:
      return Frequency.MINUTELY;
    case RecurrenceFrequency.Monthly:
      return Frequency.MONTHLY;
    case RecurrenceFrequency.Secondly:
      return Frequency.SECONDLY;
    case RecurrenceFrequency.Weekly:
      return Frequency.WEEKLY;
    case RecurrenceFrequency.Yearly:
      return Frequency.YEARLY;
    default:
      return Frequency.DAILY;
  }
};

const fromGQLFreqToICal = (freq: RecurrenceFrequency): ICalEventRepeatingFreq => {
  switch (freq) {
    case RecurrenceFrequency.Daily:
      return ICalEventRepeatingFreq.DAILY;
    case RecurrenceFrequency.Hourly:
      return ICalEventRepeatingFreq.HOURLY;
    case RecurrenceFrequency.Minutely:
      return ICalEventRepeatingFreq.MINUTELY;
    case RecurrenceFrequency.Monthly:
      return ICalEventRepeatingFreq.MONTHLY;
    case RecurrenceFrequency.Secondly:
      return ICalEventRepeatingFreq.SECONDLY;
    case RecurrenceFrequency.Weekly:
      return ICalEventRepeatingFreq.WEEKLY;
    case RecurrenceFrequency.Yearly:
      return ICalEventRepeatingFreq.YEARLY;
    default:
      return ICalEventRepeatingFreq.DAILY;
  }
};

const fromRRuleDaysToGQL = (days: number[] | undefined): RecurrenceDay[] => {
  return (days || [])
    .map(
      (day) =>
        [
          RecurrenceDay.Monday,
          RecurrenceDay.Tuesday,
          RecurrenceDay.Wednesday,
          RecurrenceDay.Thursday,
          RecurrenceDay.Friday,
          RecurrenceDay.Saturday,
          RecurrenceDay.Sunday
        ][day]
    )
    .filter(filterExists);
};

const fromGQLDaysToRRule = (days: RecurrenceDay[] | undefined): Weekday[] | undefined => {
  if (!days || days.length === 0) return undefined;
  return days.map((day) => {
    switch (day) {
      case RecurrenceDay.Sunday:
        return RRule.SU;
      case RecurrenceDay.Monday:
        return RRule.MO;
      case RecurrenceDay.Tuesday:
        return RRule.TU;
      case RecurrenceDay.Wednesday:
        return RRule.WE;
      case RecurrenceDay.Thursday:
        return RRule.TH;
      case RecurrenceDay.Friday:
        return RRule.FR;
      case RecurrenceDay.Saturday:
        return RRule.SA;
      default:
        return RRule.SU;
    }
  });
};

const fromGQLDaysToICal = (days: RecurrenceDay[] | undefined): ICalWeekday[] | undefined => {
  if (!days || days.length === 0) return undefined;
  return days.map((day) => {
    switch (day) {
      case RecurrenceDay.Sunday:
        return ICalWeekday.SU;
      case RecurrenceDay.Monday:
        return ICalWeekday.MO;
      case RecurrenceDay.Tuesday:
        return ICalWeekday.TU;
      case RecurrenceDay.Wednesday:
        return ICalWeekday.WE;
      case RecurrenceDay.Thursday:
        return ICalWeekday.TH;
      case RecurrenceDay.Friday:
        return ICalWeekday.FR;
      case RecurrenceDay.Saturday:
        return ICalWeekday.SA;
      default:
        return ICalWeekday.SU;
    }
  });
};

/**
 * ========================================================
 *   io-ts defs, used for validation and type checking
 * ========================================================
 */

const RecurrenceRuleFrequency = t.union([
  t.literal(RecurrenceFrequency.Yearly),
  t.literal(RecurrenceFrequency.Monthly),
  t.literal(RecurrenceFrequency.Weekly),
  t.literal(RecurrenceFrequency.Daily),
  t.literal(RecurrenceFrequency.Hourly),
  t.literal(RecurrenceFrequency.Minutely),
  t.literal(RecurrenceFrequency.Secondly)
]);

const RecurrenceRuleDay = t.union([
  t.literal(RecurrenceDay.Sunday),
  t.literal(RecurrenceDay.Monday),
  t.literal(RecurrenceDay.Tuesday),
  t.literal(RecurrenceDay.Wednesday),
  t.literal(RecurrenceDay.Thursday),
  t.literal(RecurrenceDay.Friday),
  t.literal(RecurrenceDay.Saturday)
]);

const RecurrenceRuleDef = t.intersection([
  t.type({
    frequency: RecurrenceRuleFrequency,
    startDate: t.number
  }),
  t.partial({
    timezone: t.string,
    interval: t.number,
    count: t.number,
    until: t.number,
    byDays: t.array(RecurrenceRuleDay),
    byMonth: t.array(t.number),
    bySetPos: t.array(t.number),
    excludeDates: t.array(t.number),
    isAllDay: t.boolean
  })
]);

/**
 * This class represents a recurrence rule for an event.
 *
 *  3 main purposes:
 *
 *  - Unified recurrenceRule interface for the frontend and backend to use.
 *
 *  - It is used to generate and validate JSON string that represents a recurrence rule.
 *  We are using this in the backend when saving to prisma JSONB and in the frontend when saving to the dexie.
 *
 *  - Parsing and generating rrule string for ics (external communication).
 */

export class RecurrenceRule implements t.TypeOf<typeof RecurrenceRuleDef> {
  frequency: RecurrenceFrequency;

  startDate: number;

  // Optional for backwards compatibility
  timezone?: string;

  interval?: number;

  count?: number;

  until?: number;

  byDays?: RecurrenceDay[];

  bySetPos?: number[];

  byMonth?: number[];

  excludeDates?: number[];

  isAllDay?: boolean;

  constructor(args: {
    frequency: RecurrenceFrequency;
    startDate: number;
    interval?: number | null;
    count?: number | null;
    until?: number | null;
    byDays?: RecurrenceDay[] | null;
    bySetPos?: number[] | null;
    byMonth?: number[] | null;
    excludeDates?: number[] | null;
    timezone?: string | null;
    isAllDay?: boolean | null;
  }) {
    this.frequency = args.frequency;
    this.startDate = args.isAllDay ? toUTC(args.startDate) : args.startDate;
    this.count = args.count || undefined;
    this.interval = args.interval || undefined;
    this.until = args.isAllDay && args.until ? toUTC(args.until) : args.until || undefined;
    this.byDays = args.byDays || undefined;
    this.bySetPos = args.bySetPos || undefined;
    this.byMonth = args.byMonth || undefined;
    this.excludeDates = args.excludeDates || undefined;
    this.timezone = args.isAllDay ? 'UTC' : args.timezone || undefined;
    this.isAllDay = args.isAllDay || undefined;
  }

  // Validators

  static isRecurrenceRule = RecurrenceRuleDef.is;

  static isRecurrenceRuleFrequency = RecurrenceRuleFrequency.is;

  static isRecurrenceRuleDay = RecurrenceRuleDay.is;

  // JSON string

  static fromJsonString(jsonString: string) {
    const parsedRecurrenceRule: unknown = JSON.parse(jsonString.toString());
    if (!this.isRecurrenceRule(parsedRecurrenceRule)) throw new Error('Failed parsing recurrence rule');
    return new this(parsedRecurrenceRule);
  }

  toJsonString() {
    const recurrenceRuleObject: t.TypeOf<typeof RecurrenceRuleDef> = {
      frequency: this.frequency,
      startDate: this.startDate,
      timezone: this.timezone,
      interval: this.interval,
      count: this.count,
      until: this.until,
      byDays: this.byDays,
      bySetPos: this.bySetPos,
      byMonth: this.byMonth,
      excludeDates: this.excludeDates,
      isAllDay: this.isAllDay
    };

    if (!RecurrenceRule.isRecurrenceRule(recurrenceRuleObject)) throw Error('Failed encoding recurrence rule');
    return JSON.stringify(recurrenceRuleObject);
  }

  // GraphQL

  static fromGraphqlInput(gqlRecurrenceRule: gql_RecurrenceRuleInput) {
    const {
      interval,
      count,
      until,
      frequency,
      byDays,
      bySetPos,
      byMonth,
      startDate,
      excludeDates,
      timezone,
      isAllDay
    } = gqlRecurrenceRule;

    if (!this.isRecurrenceRuleFrequency(frequency)) throw new Error('Failed parsing GQL recurrence rule frequency');
    if (byDays && !byDays.every((day) => this.isRecurrenceRuleDay(day)))
      throw new Error('Failed parsing GQL recurrence rule by days');

    return new RecurrenceRule({
      interval,
      count,
      until: until?.getTime(),
      frequency,
      startDate: startDate.getTime(),
      byDays,
      bySetPos,
      byMonth,
      excludeDates: excludeDates?.map((date) => date.getTime()),
      timezone,
      isAllDay
    });
  }

  toGraphql(): gql_RecurrenceRule {
    return {
      interval: this.interval,
      count: this.count,
      until: this.until ? new Date(this.until) : undefined,
      frequency: this.frequency,
      byDays: this.byDays,
      bySetPos: this.bySetPos,
      byMonth: this.byMonth,
      startDate: new Date(this.startDate),
      excludeDates: this.excludeDates ? this.excludeDates.map((date) => new Date(date)) : [],
      timezone: this.timezone,
      isAllDay: this.isAllDay
    };
  }

  toGraphqlInput(): gql_RecurrenceRuleInput {
    return {
      interval: this.interval,
      count: this.count,
      until: this.until ? new Date(this.until) : undefined,
      frequency: this.frequency,
      byDays: this.byDays,
      bySetPos: this.bySetPos,
      byMonth: this.byMonth,
      startDate: new Date(this.startDate),
      excludeDates: this.excludeDates ? this.excludeDates.map((date) => new Date(date)) : [],
      timezone: this.timezone,
      isAllDay: this.isAllDay
    };
  }

  //ICal
  toICalGenerator(): ICalRepeatingOptions {
    return {
      freq: fromGQLFreqToICal(this.frequency),
      interval: this.interval || 1,
      count: this.count,
      until: this.until ? new Date(this.until) : undefined,
      byDay: fromGQLDaysToICal(this.byDays),
      bySetPos: this.bySetPos,
      byMonth: this.byMonth
    };
  }

  static parseByDaysAndSetPos(rrule: NonNullable<ExtendedCalendarComponent['rrule']> | RRule): {
    byDays: RecurrenceDay[];
    bySetPos: number[];
  } {
    let byDays: RecurrenceDay[] = [];
    let bySetPos: number[] = [];

    // Handle bynweekday and byweekday for weekly recurrences
    if (rrule.options.bynweekday) {
      const isNumber = (pos: number | undefined): pos is number => pos !== undefined;
      bySetPos = rrule.options.bynweekday.map((item) => item[1]).filter(isNumber);
      byDays = fromRRuleDaysToGQL(rrule.options.bynweekday.map((item) => item[0]).filter(isNumber));
    } else if (rrule.options.byweekday) {
      byDays = fromRRuleDaysToGQL(rrule.options.byweekday);
    }

    // Assign bySetPos if available in the options and not already set
    if (rrule.options.bysetpos && bySetPos.length === 0) {
      bySetPos = rrule.options.bysetpos;
    }

    return { byDays, bySetPos };
  }

  // RRule
  static fromRRule(
    rrule: NonNullable<ExtendedCalendarComponent['rrule']> | RRule,
    excludeDates?: Date[],
    isAllDay?: boolean
  ) {
    const { byDays, bySetPos } = this.parseByDaysAndSetPos(rrule);

    return new this({
      frequency: fromRRuleFreqToGQL(rrule.origOptions.freq),
      count: rrule.origOptions.count,
      interval: rrule.origOptions.interval,
      until: rrule.origOptions.until?.getTime() || undefined,
      startDate: rrule.origOptions.dtstart ? rrule.origOptions.dtstart.getTime() : 0,
      byDays,
      bySetPos,
      byMonth: rrule.options.bymonth,
      excludeDates: excludeDates?.map((date) => date.getTime()),
      timezone: rrule.origOptions.tzid || 'UTC',
      isAllDay
    });
  }

  toRRule(withLimit = true) {
    const untilDate = this.until ? new Date(this.until) : undefined;
    const shiftedUntil = untilDate ? toRRuleInput(untilDate, this.timezone) : undefined;
    const shiftedStartDated = toRRuleInput(new Date(this.startDate), this.timezone);
    return new RRule({
      freq: fromGQLFreqToRRule(this.frequency),
      count: this.count || (withLimit ? MAX_RECURRENCE_COUNT : undefined),
      interval: this.interval || 1,
      until: this.isAllDay ? untilDate : shiftedUntil,
      dtstart: this.isAllDay ? new Date(this.startDate) : shiftedStartDated,
      byweekday: fromGQLDaysToRRule(this.byDays),
      ...(this.bySetPos && this.bySetPos.length > 0 && { bysetpos: this.bySetPos }),
      ...(this.byMonth && this.byMonth.length > 0 && { bymonth: this.byMonth }),
      tzid: 'UTC'
    });
  }

  eventInRule(startDate: Date) {
    const rrule = this.toRRule();
    const utcStartDate = toRRuleInput(startDate, this.timezone);
    const eventsInStartDate = rrule.between(utcStartDate, utcStartDate, true);
    return !!eventsInStartDate.length;
  }

  static fromText(text: string, startDate: Date) {
    try {
      const parsed = RRule.fromText(text);
      const rrule = new RRule({
        ...parsed.origOptions,
        dtstart: startDate
      });
      return this.fromRRule(rrule);
    } catch (e) {
      console.error("Can't parse text to recurring rule", e);
    }
  }

  toText() {
    let rruleText = this.toRRule(false).toText();

    // Add "the 1st, 2nd, 3rd, 4th, and last before weekday if special occurrence"
    if (
      (this.frequency == RecurrenceFrequency.Monthly || this.frequency == RecurrenceFrequency.Yearly) &&
      this.bySetPos &&
      this.bySetPos.length > 0
    ) {
      const posText = `the ${this.bySetPos
        .map((pos) => {
          if (pos === -1) return 'last ';
          return `${pos}${getOrdinalSuffix(pos)} `;
        })
        .join('and ')}`;
      rruleText = rruleText.replace(/ on /, ` on ${posText}`);
    }

    return rruleText;
  }

  getDatesInRange(startDate: Date, endDate: Date) {
    return this.toRRule()
      .between(toRRuleInput(startDate, this.timezone), toRRuleInput(endDate, this.timezone), true)
      .map((d) => fromRRuleOutput(d, this.timezone))
      .filter((d) => !(this.excludeDates || []).includes(d.getTime()));
  }

  getAllDates() {
    return this.toRRule()
      .all()
      .map((d) => fromRRuleOutput(d, this.timezone))
      .filter((d) => !(this.excludeDates || []).includes(d.getTime()));
  }

  getLastDate() {
    const allDates = this.getAllDates();
    return allDates[allDates.length - 1];
  }

  getDateCount(date: Date) {
    const allDates = this.getAllDates().sort((d1, d2) => d1.getTime() - d2.getTime());

    const count = allDates.findIndex((instance) => instance.getTime() === date.getTime());

    return count;
  }
}
