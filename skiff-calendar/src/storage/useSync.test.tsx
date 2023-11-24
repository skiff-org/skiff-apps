import dayjs from 'dayjs';
import 'fake-indexeddb/auto';
import { GraphQLRequest } from 'msw';
import { AttendeePermission, AttendeeStatus, SyncState } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';
import { v4 as uuidv4 } from 'uuid';

import { SyncMutationVariables } from '../../generated/graphql';
import { encryptedEvent1, plainMockEvent, plainMockEventWithAttendees } from '../../tests/mocks/encryptedEvent';
import { mockUser1, mockUser2UserFromAliasResponse } from '../../tests/mocks/user';
import { mswServer, syncHandlerFactory, usersFromEmailAliasHandlerFactory } from '../../tests/mockServer';
import { initializeTestDB } from '../../tests/utils/db';
import { responseWhenClientSynced, validateClientIsSynced } from '../../tests/utils/syncTestUtils';
import { getCurrentCalendarMetadata } from '../apollo/currentCalendarMetadata';
import { EXTERNAL_ID_SUFFIX } from '../constants';

import { db } from './db/db';
import { CalendarMetadataDB } from './models/CalendarMetadata';
import { DecryptedEventModel } from './models/event/DecryptedEventModel';
import { getEventByID, saveContent } from './models/event/modelUtils';
import { InternalAttendee } from './models/event/types';
import { resolveAllAttendeesAndEncryptSessionKeys } from './models/event/utils';
import { sync } from './useSync';

const calendarID = mockUser1.primaryCalendar!.calendarID;

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    getCurrentUserData: () => mockUser1,
    requireCurrentUserData: () => mockUser1
  };
});

const checkpoint = 1667980778381;

const mockCalendarMetadata = CalendarMetadataDB.fromMetadata({
  calendarID,
  publicKey: '',
  encryptedPrivateKey: '',
  initializedLocalDB: true,
  encryptedByKey: '',
  lastUpdated: checkpoint
});

jest.mock('../apollo/currentCalendarMetadata', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../apollo/currentCalendarMetadata');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    getCurrentCalendarID: () => calendarID,
    getCurrentCalendarMetadata: () => mockCalendarMetadata,
    requireCurrentCalendarMetadata: () => mockCalendarMetadata,
    useCurrentCalendarID: () => calendarID,
    requireCurrentCalendarID: () => calendarID,
    useCurrentCalendarMetadata: () => mockCalendarMetadata
  };
});

