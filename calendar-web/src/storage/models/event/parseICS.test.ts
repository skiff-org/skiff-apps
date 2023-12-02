import dayjs from 'dayjs';
import 'fake-indexeddb/auto';
import { AttendeePermission, AttendeeStatus, RecurrenceFrequency, SyncState } from 'skiff-graphql';
import { parseICS, RecurrenceRule } from 'skiff-ics';
import { v4 } from 'uuid';

import { plainMockEvent } from '../../../../tests/mocks/encryptedEvent';
import { generateCurrentUserEmailAliasesResponse, mockUser1 } from '../../../../tests/mocks/user';
import {
  currentUserAliasesFactory,
  mswServer,
  syncHandlerFactory,
  usersFromEmailAliasHandlerFactory
} from '../../../../tests/mockServer';
import { initializeTestDB } from '../../../../tests/utils/db';
import { HOUR_UNIT, MINUTE_UNIT, SECOND_UNIT } from '../../../constants/time.constants';
import { isRecurringChild } from '../../../utils/recurringUtils';
import { handleICSEvent } from '../../../utils/sync/icsUtils';

import { DecryptedEventModel } from './DecryptedEventModel';
import { googleRecurringDaily, GOOGLE_SENDER } from './icsMocks/google_recurring_daily';
import { getGoogleRSVPIcs, GOOGLE_RSVP_USER } from './icsMocks/google_rsvp';
import { microsoft_recurring, MICROSOFT_SENDER } from './icsMocks/microsoft_recurring';
import { getMicrosoftRsvpICS, MICROSOFT_RSVP_USER } from './icsMocks/microsoft_rsvp';
import { getEventsByExternalID, saveContent } from './modelUtils';
import { EventAttendeeType } from './types';

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    getCurrentUserData: () => mockUser1,
    requireCurrentUserData: () => mockUser1
  };
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const calendarID = mockUser1.primaryCalendar!.calendarID;

const mockSyncAndUsersFromAliases = (checkpoint: number) => {
  // Mock response from server with some sync response
  mswServer.use(
    syncHandlerFactory({
      sync2: {
        checkpoint,
        events: [],
        state: SyncState.Synced
      }
    })
  );
  // Mock usersFromEmailAlias for the attendee to get his data
  mswServer.use(
    usersFromEmailAliasHandlerFactory({
      usersFromEmailAlias: []
    })
  );
};

beforeAll(async () => {
  await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
});

