import { RecurrenceRule } from 'skiff-ics';

import { DecryptedDraft } from '../../src/storage/models/draft/types';
import {
  DecryptedEvent,
  EventAttendeeType,
  EventDecryptedContent,
  EventDecryptedPreferences,
  InternalAttendee
} from '../../src/storage/models/event/types';
import { EncryptedDraft } from '../../src/storage/schemas/draft';
import { EncryptedEvent } from '../../src/storage/schemas/event';

export const toDecryptedEvent = (event: EncryptedEvent): DecryptedEvent => {
  return {
    decryptedSessionKey: 'key',
    decryptedPreferenceSessionKey: 'key',
    decryptedContent: {
      title: 'test',
      lastUpdateKeyMap: {},
      attendees: [...event.internalAttendees],
      description: 'desc',
      location: 'loc',
      isAllDay: false,
      ...(JSON.parse(event.encryptedContent.encryptedData) as Partial<EventDecryptedContent>)
    },
    decryptedPreferences: {
      color: 'red',
      lastUpdateKeyMap: {},
      ...(JSON.parse(event.encryptedPreferences || '{}') as Partial<EventDecryptedPreferences>)
    },
    plainContent: {
      creatorCalendarID: event.creatorCalendarID,
      externalCreator: event.externalCreator,
      startDate: event.startDate,
      endDate: event.endDate,
      deleted: event.deleted,
      lastUpdateKeyMap: event.lastUpdateKeyMap,
      recurrenceDate: event.recurrenceDate,
      parentRecurrenceID: event.parentRecurrenceID,
      recurrenceRule: event.recurrenceRule ? RecurrenceRule.fromJsonString(event.recurrenceRule) : undefined,
      sequence: 0,
      reminders: event.reminders
    },
    parentEventID: event.parentEventID,
    externalID: event.externalID,
    localMetadata: {
      syncState: event.syncState,
      currentMailTimestamp: event.currentMailTimestamp,
      requestMailTimestamp: event.requestMailTimestamp,
      eventEmails: event.eventEmails,
      updatedAt: event.updatedAt,
      updateType: event.updateType
    }
  };
};

export const toEncryptedDraft = (draft: DecryptedDraft): Promise<EncryptedDraft> => {
  return Promise.resolve({
    ...draft.plainContent,
    ...draft.localMetadata,
    internalAttendees: draft.decryptedContent.attendees.filter(
      (attendee) => attendee.type === EventAttendeeType.InternalAttendee
    ) as InternalAttendee[],
    encryptedContent: { encryptedData: JSON.stringify(draft.decryptedContent) },
    encryptedSessionKey: '',
    encryptedByKey: '',
    externalID: draft.externalID,
    parentEventID: draft.parentEventID,
    encryptedPreferences: JSON.stringify(draft.decryptedPreferences),
    recurrenceRule: draft.plainContent.recurrenceRule?.toJsonString()
  });
};

export const toDecryptedDraft = (draft: EncryptedDraft): DecryptedDraft => {
  return {
    decryptedSessionKey: 'key',
    decryptedPreferenceSessionKey: 'key',
    decryptedContent: {
      title: 'test',
      lastUpdateKeyMap: {},
      attendees: [...draft.internalAttendees],
      description: 'desc',
      location: 'loc',
      isAllDay: false,
      ...(JSON.parse(draft.encryptedContent.encryptedData) as Partial<EventDecryptedContent>)
    },
    decryptedPreferences: {
      color: 'red',
      lastUpdateKeyMap: {},
      ...(JSON.parse(draft.encryptedPreferences || '{}') as Partial<EventDecryptedPreferences>)
    },
    plainContent: {
      sequence: draft.sequence,
      creatorCalendarID: draft.creatorCalendarID,
      externalCreator: draft.externalCreator,
      startDate: draft.startDate,
      endDate: draft.endDate,
      recurrenceDate: draft.recurrenceDate,
      parentRecurrenceID: draft.parentRecurrenceID,
      recurrenceRule: draft.recurrenceRule ? RecurrenceRule.fromJsonString(draft.recurrenceRule) : undefined,
      reminders: draft.reminders
    },
    parentEventID: draft.parentEventID,
    externalID: draft.externalID,
    localMetadata: {
      updateType: draft.updateType
    }
  };
};
export const toManyDecryptedDrafts = (a: { draft: EncryptedDraft }[]): DecryptedDraft[] => {
  return a.map(({ draft }) => toDecryptedDraft(draft));
};

export const toManyDecryptedEvents = (a: { event: EncryptedEvent }[]): DecryptedEvent[] => {
  return a.map(({ event }) => toDecryptedEvent(event));
};

export const toEncryptedEvent = (event: DecryptedEvent): Promise<EncryptedEvent> => {
  return Promise.resolve({
    ...event.plainContent,
    ...event.localMetadata,
    internalAttendees: event.decryptedContent.attendees.filter(
      (attendee) => attendee.type === EventAttendeeType.InternalAttendee
    ) as InternalAttendee[],
    encryptedContent: { encryptedData: JSON.stringify(event.decryptedContent) },
    encryptedSessionKey: '',
    encryptedByKey: '',
    externalID: event.externalID,
    parentEventID: event.parentEventID,
    encryptedPreferences: JSON.stringify(event.decryptedPreferences),
    recurrenceRule: event.plainContent.recurrenceRule?.toJsonString()
  });
};
