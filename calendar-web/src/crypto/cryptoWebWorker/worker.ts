import { expose } from 'comlink';
import { AccentColor } from 'nightwatch-ui';
import { generateSymmetricKey, stringEncryptAsymmetric } from 'skiff-crypto';
import { encryptSessionKey, encryptDatagramV2, decryptDatagramV2 } from 'skiff-crypto';
import { AttendeeStatus, AttendeePermission } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';

import { ExternalAttendee as proto_ExternalAttendee } from '../../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';
import { DecryptedDraft } from '../../storage/models/draft/types';
import {
  DecryptedEvent,
  EventAttendeeType,
  ExternalAttendee,
  InternalAttendee
} from '../../storage/models/event/types';
import { EncryptedDraft } from '../../storage/schemas/draft';
import { EncryptedEvent } from '../../storage/schemas/event';
import { EventDatagram, CalendarEventPreferencesDatagram } from '../calendar';

export interface DecryptEventProps {
  event: EncryptedEvent;
  sessionKey: string;
  preferencesSessionKey?: string;
}

export interface DecryptDraftProps {
  draft: EncryptedDraft;
  sessionKey: string;
  preferencesSessionKey?: string;
}

export class CryptoWorkerClass {
  encryptEvent(
    decryptedEvent: DecryptedEvent,
    calendarPublicKey: string,
    activeCalendarPrivateKey: string,
    {
      internalAttendees,
      externalAttendees
    }: { externalAttendees: ExternalAttendee[]; internalAttendees: InternalAttendee[] }
  ): EncryptedEvent {
    const encryptedSessionKeyForCalendar = encryptSessionKey(
      decryptedEvent.decryptedSessionKey,
      activeCalendarPrivateKey,
      { key: calendarPublicKey },
      { key: calendarPublicKey }
    );

    const encryptedData = encryptDatagramV2(
      EventDatagram,
      {},
      {
        title: decryptedEvent.decryptedContent.title,
        description: decryptedEvent.decryptedContent.description ?? '',
        location: decryptedEvent.decryptedContent.location ?? '',
        lastUpdateKeyMap: decryptedEvent.decryptedContent.lastUpdateKeyMap,
        externalAttendees: externalAttendees.map((attendee) => ({
          id: attendee.id,
          attendeeStatus: attendee.attendeeStatus,
          permission: attendee.permission,
          updatedAt: attendee.updatedAt,
          deleted: attendee.deleted,
          type: attendee.type.toString(),
          displayName: attendee.displayName ?? '',
          optional: attendee.optional,
          email: attendee.email,
          isNew: attendee.isNew ?? false
        })),
        isAllDay: decryptedEvent.decryptedContent.isAllDay ?? false,
        conference: decryptedEvent.decryptedContent.conference
      },
      decryptedEvent.decryptedSessionKey
    );

    const preferencesSessionKey = decryptedEvent.decryptedPreferenceSessionKey || generateSymmetricKey();
    const encryptedPreferences = encryptDatagramV2(
      CalendarEventPreferencesDatagram,
      {},
      {
        color: decryptedEvent.decryptedPreferences?.color,
        lastUpdateKeyMap: decryptedEvent.decryptedPreferences?.lastUpdateKeyMap || {}
      },
      preferencesSessionKey
    ).encryptedData;

    const encryptedPreferencesSessionKey = stringEncryptAsymmetric(
      activeCalendarPrivateKey,
      { key: calendarPublicKey },
      preferencesSessionKey
    );

    return {
      externalCreator: decryptedEvent.plainContent.externalCreator,
      creatorCalendarID: decryptedEvent.plainContent.creatorCalendarID,
      deleted: decryptedEvent.plainContent.deleted,
      externalID: decryptedEvent.externalID,
      parentEventID: decryptedEvent.parentEventID,
      startDate: decryptedEvent.plainContent.startDate,
      endDate: decryptedEvent.plainContent.endDate,
      syncState: decryptedEvent.localMetadata.syncState,
      updatedAt: decryptedEvent.localMetadata.updatedAt,
      currentMailTimestamp: decryptedEvent.localMetadata.currentMailTimestamp,
      requestMailTimestamp: decryptedEvent.localMetadata.requestMailTimestamp,
      eventEmails: decryptedEvent.localMetadata.eventEmails,
      updateType: decryptedEvent.localMetadata.updateType,
      encryptedContent: encryptedData,
      internalAttendees,
      encryptedSessionKey: encryptedSessionKeyForCalendar.encryptedKey,
      encryptedByKey: calendarPublicKey,
      encryptedPreferences,
      encryptedPreferencesSessionKey,
      sequence: decryptedEvent.plainContent.sequence || 0, // fallback for events with older version
      lastUpdateKeyMap: decryptedEvent.plainContent.lastUpdateKeyMap,
      recurrenceDate: decryptedEvent.plainContent.recurrenceDate,
      parentRecurrenceID: decryptedEvent.plainContent.parentRecurrenceID,
      reminders: decryptedEvent.plainContent.reminders,
      recurrenceRule: decryptedEvent.plainContent.recurrenceRule
        ? new RecurrenceRule(decryptedEvent.plainContent.recurrenceRule).toJsonString()
        : null
    };
  }