describe('parseICS', () => {
  it('parse ics with recurring event from Google', async () => {
    mockSyncAndUsersFromAliases(0);
    mswServer.use(currentUserAliasesFactory(generateCurrentUserEmailAliasesResponse(mockUser1)));

    const parsedICS = parseICS(googleRecurringDaily);
    const parsedEvent = parsedICS.events[0];

    await handleICSEvent(parsedEvent, GOOGLE_SENDER, mockUser1, true);

    const savedEvents = await getEventsByExternalID(parsedEvent.id, false);

    expect(savedEvents).toHaveLength(1);

    const rule = savedEvents[0].plainContent.recurrenceRule;

    expect(rule?.frequency).toBe(RecurrenceFrequency.Daily);
    expect(rule?.count).toBe(30);
    expect(rule?.interval).toBe(2);
  });

  it('parse ics with recurring event from Microsoft', async () => {
    mockSyncAndUsersFromAliases(0);
    mswServer.use(currentUserAliasesFactory(generateCurrentUserEmailAliasesResponse(mockUser1)));

    const parsedICS = parseICS(microsoft_recurring);
    const parsedEvent = parsedICS.events[0];

    await handleICSEvent(parsedEvent, MICROSOFT_SENDER, mockUser1, true);

    const savedEvents = await getEventsByExternalID(parsedEvent.id, false);

    expect(savedEvents).toHaveLength(1);

    const rule = savedEvents[0].plainContent.recurrenceRule;

    expect(rule?.frequency).toBe(RecurrenceFrequency.Weekly);
    expect(rule?.until).toBe(dayjs('20230519T120000').valueOf());
    expect(rule?.interval).toBe(3);
  });

  it('parse RSVP from Google to recurring event', async () => {
    // create event with google attendee
    const parent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        parentEventID: v4(),
        plainContent: {
          startDate: dayjs('20230519T120000').tz('UTC').valueOf(),
          endDate: dayjs('20230519T123000').tz('UTC').valueOf(),
          parentRecurrenceID: undefined,
          recurrenceDate: 0,
          recurrenceRule: new RecurrenceRule({
            startDate: dayjs('20230519T120000').tz('UTC').valueOf(),
            frequency: RecurrenceFrequency.Monthly,
            interval: 1,
            count: 12
          })
        },
        decryptedContent: {
          attendees: [
            {
              attendeeStatus: AttendeeStatus.Pending,
              deleted: false,
              email: GOOGLE_RSVP_USER,
              id: GOOGLE_RSVP_USER,
              optional: false,
              permission: AttendeePermission.Read,
              type: EventAttendeeType.ExternalAttendee,
              updatedAt: 1668007561771,
              displayName: 'Google Rsvp Test'
            }
          ]
        }
      })
    );

    await saveContent(parent);

    // parse rsvp response
    const parsedICS = parseICS(getGoogleRSVPIcs(parent.externalID));
    const parsedEvent = parsedICS.events[0];

    await handleICSEvent(parsedEvent, GOOGLE_RSVP_USER, mockUser1, true);

    const savedEvents = await getEventsByExternalID(parsedEvent.id, false);

    // we expect another recurrence to be created because they rsvp'd to virtualized event
    expect(savedEvents).toHaveLength(2);

    const oneEventIsConfirmed = savedEvents.some((event) => {
      const googleAttendee = event.decryptedContent.attendees.find((attendee) => attendee.email === GOOGLE_RSVP_USER);
      return googleAttendee?.attendeeStatus === AttendeeStatus.Yes;
    });

    const oneEventIsNotConfirmed = savedEvents.some((event) => {
      const googleAttendee = event.decryptedContent.attendees.find((attendee) => attendee.email === GOOGLE_RSVP_USER);
      return googleAttendee?.attendeeStatus === AttendeeStatus.Pending;
    });

    // One of the attendees in the ics already has a status of yes
    expect(oneEventIsConfirmed).toBeTruthy();
    expect(oneEventIsNotConfirmed).toBeTruthy();

    // check all events are parent or have recurrence date that matches the parent
    savedEvents.forEach((event) => {
      if (isRecurringChild(event)) {
        expect(dayjs(event.plainContent.recurrenceDate).get(HOUR_UNIT)).toBe(
          dayjs(parent.plainContent.startDate).get(HOUR_UNIT)
        );
        expect(dayjs(event.plainContent.recurrenceDate).get(MINUTE_UNIT)).toBe(
          dayjs(parent.plainContent.startDate).get(MINUTE_UNIT)
        );
        expect(dayjs(event.plainContent.recurrenceDate).get(SECOND_UNIT)).toBe(
          dayjs(parent.plainContent.startDate).get(SECOND_UNIT)
        );
      }
    });
  });

  it('parse RSVP from Microsoft to recurring event', async () => {
    // create event with google attendee
    const parent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        parentEventID: v4(),
        plainContent: {
          startDate: dayjs('20230219T120000').valueOf(),
          endDate: dayjs('20230219T123000').valueOf(),
          parentRecurrenceID: undefined,
          recurrenceDate: 0,
          recurrenceRule: new RecurrenceRule({
            startDate: dayjs('20230219T120000').valueOf(),
            frequency: RecurrenceFrequency.Daily
          })
        },
        decryptedContent: {
          attendees: [
            {
              attendeeStatus: AttendeeStatus.Pending,
              deleted: false,
              email: MICROSOFT_RSVP_USER,
              id: MICROSOFT_RSVP_USER,
              optional: false,
              permission: AttendeePermission.Read,
              type: EventAttendeeType.ExternalAttendee,
              updatedAt: 1668007561771,
              displayName: 'Microsoft Rsvp Test'
            }
          ]
        }
      })
    );

    await saveContent(parent);

    // parse rsvp response
    const parsedICS = parseICS(getMicrosoftRsvpICS(parent.externalID));
    const parsedEvent = parsedICS.events[0];

    await handleICSEvent(parsedEvent, MICROSOFT_RSVP_USER, mockUser1, true);

    const savedEvents = await getEventsByExternalID(parsedEvent.id, false);

    // we expect another recurrence to be created because they rsvp'd to virtualized event
    expect(savedEvents).toHaveLength(2);

    const oneEventIsConfirmed = savedEvents.some((event) => {
      const microsoftAttendee = event.decryptedContent.attendees.find(
        (attendee) => attendee.email === MICROSOFT_RSVP_USER
      );
      return microsoftAttendee?.attendeeStatus === AttendeeStatus.Yes;
    });

    const oneEventIsNotConfirmed = savedEvents.some((event) => {
      const googleAttendee = event.decryptedContent.attendees.find(
        (attendee) => attendee.email === MICROSOFT_RSVP_USER
      );
      return googleAttendee?.attendeeStatus === AttendeeStatus.Pending;
    });

    expect(oneEventIsConfirmed).toBeTruthy();
    expect(oneEventIsNotConfirmed).toBeTruthy();

    // check all events are parent or have recurrence date that matches the parent
    savedEvents.forEach((event) => {
      if (isRecurringChild(event)) {
        expect(dayjs(event.plainContent.recurrenceDate).get(HOUR_UNIT)).toBe(
          dayjs(parent.plainContent.startDate).get(HOUR_UNIT)
        );
        expect(dayjs(event.plainContent.recurrenceDate).get(MINUTE_UNIT)).toBe(
          dayjs(parent.plainContent.startDate).get(MINUTE_UNIT)
        );
        expect(dayjs(event.plainContent.recurrenceDate).get(SECOND_UNIT)).toBe(
          dayjs(parent.plainContent.startDate).get(SECOND_UNIT)
        );
      }
    });
  });
});
