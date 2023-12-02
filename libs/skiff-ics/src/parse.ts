import dayjs, { Dayjs } from 'dayjs';
import ical, { ParamList } from 'ical';
import { EventReminderType, EventReminderTimeUnit, EventReminder } from 'skiff-graphql';
import { v4 } from 'uuid';

import { METHOD_REGEX_PATTERN } from './constants';
import { extractConference } from './customHeaders';
import { dateParam } from './icsDateParser';
import { RecurrenceRule } from './RecurrenceRule';
import {
  ParsedOrganizer,
  Params,
  ParsedAttendee,
  CalendarMethodTypes,
  AttendeeStatParser,
  CalendarUserTypesParser,
  EventStatus,
  ExtendedCalendarComponent
} from './types';
import { convertReminderToUTC, isAllDay } from './utils';

/**
 * override ical date parsing with custom parsing
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(ical as any).objectHandlers.DTSTART = dateParam('start');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(ical as any).objectHandlers.DTEND = dateParam('end');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(ical as any).objectHandlers['RECURRENCE-ID'] = dateParam('recurrenceid');

type ParseError = {
  id: string;
  component: ExtendedCalendarComponent;
  error: string;
};

export interface ParsedEvent {
  id: string;
  startDate: Dayjs;
  endDate: Dayjs;
  icsCreationDate?: Dayjs;
  creationDate?: Dayjs;
  lastModifiedDate?: Dayjs;
  organizer?: ParsedOrganizer;
  attendees: ParsedAttendee[];
  description: string;
  location: string;
  title: string;
  status: EventStatus;
  method: CalendarMethodTypes;
  sequence: number;
  reminders?: EventReminder[];
  // recurrence
  recurrenceRule?: RecurrenceRule;
  recurrenceId?: Dayjs;
  recurrences?: ParsedEvent[];
  conference?: string;
}

interface ParsedICS {
  events: ParsedEvent[];
  errors: ParseError[];
  method: CalendarMethodTypes;
}

interface VAlarm {
  type: 'VALARM';
  action: string;
  trigger: string; // ISO8601 duration or explicit datetime
  attendee?: string;
  description?: string;
  summary?: string;
}
const DURATION_REGEX = /-?P(?:(\d+)W)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;

/*
ical's event.start and event.end has a dateOnly attr but types of ical
are not correct (type is Date).
*/
type ICalEventDate = Date & { dateOnly: boolean };

