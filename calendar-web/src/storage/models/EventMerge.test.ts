import 'fake-indexeddb/auto';
import { generateSymmetricKey } from 'skiff-crypto';
import { v4 as uuidv4 } from 'uuid';

import { formatDate } from '../../../tests/testUtils/time';
import { dayjs } from '../../utils/dateTimeUtils';
import { initializeDB } from '../db/db';

import { DecryptedEventModel } from './event/DecryptedEventModel';
import { mergeEvents, updateConflictMarkers } from './event/mergeUtils';
import { DecryptedEvent, EventSyncState } from './event/types';

const mockEventBase: DecryptedEvent = {
  externalID: '06b92c53-d84f-489f-abaa-d4aa8f263ae7@skiff.com',
  plainContent: {
    endDate: 1664754300000,
    startDate: 1664750700000,
    creatorCalendarID: 'calendarID',
    externalCreator: null,
    lastUpdateKeyMap: {
      startDate: formatDate('2022-10-09 13:17'),
      endDate: formatDate('2022-10-09 13:17')
    },
    recurrenceDate: 0,
    sequence: 0,
    reminders: []
  },
  localMetadata: {
    currentMailTimestamp: 1664750700000,
    requestMailTimestamp: 1664750700000,
    eventEmails: { sent: [], queue: [] },
    syncState: EventSyncState.Done,
    updatedAt: formatDate('2022-10-09 13:17'),
    updateType: []
  },
  decryptedContent: {
    attendees: [],
    title: 'Event#1',
    lastUpdateKeyMap: {
      title: formatDate('2022-10-09 13:16')
    }
  },
  decryptedPreferences: {
    lastUpdateKeyMap: {},
    color: 'red'
  },
  parentEventID: uuidv4(),
  decryptedSessionKey: generateSymmetricKey()
};

describe('Merge conflicts', () => {
  beforeAll(() => {
    void initializeDB('UserID', 'calendarID');
  });

  it('Can merge new update - no conflicts', () => {
    const event2 = { ...mockEventBase, parentEventID: uuidv4() };
    const event2Model = DecryptedEventModel.fromDecryptedEvent(event2);
    updateConflictMarkers(undefined, event2Model);

    const event2TitleChanged: DecryptedEvent = {
      ...event2,
      decryptedContent: {
        ...event2.decryptedContent,
        title: 'Event#1 - update',
        lastUpdateKeyMap: { ...event2Model.decryptedContent.lastUpdateKeyMap, title: Date.now() }
      },
      decryptedPreferences: {
        lastUpdateKeyMap: event2Model.decryptedPreferences?.lastUpdateKeyMap || {}
      }
    };
    mergeEvents(event2Model, event2TitleChanged);
    expect(event2Model.decryptedContent.title).toBe(event2TitleChanged.decryptedContent.title);
    expect(event2Model.localMetadata.syncState).toBe(EventSyncState.Done);
  });

  it('Can merge new update - with conflicts', () => {
    const event3 = { ...mockEventBase, parentEventID: uuidv4() };
    const event3Model = DecryptedEventModel.fromDecryptedEvent(event3);
    updateConflictMarkers(undefined, event3Model);

    // Construct a new event with different title, branching from the original event.
    const event3TitleChangedWhileConflict: DecryptedEvent = {
      ...event3,
      decryptedContent: {
        ...event3.decryptedContent,
        title: 'Event#1 - update 2',
        lastUpdateKeyMap: { ...event3Model.decryptedContent.lastUpdateKeyMap, title: Date.now() }
      }
    };

    // Update the description on the original event.
    const newDescription = 'I added description on airplane-mode';

    event3Model.decryptedContent.description = newDescription;

    event3Model.decryptedContent.lastUpdateKeyMap.description = Date.now();

    // We should merge just the title change because our copy of the description is more recent.
    mergeEvents(event3Model, DecryptedEventModel.fromDecryptedEvent(event3TitleChangedWhileConflict));

    expect(event3Model.decryptedContent.title).toBe(event3TitleChangedWhileConflict.decryptedContent.title);
    expect(event3Model.decryptedContent.description).toBe(newDescription);
    // Checking that in case there is a conflict the syncState is WAITING
    expect(event3Model.localMetadata.syncState).toBe(EventSyncState.Waiting);
  });

  it('Can merge new update - with conflicts on the same prop - except to take the latest', () => {
    const event4 = { ...mockEventBase, parentEventID: uuidv4() };
    const event4Model = DecryptedEventModel.fromDecryptedEvent(event4);
    updateConflictMarkers(undefined, event4Model);

    const newTitle = 'myevent';
    event4Model.decryptedContent.title = newTitle;

    const newUpdatedAt = dayjs().valueOf();

    const event4SecondChangeTitle = {
      ...event4Model,
      localMetadata: {
        ...event4Model.localMetadata,
        updatedAt: newUpdatedAt
      },
      decryptedContent: {
        ...event4Model.decryptedContent,
        lastUpdateKeyMap: { ...event4Model.decryptedContent.lastUpdateKeyMap, title: newUpdatedAt },
        title: 'Event#1 - update 3'
      }
    };

    mergeEvents(event4Model, DecryptedEventModel.fromDecryptedEvent(event4SecondChangeTitle));

    expect(event4Model.decryptedContent.title).toBe(event4SecondChangeTitle.decryptedContent.title);
    // Checking that in case there is a conflict on specific prop but the BE change happen after the local one (here on title) the syncState will be DONE - no need to push back to DB
    expect(event4Model.localMetadata.syncState).toBe(EventSyncState.Done);
  });
});
