import dayjs from 'dayjs';
import 'fake-indexeddb/auto';
import clone from 'lodash/clone';
import { RecurrenceFrequency, SyncState, EventUpdateType } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { assertExists } from 'skiff-utils';

import { plainMockEvent } from '../../../../tests/mocks/encryptedEvent';
import { mockUser1 } from '../../../../tests/mocks/user';
import { mswServer, syncHandlerFactory, usersFromEmailAliasHandlerFactory } from '../../../../tests/mockServer';
import { initializeTestDB } from '../../../../tests/utils/db';
import { EventDiffState } from '../../../apollo/selectedEvent';
import { DAY_UNIT, MINUTE_UNIT } from '../../../constants/time.constants';
import { getEventDraftDiff } from '../../../utils/eventUtils';
import { DecryptedDraftModel } from '../draft/DecryptedDraftModel';

import { DecryptedEventModel } from './DecryptedEventModel';
import { getEventByID, getVirtualizedRecurrences, saveContent } from './modelUtils';

const NEW_TITLE = 'new title';
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  const original = jest.requireActual('../../../apollo/currentCalendarMetadata');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    getCurrentCalendarID: () => calendarID,
    requireCurrentCalendarID: () => calendarID
  };
});

const startDate = dayjs('2011-1-1').hour(10).minute(0).second(0);
const parentTitle = 'parent title';

const instanceTitle = 'instance title';
const instanceStartDate = startDate.add(2, 'day');

const createBaseParentAndInstance = async () => {
  const parentEvent = DecryptedEventModel.fromDecryptedEvent(
    plainMockEvent({
      decryptedContent: {
        title: parentTitle
      },
      plainContent: {
        startDate: startDate.valueOf(),
        recurrenceRule: new RecurrenceRule({
          frequency: RecurrenceFrequency.Daily,
          interval: 1,
          startDate: startDate.valueOf()
        })
      }
    })
  );

  await saveContent(parentEvent);

  const instanceEvent = DecryptedEventModel.fromDecryptedEvent(
    plainMockEvent({
      decryptedContent: {
        title: instanceTitle
      },
      plainContent: {
        startDate: instanceStartDate.valueOf(),
        parentRecurrenceID: parentEvent.parentEventID,
        recurrenceDate: instanceStartDate.valueOf(),
        recurrenceRule: parentEvent.plainContent.recurrenceRule
      }
    })
  );

  await saveContent(instanceEvent);

  return { parentEvent, instanceEvent };
};

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