  externalAttendeesFromProto(attendees: proto_ExternalAttendee[]): ExternalAttendee[] {
    return attendees.map((attendee) => {
      return {
        ...attendee,
        attendeeStatus: attendee.attendeeStatus as AttendeeStatus,
        permission: attendee.permission as AttendeePermission,
        updatedAt: attendee.updatedAt,
        type: EventAttendeeType.ExternalAttendee
      };
    });
  }

  decryptEvent(props: DecryptEventProps): DecryptedEvent {
    const { event, sessionKey, preferencesSessionKey } = props;
    const { body } = decryptDatagramV2(EventDatagram, sessionKey, event.encryptedContent.encryptedData);
    const { title, description, location, lastUpdateKeyMap, externalAttendees, isAllDay, conference } = body;

    const decryptedPreferences =
      preferencesSessionKey && event.encryptedPreferences
        ? decryptDatagramV2(CalendarEventPreferencesDatagram, preferencesSessionKey, event.encryptedPreferences)
        : undefined;

    const { color } = decryptedPreferences
      ? { color: decryptedPreferences.body.color ? (decryptedPreferences.body.color as AccentColor) : undefined }
      : { color: undefined };

    return {
      decryptedContent: {
        title,
        description,
        location,
        attendees: [...event.internalAttendees, ...this.externalAttendeesFromProto(externalAttendees)],
        lastUpdateKeyMap,
        isAllDay,
        conference
      },
      plainContent: {
        creatorCalendarID: event.creatorCalendarID,
        endDate: event.endDate,
        startDate: event.startDate,
        deleted: event.deleted,
        externalCreator: event.externalCreator,
        lastUpdateKeyMap: event.lastUpdateKeyMap || {},
        recurrenceRule: event.recurrenceRule ? RecurrenceRule.fromJsonString(event.recurrenceRule) : null,
        recurrenceDate: event.recurrenceDate,
        parentRecurrenceID: event.parentRecurrenceID,
        reminders: event.reminders ?? [],
        sequence: event.sequence || 0 // fallback for events with older version
      },
      decryptedPreferences: {
        color,
        lastUpdateKeyMap: decryptedPreferences?.body.lastUpdateKeyMap || {}
      },
      localMetadata: {
        updatedAt: event.updatedAt,
        syncState: event.syncState,
        currentMailTimestamp: event.currentMailTimestamp || 0,
        requestMailTimestamp: event.requestMailTimestamp || 0,
        eventEmails: event.eventEmails || { sent: [], queue: [] },
        updateType: event.updateType
      },

      decryptedPreferenceSessionKey: preferencesSessionKey,
      parentEventID: event.parentEventID,
      externalID: event.externalID,
      decryptedSessionKey: sessionKey
    };
  }

  decryptManyEvents(events: DecryptEventProps[]): DecryptedEvent[] {
    return events.map((event) => this.decryptEvent(event));
  }

