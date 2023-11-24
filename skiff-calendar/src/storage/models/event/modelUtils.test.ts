import dayjs from 'dayjs';
import 'fake-indexeddb/auto';
import { RecurrenceFrequency, SyncState } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { v4 } from 'uuid';

import { plainMockEvent } from '../../../../tests/mocks/encryptedEvent';
import { mockUser1 } from '../../../../tests/mocks/user';
import { mswServer, syncHandlerFactory, usersFromEmailAliasHandlerFactory } from '../../../../tests/mockServer';
import { initializeTestDB } from '../../../../tests/utils/db';
import { DAY_UNIT, HOUR_UNIT } from '../../../constants/time.constants';

import { DecryptedEventModel } from './DecryptedEventModel';
import { getEventByID, saveContent, updateEventsFromRule } from './modelUtils';

const calendarID = mockUser1.primaryCalendar!.calendarID;

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

jest.mock('../../../apollo/currentCalendarMetadata', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../../../apollo/currentCalendarMetadata');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    requireCurrentCalendarID: () => calendarID,
    getCurrentCalendarID: () => calendarID
  };
});

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

describe('Save events', () => {
  beforeAll(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
  });

  it('save event with deprecated title', async () => {
    const parentEventID = v4();
    const updatedAt = dayjs().valueOf();
    const startDate = 1667984400000;
    const endDate = 1667986200000;
    const title = 'Test Event';
    const checkpoint = 1667980778381;

    // generate 2 events models that represents the same event
    const eventModel1 = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        parentEventID,
        localMetadata: {
          updatedAt
        },
        decryptedContent: {
          title
        },
        plainContent: {
          startDate,
          endDate
        }
      })
    );

    const eventModel2 = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        parentEventID,
        localMetadata: {
          updatedAt
        },
        plainContent: {
          startDate,

          endDate
        },
        decryptedContent: {
          title
        }
      })
    );

    expect(eventModel1.decryptedContent.title).toBe(eventModel2.decryptedContent.title);
    expect(eventModel1.parentEventID).toBe(eventModel2.parentEventID);

    mockSyncAndUsersFromAliases(checkpoint);

    // save the event
    await saveContent(eventModel1);
    const eventFromDB = await getEventByID(parentEventID);
    expect(eventFromDB).toBeDefined();
    expect(eventFromDB?.decryptedContent.title).toBe(title);

    // save new title from event model 1
    const newTitle = 'New Test Title';
    eventModel1.decryptedContent.title = newTitle;
    mockSyncAndUsersFromAliases(checkpoint);
    await saveContent(eventModel1);

    // check the new title saved
    const eventFromDB2 = await getEventByID(parentEventID);
    expect(eventFromDB2).toBeDefined();
    expect(eventFromDB2?.decryptedContent.title).toBe(newTitle);

    // try to save event model 2 with old title
    mockSyncAndUsersFromAliases(checkpoint);
    await saveContent(eventModel2, false);

    // make sure the new title is still in the db
    const eventFromDB3 = await getEventByID(parentEventID);
    expect(eventFromDB3).toBeDefined();
    expect(eventFromDB3?.decryptedContent.title).toBe(newTitle);
  });
});

const startDate = dayjs('2021-01-01');