describe('sync keep client up-to-date with server', () => {
  beforeEach(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
  });

  afterEach(async () => {
    await db?.delete();
  });

  it('First time load empty calendar, state should be synced and checkpoint null', async () => {
    const syncResults = await sync(null);
    expect(syncResults?.checkpoint).toBe(null);
    expect(syncResults?.state).toBe(SyncState.Synced);
  });

  it('First time load calendar with events, state should be synced checkpoint exist, local db should have all events', async () => {
    const parentEventID = 'e1bcab4c-d362-4bfc-b749-d7d954e035e7';
    const startDate = 1667984400000;
    const endDate = 1667986200000;
    // Mock response from server with some unsynced events
    mswServer.use(
      syncHandlerFactory({
        sync2: {
          checkpoint,
          events: [encryptedEvent1(parentEventID, checkpoint, startDate, endDate, calendarID)],
          state: SyncState.Conflict
        }
      })
    );
    const syncResults = await sync(null);
    expect(syncResults?.checkpoint).toBe(checkpoint);
    expect(syncResults?.state).toBe(SyncState.Conflict);
    const calendar = await getCurrentCalendarMetadata();
    // Verify local db save checkpoint by the backend response
    expect(calendar?.lastUpdated).toBe(checkpoint);

    const eventOnLocalDB = await getEventByID(parentEventID);
    expect(eventOnLocalDB?.decryptedContent.title).toBe('test');
    expect(eventOnLocalDB?.plainContent.startDate).toBe(startDate);
    expect(eventOnLocalDB?.plainContent.endDate).toBe(endDate);
  });

  // Verify local event send over sync mutation with a prop varibales
  it('Sync events without attendees', async () => {
    await sync(null);
    const updatedAt = dayjs().valueOf();
    const parentEventID = uuidv4();
    const decryptedEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        parentEventID,
        localMetadata: {
          updatedAt
        },
        plainContent: {
          startDate: 1667984400000,
          endDate: 1667986200000
        }
      })
    );
    const calendar = await getCurrentCalendarMetadata();
    assertExists(calendar);

    await resolveAllAttendeesAndEncryptSessionKeys(
      decryptedEvent,
      calendar,
      mockUser1.privateUserData.privateKey,
      mockUser1.publicKey
    );
    await saveContent(decryptedEvent, false);

    const requestSpy = jest.fn<() => void, [GraphQLRequest<SyncMutationVariables>]>();

    // Mock synced response from BE with the new checkpoint
    mswServer.use(syncHandlerFactory(responseWhenClientSynced(updatedAt), requestSpy));

    // Trigger sync after adding event locally
    await sync(null);

    const syncMutationRequest = requestSpy.mock.calls[0][0];
    expect(syncMutationRequest).toBeDefined();

    const syncRequestVaribals = syncMutationRequest?.variables?.request;

    // Make sure calendarID sent with sync mutation
    expect(syncRequestVaribals.calendarID).toBe(calendarID);

    const eventsThatSentOnSync = syncRequestVaribals?.events;
    // Make sure sync mutation try to push unsynced events
    expect(eventsThatSentOnSync?.length).toBe(1);

    expect(eventsThatSentOnSync[0]).toEqual(
      expect.objectContaining({
        calendarID,
        creatorCalendarID: calendarID,
        internalAttendeeList: [
          expect.objectContaining({
            status: AttendeeStatus.Yes,
            calendarID: '891b0268-cd69-4124-b704-f71fc32ee01d',
            deleted: false,
            email: 'guy353bot21@skiff.town',
            optional: false,
            permission: AttendeePermission.Owner
          })
        ],
        parentEventID,
        updateTypes: []
      })
    );
    // Add check enxryoted content is exist
    expect(eventsThatSentOnSync[0].eventData).toEqual(
      expect.objectContaining({
        deleted: false,
        endDate: '2022-11-09T09:30:00.000Z',
        externalID: `${parentEventID}${EXTERNAL_ID_SUFFIX}`,
        startDate: '2022-11-09T09:00:00.000Z'
      })
    );

    // Make sure next sync dont send the pushed event again
    await validateClientIsSynced(updatedAt);
  });

  it('Sync events with internal attendees', async () => {
    await sync(null);
    const updatedAt = dayjs().valueOf();
    const parentEventID = uuidv4();
    const eventWithAttendees = plainMockEventWithAttendees({
      parentEventID,
      localMetadata: {
        updatedAt
      },
      plainContent: {
        startDate: 1667984400000,
        endDate: 1667986200000
      }
    });

    const event = DecryptedEventModel.fromDecryptedEvent(eventWithAttendees);

    const calendar = await getCurrentCalendarMetadata();
    assertExists(calendar);
    const requestSpy = jest.fn<() => void, [GraphQLRequest<SyncMutationVariables>]>();

    const hanlerSync = syncHandlerFactory(responseWhenClientSynced(updatedAt), requestSpy);
    mswServer.use(hanlerSync);

    // Mock usersFromEmailAlias for the attendee to get his data
    mswServer.use(
      usersFromEmailAliasHandlerFactory({
        usersFromEmailAlias: [mockUser2UserFromAliasResponse]
      })
    );

    await resolveAllAttendeesAndEncryptSessionKeys(
      event,
      calendar,
      mockUser1.privateUserData.privateKey,
      mockUser1.publicKey
    );
    await saveContent(event);

    mswServer.use(hanlerSync);

    // Trigger sync after adding event locally
    await sync(null);

    // Validate sync mutation varibales
    const syncMutationRequest = requestSpy.mock.calls[0][0];
    expect(syncMutationRequest).toBeDefined();
    const syncRequestVaribals = syncMutationRequest?.variables?.request;
    // Make sure calendarID sent with sync mutation
    expect(syncRequestVaribals.calendarID).toBe(calendarID);
    const eventsThatSentOnSync = syncRequestVaribals?.events;
    // Make sure sync mutation try to push unsynced events
    expect(eventsThatSentOnSync?.length).toBe(1);

    const ownerAttendee = eventWithAttendees.decryptedContent.attendees[0] as InternalAttendee;
    const readAttendee = eventWithAttendees.decryptedContent.attendees[1] as InternalAttendee;
    expect(eventsThatSentOnSync[0]).toEqual(
      expect.objectContaining({
        calendarID,
        parentEventID,
        updateTypes: []
      })
    );
    expect(eventsThatSentOnSync[0].internalAttendeeList[0]).toEqual(
      expect.objectContaining({
        calendarID: ownerAttendee.calendarID,
        deleted: ownerAttendee.deleted,
        email: ownerAttendee.email,
        optional: ownerAttendee.optional,
        permission: ownerAttendee.permission,
        status: ownerAttendee.attendeeStatus,
        displayName: ownerAttendee.displayName
      })
    );
    expect(eventsThatSentOnSync[0].internalAttendeeList[1]).toEqual(
      expect.objectContaining({
        calendarID: mockUser2UserFromAliasResponse.primaryCalendar?.calendarID,
        deleted: readAttendee.deleted,
        email: readAttendee.email,
        optional: readAttendee.optional,
        permission: readAttendee.permission,
        status: readAttendee.attendeeStatus,
        displayName: readAttendee.displayName
      })
    );
    expect(eventsThatSentOnSync[0].eventData).toEqual(
      expect.objectContaining({
        deleted: false,
        endDate: '2022-11-09T09:30:00.000Z',
        externalID: `${parentEventID}${EXTERNAL_ID_SUFFIX}`,
        startDate: '2022-11-09T09:00:00.000Z'
      })
    );

    // Make sure next sync dont send the pushed event again
    await validateClientIsSynced(updatedAt);
  });
});

// Handle event with attendees + without sending mail (verify mail not send)
// Handle new ics email
