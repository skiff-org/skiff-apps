import dayjs from 'dayjs';
import { v4 } from 'uuid';
import 'fake-indexeddb/auto';

import { db } from '../src/storage/db/db';
import { ErrorHandlerMetadataDB } from '../src/storage/models/ErrorHandlerMetadata';

import { mockUser1 } from './mocks/user';
import { initializeTestDB } from './utils/db';

const calendarID = mockUser1.primaryCalendar!.calendarID;

describe('create erroneous event', () => {
  beforeEach(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
  });

  afterEach(async () => {
    await db?.delete();
  });

  it('add event in error handler state', async () => {
    const parentEventID = v4();
    const lastUpdated = dayjs().valueOf();
    await ErrorHandlerMetadataDB.create({
      parentEventID: parentEventID,
      calendarID: calendarID,
      lastUpdated: lastUpdated,
      message: []
    });
    const state = await ErrorHandlerMetadataDB.get(parentEventID);
    expect(state).not.toBeNull();
    expect(state?.parentEventID).toEqual(parentEventID);
    expect(state?.calendarID).toEqual(calendarID);
    expect(state?.lastUpdated).toEqual(lastUpdated);
  });
});
