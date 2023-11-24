import 'fake-indexeddb/auto';
import { CurrentUserEmailAliasesQuery, models } from 'skiff-front-graphql';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { AttendeePermission } from '../../../../generated/graphql';
import { plainMockEvent } from '../../../../tests/mocks/encryptedEvent';
import { mockUser1 } from '../../../../tests/mocks/user';
import { mswServer, currentUserAliasesFactory } from '../../../../tests/mockServer';
import { initializeTestDB } from '../../../../tests/utils/db';
import { db } from '../../../storage/db/db';
import { CalendarMetadataDB } from '../../../storage/models/CalendarMetadata';
import { DecryptedEventModel } from '../../../storage/models/event/DecryptedEventModel';
import { saveContent } from '../../../storage/models/event/modelUtils';

import { updateEventsWithDeletedAlias } from './updateEventsWithDeletedAliases';

const ownerCalendarID = mockUser1.primaryCalendar!.calendarID;
const newAlias = 'newAlias@skiff.town';
const oldAlias = 'oldAlias@skiff.town';

const mockCalendarIDFunctions = jest.fn<string, undefined[]>().mockReturnValue(ownerCalendarID);
const mockCalendarFunctions = jest.fn<CalendarMetadataDB, undefined[]>().mockReturnValue(
  CalendarMetadataDB.fromMetadata({
    calendarID: ownerCalendarID,
    publicKey: '',
    encryptedPrivateKey: '',
    initializedLocalDB: true,
    encryptedByKey: ''
  })
);

jest.mock('../../../apollo/currentCalendarMetadata', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../../../apollo/currentCalendarMetadata');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    getCurrentCalendarID: () => mockCalendarIDFunctions(),
    requireCurrentCalendarID: () => mockCalendarIDFunctions(),
    getCurrentCalendarMetadata: () => mockCalendarFunctions(),
    requireCurrentCalendarMetadata: () => mockCalendarFunctions()
  };
});

const mockUserFunctions = jest.fn<models.User, undefined[]>().mockReturnValue(mockUser1);

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    getCurrentUserData: () => mockUserFunctions(),
    requireCurrentUserData: () => mockUserFunctions(),
    getDefaultEmailAlias: () => newAlias
  };
});

const READ_PERMISSION_EVENT = v4();

const events = [
  plainMockEvent({}, { permission: AttendeePermission.Owner, email: newAlias }),
  plainMockEvent({}, { permission: AttendeePermission.Read, email: newAlias }),
  plainMockEvent({}, { permission: AttendeePermission.Owner, email: oldAlias }),
  plainMockEvent({ parentEventID: READ_PERMISSION_EVENT }, { permission: AttendeePermission.Read, email: oldAlias }) // in this event the attendee should be deleted
].map((event) => DecryptedEventModel.fromDecryptedEvent(event));

const generateAliasResponse = (userID: string, emailAliases: string[]): CurrentUserEmailAliasesQuery => ({
  currentUser: { userID, emailAliases, __typename: 'User' }
});

describe('Calendar Maintenance', () => {
  beforeAll(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, ownerCalendarID);
    await Promise.all(events.map((event) => saveContent(event)));
  });

  test('update events with deleted alias', async () => {
    mockCalendarIDFunctions.mockReturnValue(ownerCalendarID);
    // mock request to get all users aliases to return only the new alias
    mswServer.use(currentUserAliasesFactory(generateAliasResponse(ownerCalendarID, [newAlias])));

    await updateEventsWithDeletedAlias(events);

    assertExists(db, 'db is not defined');
    const updatedEventsFromDB = await DecryptedEventModel.fromManyDexie(await db.events.toArray());

    const allUserAttendeesFromEvents = updatedEventsFromDB.map((event) =>
      event.decryptedContent.attendees.find((attendee) => attendee.id === ownerCalendarID)
    );
    expect(allUserAttendeesFromEvents.length).toBe(4);

    // make sure the attendee with the read permission has not changed]
    const eventWithDeletedAlias = updatedEventsFromDB.find((event) => event.parentEventID === READ_PERMISSION_EVENT);
    const readerAttendee = eventWithDeletedAlias?.decryptedContent.attendees.find(
      (attendee) => attendee.id === ownerCalendarID
    );
    expect(readerAttendee?.email).toBe(oldAlias);

    const newAliasesAttendee = allUserAttendeesFromEvents.filter(
      (attendee) => attendee?.email === newAlias && !attendee.deleted
    );
    // 3 event had new alias or was with owner permissions - events with old alias should have been changed and saved
    expect(newAliasesAttendee.length).toBe(3);
  });
});
