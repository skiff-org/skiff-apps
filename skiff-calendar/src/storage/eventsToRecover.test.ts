import 'fake-indexeddb/auto';

import { graphql } from 'msw';

import { Sync2Document } from '../../generated/graphql';
import { encryptedEvent1, plainMockEvent } from '../../tests/mocks/encryptedEvent';
import { mockUser1 } from '../../tests/mocks/user';
import { getEventsFactory, mswServer } from '../../tests/mockServer';
import { initializeTestDB } from '../../tests/utils/db';

import { db } from './db/db';
import { CalendarMetadataDB } from './models/CalendarMetadata';
import { ErrorHandlerMetadataDB } from './models/ErrorHandlerMetadata';
import { DecryptedEventModel } from './models/event/DecryptedEventModel';
import * as eventModelUtils from './models/event/utils';
import { EventsToRecover } from './models/EventsToRecover';
import { callSyncMutationAndHandleErrors, fromEventsWithChangesToEventsToPush, sync } from './useSync';

const routerMock = graphql.link('http://localhost:4000/graphql');

const calendarID = mockUser1.primaryCalendar!.calendarID;

const mockCalendarMetadata = CalendarMetadataDB.fromMetadata({
  calendarID,
  publicKey: '',
  encryptedPrivateKey: '',
  initializedLocalDB: true,
  encryptedByKey: ''
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
const decryptedEvent = DecryptedEventModel.fromDecryptedEvent(plainMockEvent({}));

describe('eventsToRecover', () => {
  beforeEach(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
  });

  afterEach(async () => {
    await db?.delete();
  });
  const args1 = {
    eventsWithLocalChanges: [decryptedEvent],
    calendarMetadata: mockCalendarMetadata,
    userData: mockUser1,
    activeCalendarPrivateKey: 'PRIVATE_KEY'
  };

  it('fromEventsWithChangesToEventsToPush: Should create a new eventToRecover, when failing', async () => {
    jest.spyOn(eventModelUtils, 'resolveAllAttendeesAndEncryptSessionKeys').mockImplementationOnce(async () => {
      return Promise.reject(new Error('Resolve all attendees failed'));
    });

    const eventsToPush = await fromEventsWithChangesToEventsToPush(args1);
    expect(eventsToPush).toHaveLength(0);

    const eventsToRecover = await EventsToRecover.getAll();

    expect(eventsToRecover).toHaveLength(1);
    expect(eventsToRecover[0].parentEventID).toBe(decryptedEvent.parentEventID);

    const errors = await ErrorHandlerMetadataDB.getAll();

    expect(errors).toHaveLength(1);
    expect(errors[0].message[0]).toBe('Error: Resolve all attendees failed');
  });

  it('callSyncMutationAndHandleErrors: Should create a new eventToRecover, when failing with sync error', async () => {
    const eventsToPush = await fromEventsWithChangesToEventsToPush(args1);

    const args = {
      eventsToPush,
      calendarID: mockCalendarMetadata.calendarID,
      enqueueToast: null
    };

    mswServer.use(
      routerMock.mutation(Sync2Document, (_req, res, ctx) => {
        return res(
          ctx.errors([
            {
              message: 'Sync failed to save events'
            }
          ])
        );
      })
    );

    const response = await callSyncMutationAndHandleErrors(args);

    expect(response).toBeUndefined();

    const eventsToRecover = await EventsToRecover.getAll();

    expect(eventsToRecover).toHaveLength(1);
    expect(eventsToRecover[0].parentEventID).toBe(decryptedEvent.parentEventID);

    const errors = await ErrorHandlerMetadataDB.getAll();

    expect(errors).toHaveLength(1);
    expect(errors[0].message[0]).toBe('Sync Backend Error');
    expect(errors[0].message[1]).toBe('Error: Sync failed to save events');
  });

  it('callSyncMutationAndHandleErrors: Should create a new eventToRecover, when failing with 400', async () => {
    const eventsToPush = await fromEventsWithChangesToEventsToPush(args1);

    const args = {
      eventsToPush,
      calendarID: mockCalendarMetadata.calendarID,
      enqueueToast: null
    };

    mswServer.use(
      routerMock.mutation(Sync2Document, (_req, res, ctx) => {
        return res(ctx.status(400));
      })
    );

    const response = await callSyncMutationAndHandleErrors(args);

    expect(response).toBeUndefined();

    const eventsToRecover = await EventsToRecover.getAll();

    expect(eventsToRecover).toHaveLength(1);
    expect(eventsToRecover[0].parentEventID).toBe(decryptedEvent.parentEventID);

    const errors = await ErrorHandlerMetadataDB.getAll();

    expect(errors).toHaveLength(1);
    expect(errors[0].message[0]).toBe('Sync Backend Error');
  });

  it('Should recover event on next sync', async () => {
    await EventsToRecover.add(decryptedEvent.parentEventID);

    const event = encryptedEvent1(
      decryptedEvent.parentEventID,
      new Date().getDate(),
      decryptedEvent.plainContent.startDate,
      decryptedEvent.plainContent.endDate,
      calendarID
    );

    mswServer.use(
      getEventsFactory(
        {
          events: [{ ...event, __typename: 'CalendarEvent' }]
        },
        (req) => {
          expect(req.variables.request.calendarID).toBe(calendarID);
          expect(req.variables.request.eventsIDs).toEqual([decryptedEvent.parentEventID]);
        }
      )
    );

    await sync(null);

    expect(await EventsToRecover.getAll()).toHaveLength(0);
  });
});
