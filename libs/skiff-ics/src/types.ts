import { CalendarComponent } from 'ical';
import { z } from 'zod';

export enum Params {
  Language = 'LANGUAGE',
  Name = 'CN',
  SentBy = 'SENT_BY',
  Role = 'ROLE',
  ParticipantStatue = 'PARTSTAT',
  Rsvp = 'RSVP',
  CalendarUserType = 'CUTYPE',
  Member = 'MEMBER',
  DelegatedTo = 'DELEGATED-TO',
  DelegatedFrom = 'DELEGATED-FROM'
}

export interface ParsedOrganizer {
  name: string;
  language?: string;
  sentBy?: string;
  value: string;
}

export enum AttendeeStatus {
  NeedActions = 'NEEDS-ACTION',
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Tentative = 'TENTATIVE',
  Delegated = 'DELEGATED'
}
export const AttendeeStatParser = z.nativeEnum(AttendeeStatus).default(AttendeeStatus.NeedActions);

export enum AttendeeRole {
  Required = 'REQ-PARTICIPANT',
  Optional = 'OPT-PARTICIPANT'
}

export enum EventStatus {
  Tentative = 'TENTATIVE',
  Confirmed = 'CONFIRMED',
  Canceled = 'CANCELLED'
}

export enum CalendarUserTypes {
  Individual = 'INDIVIDUAL',
  Group = 'GROUP',
  Resource = 'RESOURCE',
  Room = 'ROOM',
  Unknown = 'UNKNOWN'
}

export const CalendarUserTypesParser = z.nativeEnum(CalendarUserTypes).default(CalendarUserTypes.Unknown);

// Types of the METHOD field described in the iTIP specifications.
export enum CalendarMethodTypes {
  Publish = 'PUBLISH',
  Request = 'REQUEST',
  Reply = 'REPLY',
  Add = 'ADD',
  Cancel = 'CANCEL',
  Refresh = 'REFRESH',
  Counter = 'COUNTER',
  DeclineCounter = 'DECLINECOUNTER'
}

export interface ParsedAttendee {
  name: string;
  value: string;
  email: string;
  sentBy?: string;
  language?: string;
  role: string;
  status: AttendeeStatus;
  rsvp: boolean;
  calendarUserType: CalendarUserTypes;
  memberships?: string;
  delegatedTo?: string;
  delegatedFrom?: string;
}

export type ExtendedDate = Date & {
  dateOnly?: boolean;
  tz?: string | number | boolean;
};

export type ExtendedCalendarComponent = CalendarComponent & {
  start?: ExtendedDate;
  end?: ExtendedDate;
};