  encryptDraft(
    decryptedDraft: DecryptedDraft,
    calendarPublicKey: string,
    activeCalendarPrivateKey: string,
    {
      internalAttendees,
      externalAttendees
    }: { externalAttendees: ExternalAttendee[]; internalAttendees: InternalAttendee[] }
  ): EncryptedDraft {
    const encryptedSessionKeyForCalendar = encryptSessionKey(
      decryptedDraft.decryptedSessionKey,
      activeCalendarPrivateKey,
      { key: calendarPublicKey },
      { key: calendarPublicKey }
    );

    const { title, description, location, isAllDay, conference } = decryptedDraft.decryptedContent;

    const encryptedData = encryptDatagramV2(
      EventDatagram,
      {},
      {
        title,
        description: description ?? '',
        location: location ?? '',
        lastUpdateKeyMap: {},
        externalAttendees: externalAttendees.map((attendee) => ({
          id: attendee.id,
          attendeeStatus: attendee.attendeeStatus,
          permission: attendee.permission,
          updatedAt: attendee.updatedAt,
          deleted: attendee.deleted,
          type: attendee.type.toString(),
          displayName: attendee.displayName ?? '',
          optional: attendee.optional,
          email: attendee.email,
          isNew: attendee.isNew ?? false
        })),
        isAllDay: isAllDay ?? false,
        conference
      },
      decryptedDraft.decryptedSessionKey
    );

    const preferencesSessionKey = decryptedDraft.decryptedPreferenceSessionKey || generateSymmetricKey();

    const { color } = decryptedDraft.decryptedPreferences || {
      lastUpdateKeyMap: {}
    };
    const encryptedPreferences = encryptDatagramV2(
      CalendarEventPreferencesDatagram,
      {},
      {
        color: color,
        lastUpdateKeyMap: {}
      },
      preferencesSessionKey
    ).encryptedData;

    const encryptedPreferencesSessionKey = stringEncryptAsymmetric(
      activeCalendarPrivateKey,
      { key: calendarPublicKey },
      preferencesSessionKey
    );

    return {
      parentEventID: decryptedDraft.parentEventID,
      externalID: decryptedDraft.externalID,
      startDate: decryptedDraft.plainContent.startDate,
      endDate: decryptedDraft.plainContent.endDate,
      encryptedContent: encryptedData,
      internalAttendees,
      encryptedSessionKey: encryptedSessionKeyForCalendar.encryptedKey,
      encryptedByKey: calendarPublicKey,
      encryptedPreferences,
      encryptedPreferencesSessionKey,
      updateType: decryptedDraft.localMetadata.updateType,
      recurrenceDate: decryptedDraft.plainContent.recurrenceDate,
      recurrenceRule: decryptedDraft.plainContent.recurrenceRule
        ? new RecurrenceRule(decryptedDraft.plainContent.recurrenceRule).toJsonString()
        : null,
      parentRecurrenceID: decryptedDraft.plainContent.parentRecurrenceID,
      creatorCalendarID: decryptedDraft.plainContent.creatorCalendarID,
      sequence: decryptedDraft.plainContent.sequence,
      externalCreator: decryptedDraft.plainContent.externalCreator,
      reminders: decryptedDraft.plainContent.reminders
    };
  }

  decryptDraft = (props: DecryptDraftProps): DecryptedDraft => {
    const { draft, sessionKey, preferencesSessionKey } = props;
    const { body } = decryptDatagramV2(EventDatagram, sessionKey, draft.encryptedContent.encryptedData);
    const { title, description, location, externalAttendees, isAllDay, conference } = body;

    const decryptedPreferences =
      preferencesSessionKey && draft.encryptedPreferences
        ? decryptDatagramV2(CalendarEventPreferencesDatagram, preferencesSessionKey, draft.encryptedPreferences)
        : undefined;

    const { color } = decryptedPreferences
      ? { color: decryptedPreferences.body.color ? (decryptedPreferences.body.color as AccentColor) : undefined }
      : { color: undefined };

    return {
      parentEventID: draft.parentEventID,
      externalID: draft.externalID,
      plainContent: {
        endDate: draft.endDate,
        startDate: draft.startDate,
        recurrenceRule: draft.recurrenceRule ? RecurrenceRule.fromJsonString(draft.recurrenceRule) : null,
        recurrenceDate: draft.recurrenceDate,
        parentRecurrenceID: draft.parentRecurrenceID,
        creatorCalendarID: draft.creatorCalendarID,
        sequence: draft.sequence,
        externalCreator: draft.externalCreator,
        reminders: draft.reminders
      },
      decryptedContent: {
        isAllDay,
        title,
        attendees: [...draft.internalAttendees, ...this.externalAttendeesFromProto(externalAttendees)],
        description,
        location,
        conference
      },
      decryptedPreferences: {
        color
      },
      localMetadata: {
        updateType: draft.updateType
      },
      decryptedPreferenceSessionKey: preferencesSessionKey,
      decryptedSessionKey: sessionKey
    };
  };

  decryptManyDrafts(drafts: DecryptDraftProps[]): DecryptedDraft[] {
    return drafts.map((draft) => this.decryptDraft(draft));
  }
}

expose(CryptoWorkerClass);
