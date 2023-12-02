import dayjs from 'dayjs';
import { gapi } from 'gapi-script';
import { generateSymmetricKey } from 'skiff-crypto';
import { requireCurrentUserData } from 'skiff-front-utils';
import { AttendeePermission, AttendeeStatus, EventUpdateType } from 'skiff-graphql';
import { isAllDay } from 'skiff-ics';
import { filterExists } from 'skiff-utils';
import { v4 as uuidv4 } from 'uuid';

import { getCurrentCalendarMetadata } from '../apollo/currentCalendarMetadata';
import { UNTITLED_EVENT } from '../constants/calendar.constants';
import { toEncryptedEvent } from '../crypto/cryptoWebWorker';
import { requireAllResolvedAndSplitAttendees } from '../storage/crypto/utils';
import { db } from '../storage/db/db';
import { DecryptedEventModel } from '../storage/models/event/DecryptedEventModel';
import { addBulkNewEvents, getEventsByExternalID } from '../storage/models/event/modelUtils';
import { EventAttendee, EventAttendeeType, EventSyncState, ExternalAttendee } from '../storage/models/event/types';
import { EncryptedEvent } from '../storage/schemas/event';

import { addUserAttendeeIfNeeded } from './sync/icsUtils';

const googleAttendeeStatusToSkiffStatus: { [googlAttendeeStatus: string]: AttendeeStatus } = {
  needsAction: AttendeeStatus.Pending,
  declined: AttendeeStatus.No,
  tentative: AttendeeStatus.Maybe,
  accepted: AttendeeStatus.Yes
};

const paginateRequests = async <T>(
  cb: (nextPageToken?: string) => Promise<{ nextPageToken: string | undefined; response: T[] }>
) => {
  let nextPageToken: string | undefined;
  const fullResponse: T[] = [];
  do {
    const pageResponse = await cb(nextPageToken);
    fullResponse.push(...pageResponse.response);
    nextPageToken = pageResponse.nextPageToken;
  } while (nextPageToken);

  return fullResponse;
};

const listCalendars = async () => {
  const calendars = await paginateRequests<gapi.client.calendar.CalendarListEntry>(async (nextPageToken?: string) => {
    const res = await gapi.client.calendar.calendarList.list({ pageToken: nextPageToken });
    return { response: res.result.items || [], nextPageToken: res.result.nextPageToken };
  });

  return calendars;
};

const listCalendarEvents = async (calendarId: string) => {
  const events = await paginateRequests<gapi.client.calendar.Event>(async (nextPageToken?: string) => {
    const res = await gapi.client.calendar.events.list({
      calendarId,
      pageToken: nextPageToken
    });
    return { response: res.result.items || [], nextPageToken: res.result.nextPageToken };
  });
  return events;
};

const googleAttendeeToParticipant = (
  attendee: gapi.client.calendar.EventAttendee,
  organizerEmail?: string
): ExternalAttendee | undefined =>
  attendee.email
    ? {
        type: EventAttendeeType.ExternalAttendee,
        id: attendee.email,
        email: attendee.email,
        optional: !!attendee.optional,
        permission:
          organizerEmail && organizerEmail === attendee.email ? AttendeePermission.Owner : AttendeePermission.Read,
        displayName: attendee.displayName,
        attendeeStatus: attendee.responseStatus
          ? googleAttendeeStatusToSkiffStatus[attendee.responseStatus]
          : AttendeeStatus.Pending,
        deleted: false,
        updatedAt: new Date().getTime()
      }
    : undefined;

const getAttendeesFromEvent = (
  googleAttendees: gapi.client.calendar.EventAttendee[],
  organizerEmail?: string
): EventAttendee[] => {
  return googleAttendees.map((attendee) => googleAttendeeToParticipant(attendee, organizerEmail)).filter(filterExists);
};

export const importGoogleCalendar = async () => {
  const allCalendars: gapi.client.calendar.CalendarListEntry[] = await listCalendars();
  const allEvents: gapi.client.calendar.Event[] = (
    await Promise.all(allCalendars.map(({ id }) => listCalendarEvents(id || '')))
  ).flat();

  const calendarMeta = await getCurrentCalendarMetadata();
  if (!calendarMeta) throw new Error('importGoogleCalendar: Calendar metadata not found');

  const user = requireCurrentUserData();

  const activeCalendarPrivateKey = calendarMeta.getDecryptedCalendarPrivateKey(
    user.privateUserData.privateKey,
    user.publicKey
  );

  const encryptedEvents: EncryptedEvent[] = [];
  for (const event of allEvents) {
    const eventID = uuidv4();
    if (!db || !event.id) continue;
    try {
      const existingEvents = await getEventsByExternalID(event.id, true);

      // if one of the existing events is not deleted - continue
      if (existingEvents.length > 0 && existingEvents.some((e) => !e.plainContent.deleted)) continue;

      const startDate = event.start?.dateTime || event.start?.date;
      const endDate = event.end?.dateTime || event.end?.date || startDate;

      // don't add events without date
      if (!startDate || !endDate) continue;

      // don't add recurring events
      // TODO: handle this events once we support them
      if (event.recurringEventId) continue;

      const decryptedSessionKey = generateSymmetricKey();

      const isAllDayEvent = isAllDay(dayjs(startDate), dayjs(endDate));
      const decryptedEvent = DecryptedEventModel.fromDecryptedEvent({
        plainContent: {
          creatorCalendarID: calendarMeta.calendarID,
          startDate: dayjs(startDate).valueOf(),
          // some calendars set the end day of all-day events as the start of the next day - so we need to trim it to make sure it will take only one day
          endDate: isAllDayEvent ? dayjs(endDate).valueOf() - 1 : dayjs(endDate).valueOf(),
          lastUpdateKeyMap: {},
          externalCreator: null,
          recurrenceDate: 0,
          sequence: 0,
          reminders: [] // TODO: @yomnashaban Insert what we want to insert for google import
        },
        decryptedContent: {
          title: event.summary || UNTITLED_EVENT,
          description: event.description,
          lastUpdateKeyMap: {},
          attendees: getAttendeesFromEvent(event.attendees || [], event.organizer?.email),
          location: event.location,
          isAllDay: isAllDayEvent
        },
        localMetadata: {
          currentMailTimestamp: 0,
          requestMailTimestamp: 0,
          eventEmails: { sent: [], queue: [] },
          syncState: EventSyncState.Waiting,
          updateType: [EventUpdateType.Content],
          updatedAt: dayjs().valueOf()
        },
        parentEventID: eventID,
        externalID: event.id || uuidv4(),
        decryptedSessionKey
      });

      await addUserAttendeeIfNeeded(
        decryptedEvent,
        user,
        calendarMeta.calendarID,
        decryptedEvent.decryptedContent.attendees.length > 1 ? AttendeeStatus.Pending : AttendeeStatus.Yes
      );
      const attendeesForEncryption = requireAllResolvedAndSplitAttendees(decryptedEvent.decryptedContent.attendees);
      const encryptedEvent = await toEncryptedEvent(
        decryptedEvent,
        calendarMeta.publicKey,
        activeCalendarPrivateKey,
        attendeesForEncryption
      );
      encryptedEvents.push(encryptedEvent);
    } catch (err) {
      console.error('error parsing google event', err);
    }
  }

  try {
    await addBulkNewEvents(encryptedEvents);
  } catch (err) {
    console.log(err);
  }
};