describe('updateRecurrenceWithDraftOrEventContent', () => {
  test('draft from existing instance - only title change', async () => {
    const { parentEvent, instanceEvent } = await createBaseParentAndInstance();
    expect(instanceEvent.decryptedContent.title).toBe(instanceTitle);
    expect(parentEvent.decryptedContent.title).toBe(parentTitle);

    // Create a draft from the existing instance
    const draft = DecryptedDraftModel.fromDecryptedEvent(instanceEvent);
    expect(draft.decryptedContent.title).toBe(instanceTitle);

    // Change the title
    draft.decryptedContent.title = NEW_TITLE;
    draft.localMetadata.updateType = [EventUpdateType.Content];

    const originalParent = clone(parentEvent);
    // Update the parent with the draft
    await parentEvent.updateRecurrenceWithDraftOrEventContent(draft, true, true);
    const parentDiffMap = getEventDraftDiff(originalParent, parentEvent);

    // Check that the parent updated correctly
    expect(parentDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(parentDiffMap.diff.decryptedPreferences).toEqual({});
    expect(parentDiffMap.diff.plainContent).toEqual({});
    expect(parentDiffMap.diff.decryptedContent).toEqual({
      title: {
        new: NEW_TITLE,
        old: parentTitle
      }
    });

    const originalInstance = clone(instanceEvent);
    // Update the instance with the draft
    await instanceEvent.updateRecurrenceWithDraftOrEventContent(draft, false);
    const instanceDiffMap = getEventDraftDiff(originalInstance, instanceEvent);

    // Check that the instance updated correctly
    expect(instanceDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(instanceDiffMap.diff.decryptedPreferences).toEqual({});
    expect(instanceDiffMap.diff.plainContent).toEqual({});
    expect(instanceDiffMap.diff.decryptedContent).toEqual({
      title: {
        new: NEW_TITLE,
        old: instanceTitle
      }
    });
  });

  test('draft from existing instance - start time change', async () => {
    const { parentEvent, instanceEvent } = await createBaseParentAndInstance();
    expect(instanceEvent.decryptedContent.title).toBe(instanceTitle);
    expect(parentEvent.decryptedContent.title).toBe(parentTitle);

    // Create a draft from the existing instance
    const draft = DecryptedDraftModel.fromDecryptedEvent(instanceEvent);
    expect(draft.decryptedContent.title).toBe(instanceTitle);

    // Change the start time
    draft.plainContent.startDate = dayjs(draft.plainContent.startDate).add(30, MINUTE_UNIT).valueOf();
    draft.localMetadata.updateType = [EventUpdateType.Content];

    const originalParent = clone(parentEvent);
    // Update the parent with the draft
    await parentEvent.updateRecurrenceWithDraftOrEventContent(draft, true, true);
    const parentDiffMap = getEventDraftDiff(originalParent, parentEvent);

    // Check that the parent updated correctly
    expect(parentDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(parentDiffMap.diff.decryptedPreferences).toEqual({});
    expect(Object.keys(parentDiffMap.diff.plainContent)).toEqual(['startDate', 'recurrenceRule']);
    expect(parentDiffMap.diff.plainContent.startDate?.old).toBe(originalParent.plainContent.startDate);
    expect(parentDiffMap.diff.plainContent.startDate?.new).toBe(
      dayjs(originalParent.plainContent.startDate).add(30, MINUTE_UNIT).valueOf()
    );
    expect(parentDiffMap.diff.plainContent.recurrenceRule?.old).toEqual(originalParent.plainContent.recurrenceRule);
    expect(parentDiffMap.diff.plainContent.recurrenceRule?.new).toEqual({
      ...originalParent.plainContent.recurrenceRule,
      startDate: parentEvent.plainContent.startDate
    });
    expect(parentDiffMap.diff.decryptedContent).toEqual({
      title: {
        old: parentTitle,
        new: instanceTitle
      }
    });

    // Save the parent, so that the instance can be updated (parent must be saved first)
    await saveContent(parentEvent);

    const updatedInstance = await getEventByID(instanceEvent.parentEventID);
    assertExists(updatedInstance);

    const originalInstance = clone(instanceEvent);
    // Update the instance with the draft
    await updatedInstance.updateRecurrenceWithDraftOrEventContent(draft, false);
    const instanceDiffMap = getEventDraftDiff(originalInstance, updatedInstance);

    // Check that the instance updated correctly
    // We expect startDate, recurrenceDate and recurrenceRule to be updated
    expect(instanceDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(instanceDiffMap.diff.decryptedPreferences).toEqual({});
    expect(instanceDiffMap.diff.decryptedContent).toEqual({});
    expect(instanceDiffMap.diff.plainContent).toEqual({
      startDate: {
        old: originalInstance.plainContent.startDate,
        new: dayjs(originalInstance.plainContent.startDate).add(30, MINUTE_UNIT).valueOf()
      },
      recurrenceDate: {
        old: originalInstance.plainContent.recurrenceDate,
        new: dayjs(originalInstance.plainContent.recurrenceDate).add(30, MINUTE_UNIT).valueOf()
      },
      recurrenceRule: {
        old: originalInstance.plainContent.recurrenceRule,
        new: {
          ...originalInstance.plainContent.recurrenceRule,
          startDate: parentEvent.plainContent.startDate
        }
      }
    });
  });

  test('draft from existing parent - only title change', async () => {
    const { parentEvent, instanceEvent } = await createBaseParentAndInstance();
    expect(instanceEvent.decryptedContent.title).toBe(instanceTitle);
    expect(parentEvent.decryptedContent.title).toBe(parentTitle);

    // Create a draft from the existing parent
    const draft = DecryptedDraftModel.fromDecryptedEvent(parentEvent);
    expect(draft.decryptedContent.title).toBe(parentTitle);

    // Change the title
    draft.decryptedContent.title = NEW_TITLE;
    draft.localMetadata.updateType = [EventUpdateType.Content];

    const originalParent = clone(parentEvent);
    // Update the parent with the draft
    await parentEvent.updateRecurrenceWithDraftOrEventContent(draft, true, true);
    const parentDiffMap = getEventDraftDiff(originalParent, parentEvent);

    // Check that the parent updated correctly
    expect(parentDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(parentDiffMap.diff.decryptedPreferences).toEqual({});
    expect(parentDiffMap.diff.plainContent).toEqual({});
    expect(parentDiffMap.diff.decryptedContent).toEqual({
      title: {
        new: NEW_TITLE,
        old: parentTitle
      }
    });

    const originalInstance = clone(instanceEvent);
    // Update the instance with the draft
    await instanceEvent.updateRecurrenceWithDraftOrEventContent(draft, false);
    const instanceDiffMap = getEventDraftDiff(originalInstance, instanceEvent);

    // Check that the instance updated correctly
    expect(instanceDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(instanceDiffMap.diff.decryptedPreferences).toEqual({});
    expect(instanceDiffMap.diff.plainContent).toEqual({});
    expect(instanceDiffMap.diff.decryptedContent).toEqual({
      title: {
        new: NEW_TITLE,
        old: instanceTitle
      }
    });
  });

  test('draft from existing parent - start time change', async () => {
    const { parentEvent, instanceEvent } = await createBaseParentAndInstance();
    expect(instanceEvent.decryptedContent.title).toBe(instanceTitle);
    expect(parentEvent.decryptedContent.title).toBe(parentTitle);

    // Create a draft from the existing parent
    const draft = DecryptedDraftModel.fromDecryptedEvent(parentEvent);
    expect(draft.decryptedContent.title).toBe(parentTitle);

    // Change the start time
    draft.plainContent.startDate = dayjs(draft.plainContent.startDate).add(30, MINUTE_UNIT).valueOf();
    draft.localMetadata.updateType = [EventUpdateType.Content];

    const originalParent = clone(parentEvent);
    // Update the parent with the draft
    await parentEvent.updateRecurrenceWithDraftOrEventContent(draft, true, true);
    const parentDiffMap = getEventDraftDiff(originalParent, parentEvent);

    // Check that the parent updated correctly
    expect(parentDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(parentDiffMap.diff.decryptedPreferences).toEqual({});
    expect(Object.keys(parentDiffMap.diff.plainContent)).toEqual(['startDate', 'recurrenceRule']);
    expect(parentDiffMap.diff.plainContent.startDate?.old).toBe(originalParent.plainContent.startDate);
    expect(parentDiffMap.diff.plainContent.startDate?.new).toBe(
      dayjs(originalParent.plainContent.startDate).add(30, MINUTE_UNIT).valueOf()
    );
    expect(parentDiffMap.diff.plainContent.recurrenceRule?.old).toEqual(originalParent.plainContent.recurrenceRule);
    expect(parentDiffMap.diff.plainContent.recurrenceRule?.new).toEqual({
      ...originalParent.plainContent.recurrenceRule,
      startDate: parentEvent.plainContent.startDate
    });

    // Save the parent, so that the instance can be updated (parent must be saved first)
    await saveContent(parentEvent);

    const updatedInstance = await getEventByID(instanceEvent.parentEventID);
    assertExists(updatedInstance);

    const originalInstance = clone(instanceEvent);
    // Update the instance with the draft
    await updatedInstance.updateRecurrenceWithDraftOrEventContent(draft, false);
    const instanceDiffMap = getEventDraftDiff(originalInstance, updatedInstance);

    // Check that the instance updated correctly
    expect(instanceDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(instanceDiffMap.diff.decryptedPreferences).toEqual({});
    expect(instanceDiffMap.diff.decryptedContent).toEqual({
      title: {
        old: instanceTitle,
        new: parentTitle
      }
    });
    expect(instanceDiffMap.diff.plainContent).toEqual({
      startDate: {
        old: originalInstance.plainContent.startDate,
        new: dayjs(originalInstance.plainContent.startDate).add(30, MINUTE_UNIT).valueOf()
      },
      recurrenceDate: {
        old: originalInstance.plainContent.recurrenceDate,
        new: dayjs(originalInstance.plainContent.recurrenceDate).add(30, MINUTE_UNIT).valueOf()
      },
      recurrenceRule: {
        old: originalInstance.plainContent.recurrenceRule,
        new: {
          ...originalInstance.plainContent.recurrenceRule,
          startDate: parentEvent.plainContent.startDate
        }
      }
    });
  });

  test('draft from new instance - only title change', async () => {
    mockSyncAndUsersFromAliases(0);

    const { parentEvent, instanceEvent } = await createBaseParentAndInstance();
    expect(instanceEvent.decryptedContent.title).toBe(instanceTitle);
    expect(parentEvent.decryptedContent.title).toBe(parentTitle);

    // Generate a virtualized event for the instance
    const virtualizedEvent = getVirtualizedRecurrences(
      [parentEvent],
      [instanceEvent],
      startDate.valueOf(),
      startDate.add(7, DAY_UNIT).valueOf()
    )[2];
    // Create a draft from the virtualized event
    const draft = DecryptedDraftModel.fromDecryptedEvent(
      await DecryptedEventModel.fromDecryptedEventWithoutKeys(virtualizedEvent)
    );

    expect(draft.decryptedContent.title).toBe(parentTitle);
    // Change the title
    draft.decryptedContent.title = NEW_TITLE;
    draft.localMetadata.updateType = [EventUpdateType.Content];

    const originalParent = clone(parentEvent);
    // Update the parent with the draft
    await parentEvent.updateRecurrenceWithDraftOrEventContent(draft, true, true);
    const parentDiffMap = getEventDraftDiff(originalParent, parentEvent);

    // Check that the parent updated correctly
    expect(parentDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(parentDiffMap.diff.decryptedPreferences).toEqual({});
    expect(parentDiffMap.diff.plainContent).toEqual({});
    expect(parentDiffMap.diff.decryptedContent).toEqual({
      title: {
        new: NEW_TITLE,
        old: parentTitle
      }
    });

    const originalInstance = clone(instanceEvent);
    // Update the instance with the draft
    await instanceEvent.updateRecurrenceWithDraftOrEventContent(draft, false);
    const instanceDiffMap = getEventDraftDiff(originalInstance, instanceEvent);

    // Check that the instance updated correctly
    expect(instanceDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(instanceDiffMap.diff.decryptedPreferences).toEqual({});
    expect(instanceDiffMap.diff.plainContent).toEqual({});
    expect(instanceDiffMap.diff.decryptedContent).toEqual({
      title: {
        new: NEW_TITLE,
        old: instanceTitle
      }
    });
  });

  test('draft from new instance - start time change', async () => {
    mockSyncAndUsersFromAliases(0);

    const { parentEvent, instanceEvent } = await createBaseParentAndInstance();
    expect(instanceEvent.decryptedContent.title).toBe(instanceTitle);
    expect(parentEvent.decryptedContent.title).toBe(parentTitle);

    // Generate a virtualized event for the instance
    const virtualizedEvent = getVirtualizedRecurrences(
      [parentEvent],
      [instanceEvent],
      startDate.valueOf(),
      startDate.add(7, DAY_UNIT).valueOf()
    )[2];
    // Create a draft from the virtualized event
    const draft = DecryptedDraftModel.fromDecryptedEvent(
      await DecryptedEventModel.fromDecryptedEventWithoutKeys(virtualizedEvent)
    );

    expect(draft.decryptedContent.title).toBe(parentTitle);
    // Change the start time
    draft.plainContent.startDate = dayjs(draft.plainContent.startDate).add(30, MINUTE_UNIT).valueOf();
    draft.localMetadata.updateType = [EventUpdateType.Content];

    const originalParent = clone(parentEvent);
    // Update the parent with the draft
    await parentEvent.updateRecurrenceWithDraftOrEventContent(draft, true, true);
    const parentDiffMap = getEventDraftDiff(originalParent, parentEvent);
    // Check that the parent updated correctly
    expect(parentDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(parentDiffMap.diff.decryptedPreferences).toEqual({});
    expect(Object.keys(parentDiffMap.diff.plainContent)).toEqual(['startDate', 'recurrenceRule']);
    expect(parentDiffMap.diff.plainContent.startDate?.old).toBe(originalParent.plainContent.startDate);
    expect(parentDiffMap.diff.plainContent.startDate?.new).toBe(
      dayjs(originalParent.plainContent.startDate).add(30, MINUTE_UNIT).valueOf()
    );
    expect(parentDiffMap.diff.plainContent.recurrenceRule?.old).toEqual(originalParent.plainContent.recurrenceRule);
    expect(parentDiffMap.diff.plainContent.recurrenceRule?.new).toEqual({
      ...originalParent.plainContent.recurrenceRule,
      startDate: parentEvent.plainContent.startDate
    });

    // save the parent, so that the instance can be updated
    await saveContent(parentEvent);

    const updatedInstance = await getEventByID(instanceEvent.parentEventID);
    assertExists(updatedInstance);

    const originalInstance = clone(instanceEvent);
    // Update the instance with the draft
    await updatedInstance.updateRecurrenceWithDraftOrEventContent(draft, false);
    const instanceDiffMap = getEventDraftDiff(originalInstance, updatedInstance);

    // Check that the instance updated correctly
    expect(instanceDiffMap.diffState).toBe(EventDiffState.PendingChanges);
    expect(instanceDiffMap.diff.decryptedPreferences).toEqual({});
    expect(instanceDiffMap.diff.decryptedContent).toEqual({
      title: {
        old: instanceTitle,
        new: parentTitle
      }
    });
    expect(instanceDiffMap.diff.plainContent).toEqual({
      startDate: {
        old: originalInstance.plainContent.startDate,
        new: dayjs(originalInstance.plainContent.startDate).add(30, MINUTE_UNIT).valueOf()
      },
      recurrenceDate: {
        old: originalInstance.plainContent.recurrenceDate,
        new: dayjs(originalInstance.plainContent.recurrenceDate).add(30, MINUTE_UNIT).valueOf()
      },
      recurrenceRule: {
        old: originalInstance.plainContent.recurrenceRule,
        new: {
          ...originalInstance.plainContent.recurrenceRule,
          startDate: parentEvent.plainContent.startDate
        }
      }
    });
  });
});
