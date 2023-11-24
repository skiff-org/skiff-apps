import { AccentColor } from 'nightwatch-ui';
import { AttendeePermission, AttendeeStatus, EventUpdateType, EventReminder, PublicKey } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';

import { ConferenceProvider } from '../../../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';

/**
 * =======================================================
 *                    Conflict Types
 * =======================================================
 */

export type ContentLastUpdateKeyMap = Partial<{
  [key in keyof Omit<EventDecryptedContent, 'lastUpdateKeyMap' | 'attendees'>]: number;
}>;

/** List of content props that need to be tracked with updatedAt and cause content conflict with EventUpdateType.Content */
export const eventPlainContentConflictProps = [
  'startDate',
  'endDate',
  'deleted',
  'sequence',
  'recurrenceRule',
  'recurrenceDate',
  'parentRecurrenceID'
];
export type PlainContentLastUpdateKeyMap = Partial<{
  [key in keyof Omit<EventPlainContent, 'creatorCalendarID' | 'externalCreator' | 'lastUpdateKeyMap'>]: number;
}>;

/** List of content props that need to be tracked with updatedAt and cause content conflict with EventUpdateType.Content */
export const eventContentConflictProps = ['title', 'description', 'location', 'isAllDay', 'conference'];

export type PreferencesLastUpdateKeyMap = Partial<{
  [key in keyof Omit<EventDecryptedPreferences, 'lastUpdateKeyMap'>]: number;
}>;

/** List of preferences props that need to be tracked with updatedAt so the merge logic will be applied on them */
export const eventPreferencesConflictProps = ['color'];

/**
 * =======================================================
 *                    Sync Types
 * =======================================================
 */

export enum EventSyncState {
  Waiting = 'waiting',
  Done = 'done'
}

export type UpdateEventArgs = Partial<{
  plainContent: Partial<EventPlainContent>;
  decryptedContent: Partial<EventDecryptedContent>;
  decryptedPreferences: Partial<EventDecryptedPreferences>;
}>;

export type UpdateAttendeeArgs = Partial<Omit<EventAttendee, 'id' | 'updatedAt' | 'type'>>;

export enum EmailContentType {
  Content = 'Content',
  Rsvp = 'RSVP',
  ContentExternal = 'ContentExternal'
}

export enum EmailTypes {
  Invite = 'invite',
  Uninvite = 'uninvite',
  Update = 'update',
  RSVP = 'rsvp',
  GlobalDelete = 'globalDelete', // event deleted for all attendees
  AliasDeleted = 'aliasDeleted' // alias invited to the event is no longer active
}
export interface EventEmails {
  sent: EmailTypes[];
  queue: EmailContentType[];
}
/**
 * =======================================================
 *                    Attendee Types
 * =======================================================
 */

export enum EventAttendeeType {
  InternalAttendee,
  ExternalAttendee,
  UnresolvedAttendee
}

export interface AttendeeBase {
  // this id is calendarID for internal and email for external
  id: string;
  type: EventAttendeeType;
  attendeeStatus: AttendeeStatus;
  permission: AttendeePermission;
  optional: boolean;
  email: string;
  displayName?: string;

  // Fields for conflict resolution
  deleted: boolean;
  updatedAt: number;

  // Fields for mail sending
  isNew?: boolean;
}

export interface InternalAttendeeWithPublicKey extends AttendeeBase {
  type: EventAttendeeType.InternalAttendee;
  calendarID: string;
  publicKey: PublicKey;
}

// This is a skiff attendee (calendar)
export interface InternalAttendeeWithEncryptedSessionKey extends AttendeeBase {
  type: EventAttendeeType.InternalAttendee;
  calendarID: string;
  encryptedSessionKey: string;
  encryptedByKey: string;
}

export type InternalAttendee = InternalAttendeeWithPublicKey | InternalAttendeeWithEncryptedSessionKey;

// This is an external attendee (communicated with emails)
export interface ExternalAttendee extends AttendeeBase {
  type: EventAttendeeType.ExternalAttendee;
}

// This is an attendee that has not yet fetched to check if skiff address
export interface UnresolvedAttendee extends AttendeeBase {
  type: EventAttendeeType.UnresolvedAttendee;
}

export type EventAttendee = InternalAttendee | ExternalAttendee | UnresolvedAttendee;

/**
 * =======================================================
 *                    Event Type
 * =======================================================
 */

// Event Base

export interface EventPlainContent {
  /** map events with import origin ID to prevent importing same events multiple times */
  creatorCalendarID: string;
  recurrenceDate: number;
  startDate: number;
  endDate: number;
  sequence: number;
  reminders: EventReminder[];

  deleted?: boolean;
  externalCreator: string | null;
  recurrenceRule?: RecurrenceRule | null;
  parentRecurrenceID?: string | null;

  lastUpdateKeyMap: PlainContentLastUpdateKeyMap;
}

export interface EventLocalMetadata {
  syncState: EventSyncState;
  currentMailTimestamp: number;
  requestMailTimestamp: number;
  eventEmails: EventEmails;
  updatedAt: number;
  updateType: EventUpdateType[];
}

export interface EventBase {
  externalID: string;
  parentEventID: string;
  plainContent: EventPlainContent;
  localMetadata: EventLocalMetadata;
}

// Decrypted Event

export type VideoConference = {
  provider: ConferenceProvider;
  link: string;
};

export interface EventDecryptedContent {
  // lastUpdatedAudit - helps with resolve conflict
  lastUpdateKeyMap: ContentLastUpdateKeyMap;
  title: string;
  attendees: EventAttendee[];
  description?: string;
  location?: string;
  isAllDay?: boolean;
  conference?: VideoConference;
}

export interface EventDecryptedPreferences {
  // lastUpdatedAudit for preferences - helps with resolve conflict
  lastUpdateKeyMap: PreferencesLastUpdateKeyMap;
  color?: AccentColor;
}

export interface DecryptedEvent extends EventBase {
  decryptedSessionKey: string;
  decryptedContent: EventDecryptedContent;
  decryptedPreferenceSessionKey?: string;
  decryptedPreferences?: EventDecryptedPreferences;
}

/**
 * =======================================================
 *                    Type Guards
 * =======================================================
 */

export function isInternalAttendeeWithPublicKey(attendee: EventAttendee): attendee is InternalAttendeeWithPublicKey {
  return attendee.type === EventAttendeeType.InternalAttendee && 'publicKey' in attendee;
}
export function isInternalAttendeeWithEncryptedSessionKey(
  attendee: EventAttendee
): attendee is InternalAttendeeWithEncryptedSessionKey {
  return attendee.type === EventAttendeeType.InternalAttendee && 'encryptedSessionKey' in attendee;
}

export function isInternalAttendeeWithEncryptedSessionKeyArray(
  attendees: EventAttendee[]
): attendees is InternalAttendeeWithEncryptedSessionKey[] {
  return attendees.every(isInternalAttendeeWithEncryptedSessionKey);
}

export function isExternalAttendee(attendee: EventAttendee): attendee is ExternalAttendee {
  return attendee.type === EventAttendeeType.ExternalAttendee;
}

export function isUnresolvedAttendee(attendee: EventAttendee): attendee is UnresolvedAttendee {
  return attendee.type === EventAttendeeType.UnresolvedAttendee;
}

export function isResolvedAttendeeArray(
  attendees: EventAttendee[]
): attendees is (InternalAttendeeWithEncryptedSessionKey | ExternalAttendee)[] {
  return attendees.every((attendee) => isExternalAttendee(attendee) || isInternalAttendeeWithPublicKey(attendee));
}