describe('updateEventsFromRule', () => {
  beforeAll(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
  });

  it('Should update recurrenceDates for instances, when that startDate changes', async () => {
    // Create the rules
    const oldRule = new RecurrenceRule({
      startDate: startDate.valueOf(),
      frequency: RecurrenceFrequency.Daily
    });
    const newRule = new RecurrenceRule({
      startDate: startDate.add(1, HOUR_UNIT).valueOf(),
      frequency: RecurrenceFrequency.Daily
    });

    // Create the parent event
    const parentEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          recurrenceRule: newRule
        }
      })
    );
    await saveContent(parentEvent);

    // Create the instances and save it
    const instance1 = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: startDate.add(1, DAY_UNIT).valueOf(),
          recurrenceRule: oldRule
        }
      })
    );
    const instance2 = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: startDate.add(3, DAY_UNIT).valueOf(),
          recurrenceRule: oldRule
        }
      })
    );

    await saveContent(instance1);
    await saveContent(instance2);

    // Update the instances
    await updateEventsFromRule(oldRule, newRule, parentEvent);

    // Save the parent event
    await saveContent(parentEvent);

    // Check the instances, they should have been updated
    // with the new recurrenceDate
    const updatedInstance1 = await getEventByID(instance1.parentEventID);
    expect(updatedInstance1?.plainContent.parentRecurrenceID).toBe(parentEvent.parentEventID);
    expect(updatedInstance1?.plainContent.recurrenceDate).toBe(
      dayjs(instance1.plainContent.recurrenceDate).add(1, HOUR_UNIT).valueOf()
    );

    const updatedInstance2 = await getEventByID(instance2.parentEventID);
    expect(updatedInstance2?.plainContent.parentRecurrenceID).toBe(parentEvent.parentEventID);
    expect(updatedInstance2?.plainContent.recurrenceDate).toBe(
      dayjs(instance2.plainContent.recurrenceDate).add(1, HOUR_UNIT).valueOf()
    );
  });

  it('Should delete irrelevant instances, if frequency has changed', async () => {
    /**
         * Old rule: Daily
         *
         * [ Day 1  ] [       Day 2          ] [   Day 3    ] [    Day 4    ] [    Day 5    ]
         * [ Parent ] [      Instance 1      ] [ Instance 2 ] [ Virtualized ] [ Virtualized ]
         *
         * New rule: Every 2 days

         * [ Day 1  ] [       Day 2          ] [   Day 3    ] [    Day 4    ] [    Day 5    ]
         * [ Parent ] [ Instance 1 - Deleted ] [ Instance 2 ] [    -----    ] [ Virtualized ]
         *
         */

    // Create the rules
    const oldRule = new RecurrenceRule({
      startDate: startDate.valueOf(),
      frequency: RecurrenceFrequency.Daily,
      interval: 1
    });
    const newRule = new RecurrenceRule({
      startDate: startDate.valueOf(),
      frequency: RecurrenceFrequency.Daily,
      interval: 2
    });

    // Create the parent event and save it
    const parentEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          recurrenceRule: newRule,
          recurrenceDate: 0
        }
      })
    );
    await saveContent(parentEvent);
    const oldParentEventID = parentEvent.parentEventID;

    // Create the instances and save them
    const instance1 = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: startDate.add(1, DAY_UNIT).valueOf(),
          recurrenceRule: oldRule
        }
      })
    );
    const instance2 = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: startDate.add(2, DAY_UNIT).valueOf(),
          recurrenceRule: oldRule
        }
      })
    );
    await saveContent(instance1);
    await saveContent(instance2);

    // Update the instances
    await updateEventsFromRule(oldRule, newRule, parentEvent);
    const newParentEventID = parentEvent.parentEventID;

    // Save the parent event
    await saveContent(parentEvent);

    // Old parent, should be deleted
    const parent = await getEventByID(oldParentEventID, true);
    expect(parent?.plainContent.deleted).toBe(true);

    // Bad instance, should be deleted
    const updatedInstance1 = await getEventByID(instance1.parentEventID, true);
    expect(updatedInstance1?.plainContent.deleted).toBe(true);

    // Good instance, should be moved to the new parent
    const updatedInstance2 = await getEventByID(instance2.parentEventID);
    expect(updatedInstance2?.plainContent.parentRecurrenceID).toBe(newParentEventID);
    expect(updatedInstance2?.plainContent.recurrenceDate).toBe(instance2.plainContent.recurrenceDate);

    // New parent, should exist
    const newParent = await getEventByID(newParentEventID);
    expect(newParent?.plainContent.recurrenceRule).toEqual(newRule);
  });
});
