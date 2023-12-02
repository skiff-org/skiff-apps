import ical from 'ical-generator';
import {
  ICalAttendeeStatus,
  ICalEventStatus,
  ICalCalendarMethod,
  ICalAttendeeRole,
  ICalEventTransparency,
  ICalAlarmType
} from 'ical-generator';
import { AttendeePermission, AttendeeStatus } from 'skiff-graphql';
import isURL from 'validator/lib/isURL';

import {
  ICAL_COMPANY,
  ICAL_LANGUAGE,
  ICAL_PRODUCT,
  CONFERENCE_KEY,
  DEFAULT_ALL_DAY_REMINDER_HOURS_BEFORE,
  MINUTES_IN_HOUR,
  SECONDS_IN_MIN,
  DEFAULT_TIMED_REMINDER_MINS_BEFORE
} from './constants';
import { RecurrenceRule } from './RecurrenceRule';

export enum EventAttendeeType {
  InternalAttendee,
  ExternalAttendee
}

export type GenerateAttendee = {
  attendeeStatus: AttendeeStatus;
  permission: AttendeePermission;
  optional: boolean;
  email: string;
  displayName?: string;
};

export interface GenerateEvent {
  title: string;
  description?: string;
  startDate: number;
  endDate: number;
  externalID: string;
  location?: string;
  isAllDay?: boolean;
  attendees: GenerateAttendee[];
  updatedAt: number;
  sequence: number;
  conference?: string;
  recurrenceRule?: RecurrenceRule;
  recurrenceID?: Date;
}

const transformStatus = (status: AttendeeStatus): ICalAttendeeStatus => {
  switch (status) {
    case AttendeeStatus.Pending:
      return ICalAttendeeStatus.NEEDSACTION;
    case AttendeeStatus.Maybe:
      return ICalAttendeeStatus.TENTATIVE;
    case AttendeeStatus.Yes:
      return ICalAttendeeStatus.ACCEPTED;
    case AttendeeStatus.No:
      return ICalAttendeeStatus.DECLINED;
  }
};

/**
 * return local tz using Intl.DateTimeFormat
 * we always need the local timezone, not matter what the users skiff calendar app is configured for,
 * because the native `Date` object is always created with the machine timezone
 *
 * this is supported for 95% of users, in case it's not, return undefined
 * This is also what `dayjs` uses in `dayjs.tz.guess`
 * https://caniuse.com/?search=Intl.DateTimeFormat().resolvedOptions().timeZone
 * @returns
 */
const getLocalTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz;
  } catch {
    return undefined;
  }
};

/**
 * Adds the conference parameter in the location parameter so it is visible for external users
 */
const constructLocationString = (location: string | undefined, conference: string | undefined) => {
  if (location && conference) {
    return `${location}, ${conference}`;
  } else if (conference) {
    return conference;
  } else {
    return location || '';
  }
};

/**
 * Generate an ICS for sending event updates.
 * @param event Event content.
 * @param status Status of the event.
 * @param method Calendar update type - REQUEST, REPLY, CANCEL.
 * @param fromAddress Sender of the update, used for matching attendees in reply below.
 * @returns Generated ICS.
 */
export const generateICS = (
  event: GenerateEvent,
  status: ICalEventStatus,
  method: ICalCalendarMethod,
  fromAddress: string
) => {
  const organizer = event.attendees.find((attendee) => attendee.permission === AttendeePermission.Owner);

  const calendar = ical({
    prodId: {
      company: ICAL_COMPANY,
      product: ICAL_PRODUCT,
      language: ICAL_LANGUAGE
    },
    scale: 'GREGORIAN',
    method
  });
  const isReply = method === ICalCalendarMethod.REPLY;
  const ev = calendar.createEvent({
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    timezone: getLocalTimezone(),
    stamp: new Date(),
    allDay: event.isAllDay,
    // Don't send the organizer if it's a reply.
    organizer:
      organizer && !isReply
        ? {
            name: organizer.displayName || organizer.email,
            email: organizer.email
          }
        : undefined,
    summary: event.title,
    description: event.description,
    location: constructLocationString(event.location, event.conference),
    status,
    id: event.externalID,
    // TODO(easdar) pipe createdAt through.
    created: new Date(),
    lastModified: new Date(event.updatedAt),
    sequence: event.sequence,
    transparency: ICalEventTransparency.OPAQUE,
    x: event.conference && isURL(event.conference) ? [{ key: CONFERENCE_KEY, value: event.conference }] : [],
    repeating: event.recurrenceRule ? event.recurrenceRule.toICalGenerator() : undefined,
    recurrenceId: event.recurrenceID
  });

  // For replies, we need to filter out all attendees execept for the one we are updating the status of.
  event.attendees
    .filter((attendee) => {
      if (isReply && !(attendee.email === fromAddress)) {
        return false;
      }
      return true;
    })
    .map((attendee) => {
      ev.createAttendee({
        email: attendee.email,
        name: attendee.displayName,
        role: ICalAttendeeRole.REQ,
        rsvp: true,
        status: transformStatus(attendee.attendeeStatus)
      });
    });

  // We only generate ics for events when sent to the event's participants, so in this case we include our default reminders
  // Notification at 1 day before at 9 am if all day event, in seconds
  const oneDayBeforeAt9AMTrigger = DEFAULT_ALL_DAY_REMINDER_HOURS_BEFORE * MINUTES_IN_HOUR * SECONDS_IN_MIN;
  // Notification at 10 minutes before the event if timed event, in seconds
  const tenMinutesBeforeTrigger = DEFAULT_TIMED_REMINDER_MINS_BEFORE * SECONDS_IN_MIN;
  const triggerValue = event.isAllDay ? oneDayBeforeAt9AMTrigger : tenMinutesBeforeTrigger;

  ev.createAlarm({
    type: ICalAlarmType.display, // For a notification
    trigger: triggerValue
  });

  return calendar.toString();
};