export const removeQuotes = (str: string) => str.replace(/^\"(.*)\"$/, '$1');

const parseOrganizer = (data: ParamList | undefined | string): ParsedOrganizer | undefined => {
  if (!data || typeof data === 'string') return undefined;

  return {
    name: removeQuotes(data.params[Params.Name] || ''),
    language: data.params[Params.Language],
    sentBy: data.params[Params.SentBy],
    value: data.val
  };
};

const parseAttendees = (data: ParamList | undefined | string | ParamList[]): ParsedAttendee[] => {
  if (!data || typeof data !== 'object') return [];

  // sometime single attendee received as single ParamList object
  if (!Array.isArray(data)) data = [data];

  const attendees: ParsedAttendee[] = [];

  data.forEach((attendeeData) => {
    attendees.push({
      name: removeQuotes(attendeeData.params[Params.Name] || ''),
      value: attendeeData.val,
      email: attendeeData.val.replace(new RegExp('mailto:', 'ig'), ''),
      sentBy: attendeeData.params[Params.SentBy],
      language: attendeeData.params[Params.Language],
      role: attendeeData.params[Params.Role] || '',
      status: AttendeeStatParser.parse(attendeeData.params[Params.ParticipantStatue]?.toUpperCase()),
      rsvp: attendeeData.params[Params.Rsvp] === 'TRUE' ? true : false,
      calendarUserType: CalendarUserTypesParser.parse(attendeeData.params[Params.CalendarUserType]),
      memberships: attendeeData.params[Params.Member],
      delegatedTo: attendeeData.params[Params.DelegatedTo],
      delegatedFrom: attendeeData.params[Params.DelegatedFrom]
    });
  });
  return attendees;
};

const parseToDayJS = (value: Date | undefined, name: string): Dayjs => {
  if (!value) throw new Error(`Event has no ${name} time`);
  try {
    return dayjs(value);
  } catch (e) {
    console.error(e);
    throw new Error(`Failed parsing ${name} time`);
  }
};

const parseMethodParam = (ics: string) => {
  const regResult = RegExp(METHOD_REGEX_PATTERN).exec(ics);
  // if method is not defined, default to Publish
  if (regResult === null) return CalendarMethodTypes.Publish;
  // if found method string in ics, get the method value
  if (regResult?.[0]) return regResult[0].split(':')[1] as CalendarMethodTypes;
  else throw new Error('invalid ICS method was found on ICS file');
};

const parseGeneric = (value: ParamList | undefined | string, defaultValue = ''): string => {
  switch (typeof value) {
    case 'object':
      return value.val;
    case 'string':
      return value;
    default:
      return defaultValue;
  }
};

const getSecondsFromDurationStr = (durationFromICS: string) => {
  try {
    let seconds = 0;
    const durationStr = durationFromICS.toLowerCase();
    const days = durationStr.match(/(\d+)\s*d/);
    const hours = durationStr.match(/(\d+)\s*h/);
    const minutes = durationStr.match(/(\d+)\s*m/);
    if (days && days[1]) {
      seconds += parseInt(days[1]) * 86400;
    }
    if (hours && hours[1]) {
      seconds += parseInt(hours[1]) * 3600;
    }
    if (minutes && minutes[1]) {
      seconds += parseInt(minutes[1]) * 60;
    }
    return seconds;
  } catch (error) {
    // return 1 hour in seconds
    return 3600;
  }
};

const parseReminder = (alarm: VAlarm, isAllDayEvent: boolean, startDate: Dayjs, userTimezone?: string) => {
  const mediumFullHourFormat = 'H:mm';
  const trigger = alarm.trigger;
  let timeValue: number, timeUnit: EventReminderTimeUnit;

  // Match the duration components
  const match = DURATION_REGEX.exec(trigger);
  if (!match) return undefined;

  // Extract the duration components
  const weeks = (match[1] && parseInt(match[1], 10)) || 0;
  const days = (match[2] && parseInt(match[2], 10)) || 0;
  const hours = (match[3] && parseInt(match[3], 10)) || 0;
  const minutes = (match[4] && parseInt(match[4], 10)) || 0;
  const seconds = match[5] && parseInt(match[5], 10);

  // If seconds equal zero, this means the notification is set at start of the event
  if (!minutes && !hours && !days && !weeks && seconds !== 0) return undefined;

  const type = alarm.action === EventReminderType.Email ? EventReminderType.Email : EventReminderType.Notification;

  timeValue = weeks || days || hours || minutes || 0;
  // Determine the time unit and value based on the duration components
  if (weeks) {
    timeUnit = EventReminderTimeUnit.Week;
  } else if (days) {
    timeUnit = EventReminderTimeUnit.Day;
  } else if (hours) {
    timeUnit = EventReminderTimeUnit.Hour;
  } else if (minutes || seconds === 0) {
    timeUnit = EventReminderTimeUnit.Minute;
  } else {
    return undefined;
  }

  let reminder: EventReminder = {
    timeUnit,
    type,
    timeValue,
    timeForAllDay: undefined,
    reminderID: v4()
  };

  if (!isAllDayEvent) return reminder;

  // In all day events we need to get the time from the ISO 8601 duration string
  // Time is the event's start date minus the hours in trigger
  const timeForAllDay = startDate.subtract(hours, 'hour').format(mediumFullHourFormat);

  if (days && hours) {
    // If there are days and hours, we add 1 to the number of days to account for those extra hours
    // For example P2DT16H0M0S means 2 days and 16 hours before event which we should save as 3 days before at H:mm
    timeValue = timeValue + 1;
    // Some calendars eg: google and apple doesn't include weeks in ics files, so instead we can have 21 days before event
    // We check how many whole weeks in the given number of days if any
    if (days % 7 === 0) {
      timeUnit = EventReminderTimeUnit.Week;
      timeValue = days / 7;
    }
  } else if (hours) {
    // If only hours are set in the trigger eg: 15 hrs before event, we save it as 1 day before at 9am
    timeUnit = EventReminderTimeUnit.Day;
    timeValue = 1;
  }

  reminder = {
    ...reminder,
    timeUnit,
    timeValue,
    timeForAllDay
  };

  return userTimezone ? convertReminderToUTC(reminder, userTimezone) : reminder;
};

const parseEvent = (
  id: string,
  event: ExtendedCalendarComponent,
  method: CalendarMethodTypes,
  userTimezone?: string
): ParsedEvent => {
  const recurrences: ParsedEvent[] = [];
  const recurrenceID = event.recurrenceid ?? event._recurrenceid;
  for (const recurrenceDate in event.recurrences) {
    const recurrenceEvent: ExtendedCalendarComponent | undefined =
      event.recurrences[recurrenceDate as unknown as number];
    // Skip if recurrence event is the same as the original event
    // This is a bug in ical.js
    if (!recurrenceEvent || recurrenceEvent.recurrenceid === recurrenceID) continue;
    recurrences.push(parseEvent(recurrenceEvent.uid || '', recurrenceEvent, method, userTimezone));
  }

  const excludeDates: Date[] = [];
  for (const exDate in event.exdate) {
    const excludeDate = event.exdate[exDate as unknown as number];
    if (!excludeDate) continue;
    excludeDates.push(excludeDate);
  }

  const startDate = parseToDayJS(event.start, 'start');
  let endDate: Dayjs | undefined = undefined;

  // for edge-cases where event.start is dateOnly but not event.end, so it's an all-day-event (single day)
  if (event.end && (event.start as ICalEventDate).dateOnly && !(event.end as ICalEventDate).dateOnly) delete event.end;

  if (event.end) {
    endDate = parseToDayJS(event.end, 'end');
  } else if (event.duration && typeof event.duration === 'string') {
    const durationSeconds = getSecondsFromDurationStr(event.duration);
    endDate = startDate.add(durationSeconds, 'second');
  } else if ((event.start as ICalEventDate).dateOnly) {
    // fallback end for end date (if start is dateOnly) - 1 day after start date
    endDate = startDate.add(1, 'day');
  } else {
    // fallback end for end date - 1 hour after start date
    endDate = startDate.add(1, 'hour');
  }

  let sequence = 0;
  try {
    sequence = event.sequence ? Number(event.sequence as string) : 0;
  } catch {
    sequence = 0;
  }
  const isAllDayEvent = isAllDay(startDate, endDate);
  const recurrenceRule = event.rrule ? RecurrenceRule.fromRRule(event.rrule, excludeDates, isAllDayEvent) : undefined;
  if (recurrenceRule && !recurrenceID) {
    recurrenceRule.startDate = startDate.valueOf();
  }

  const reminders: EventReminder[] = [];
  let parsedReminder: EventReminder | undefined;

  for (const key in event) {
    const component = event[key];
    // Check if an object is a reminder
    if (component && typeof component === 'object' && 'type' in component && component?.type === 'VALARM') {
      // Get parsed reminder and add it to our array of reminders
      parsedReminder = parseReminder(component as unknown as VAlarm, isAllDayEvent, startDate, userTimezone);
      if (!parsedReminder) continue;

      reminders.push(parsedReminder);
    }
  }

  return {
    id,
    startDate,
    endDate,
    icsCreationDate: event.dtstamp && parseToDayJS(event.dtstamp, 'dtstamp'),
    creationDate: event.created && parseToDayJS(event.created, 'created'),
    lastModifiedDate: event.lastmodified && parseToDayJS(event.lastmodified, 'lasymodified'),
    organizer: parseOrganizer(event.organizer),
    attendees: parseAttendees(event.attendee),
    description: parseGeneric(event.description),
    location: parseGeneric(event.location),
    title: parseGeneric(event.summary, 'Untitled event'),
    status: event.status as EventStatus,
    recurrenceRule,
    recurrenceId: recurrenceID ? parseToDayJS(recurrenceID as Date, 'recurrenceid') : undefined,
    recurrences,
    method,
    conference: extractConference(event),
    sequence,
    reminders
  };
};

export const parseICS = (ics: string, userTimezone?: string): ParsedICS => {
  const parsedICS = ical.parseICS(ics);
  const method = parseMethodParam(ics);
  const events: ParsedEvent[] = [];
  const errors: ParseError[] = [];

  for (const id in parsedICS) {
    const calendarComponent: ExtendedCalendarComponent | undefined = parsedICS[id];
    if (!calendarComponent) continue;
    if (calendarComponent.type !== 'VEVENT') continue;

    if (calendarComponent.rrule) {
      // We need to pass the event TZID to the recurrence rule
      // Otherwise, the recurring event TZID will default to 'UTC' which messes up event timing across DST periods
      calendarComponent.rrule.origOptions.tzid = calendarComponent.start?.tz as string | undefined;
    }

    try {
      const parsedEvent = parseEvent(id, calendarComponent, method, userTimezone);
      events.push(parsedEvent);
    } catch (err) {
      console.error(`Failed to parse event, ${(err as { message: string }).message}`, calendarComponent);
      errors.push({ id, component: calendarComponent, error: (err as { message: string }).message });
    }
  }

  return {
    events,
    errors,
    method
  };
};
