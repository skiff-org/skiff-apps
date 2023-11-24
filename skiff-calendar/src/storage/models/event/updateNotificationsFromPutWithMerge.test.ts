import 'fake-indexeddb/auto';

import { waitFor } from '@testing-library/react';
import { RecurrenceFrequency } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { assertExists } from 'skiff-utils';

import { plainMockEvent } from '../../../../tests/mocks/encryptedEvent';
import { mockUser1 } from '../../../../tests/mocks/user';
import { initializeTestDB } from '../../../../tests/utils/db';
import { DAY_UNIT, HOUR_UNIT } from '../../../constants/time.constants';
import { SaveDraftModalRecurringAction } from '../../../redux/reducers/modalTypes';
import { dayjs } from '../../../utils/dateTimeUtils';
import { createWebviewEventUpdate, updateLocalNotifications, WebviewEventUpdate } from '../../../utils/mobileAppUtils';
import { isRecurringParent } from '../../../utils/recurringUtils';
import { DecryptedDraftModel } from '../draft/DecryptedDraftModel';
import { saveDraft } from '../draft/modelUtils';
import { saveDraftToEvent } from '../draft/utils';

import { DecryptedEventModel } from './DecryptedEventModel';
import {
  getEventsByExternalID,
  getVirtualizedRecurrences,
  NOTIFICATION_VIRTUAL_CALC_TIME,
  putEventWithMerge
} from './modelUtils';

const calendarID = mockUser1.primaryCalendar?.calendarID as string;

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    getCurrentUserData: () => mockUser1,
    requireCurrentUserData: () => mockUser1,
    isMobileApp: () => true
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

jest.mock('../../../utils/mobileAppUtils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('../../../utils/mobileAppUtils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    updateLocalNotifications: jest.fn()
  };
});

const getNotificationUniqueKey = (props: {
  isRecurring: boolean;
  parentEventID: string;
  parentRecurrenceID?: string;
  recurrenceDate: number;
}) => {
  const { isRecurring, parentEventID, parentRecurrenceID, recurrenceDate } = props;
  if (isRecurring) {
    if (!parentRecurrenceID) {
      // Parent event
      return parentEventID;
    } else {
      // Child event
      return `${parentRecurrenceID}-${recurrenceDate}`;
    }
  } else {
    return parentEventID;
  }
};

const byUniqueKey = (a: WebviewEventUpdate, b: WebviewEventUpdate) =>
  getNotificationUniqueKey(a).localeCompare(getNotificationUniqueKey(b));

const expectEventsNotificationsToBeEqual = (a: WebviewEventUpdate[], b: WebviewEventUpdate[]) => {
  const sortedA = a.sort(byUniqueKey);
  const sortedB = b.sort(byUniqueKey);

  // Uncomment when debugging to see the events
  // console.log(
  //   'events',
  //   sortedA.map((e) => `${getNotificationUniqueKey(e)} - ${e.title} [${e.deleted ? 'deleted' : 'updated / created'}]`)
  // );
  // console.log(
  //   'expected',
  //   sortedB.map((e) => `${getNotificationUniqueKey(e)} - ${e.title} [${e.deleted ? 'deleted' : 'updated / created'}]`)
  // );

  for (let i = 0; i < sortedA.length; i++) {
    try {
      expect(sortedB[i]).toBeDefined();
      expect(sortedA[i].title).toBe(sortedB[i].title);
      expect(sortedA[i].startDate).toEqual(sortedB[i].startDate);
      expect(sortedA[i].deleted).toBe(sortedB[i].deleted);
    } catch (e) {
      console.error('Error at index', i);
      throw e;
    }
  }
  // put last to get the full list of events and more explicit error message
  expect(a.length).toBe(b.length);
};

/**
 * Wait for the updateLocalNotifications to be called with the expected number of times
 * and then check that the events are the same as the expected ones
 */
const expectUpdateNotificationsToBeCalledWith = async (
  expectedNumTimesCalled: number,
  expected: WebviewEventUpdate[]
) => {
  await waitFor(() => {
    expect(updateLocalNotifications).toHaveBeenCalledTimes(expectedNumTimesCalled);
    return true;
  });

  const events = (updateLocalNotifications as jest.Mock<unknown, Parameters<typeof updateLocalNotifications>>).mock
    .calls[expectedNumTimesCalled - 1][0];

  expectEventsNotificationsToBeEqual(events, expected);
};

/**
 * Does not wait for the updateLocalNotifications to be called,
 * just check that the events are the same as the expected ones for the specified call index
 * and then check that the events are the same as the expected ones
 */
const expectUpdateNotificationToBeCalledWithByCallIndex = (
  expectedNumTimesCalled: number,
  expected: WebviewEventUpdate[]
) => {
  const calls = (updateLocalNotifications as jest.Mock<unknown, Parameters<typeof updateLocalNotifications>>).mock
    .calls;
  expect(calls.length).toBeGreaterThanOrEqual(expectedNumTimesCalled);

  const events = calls[expectedNumTimesCalled - 1][0];

  expectEventsNotificationsToBeEqual(events, expected);
};

describe('updateNotificationsFromPutWithMerge', () => {
  beforeAll(async () => {
    await initializeTestDB(mockUser1.publicKey.key, mockUser1.publicKey.key, calendarID);
  });

  beforeEach(() => {
    (updateLocalNotifications as jest.Mock<unknown, Parameters<typeof updateLocalNotifications>>).mockClear();
  });

  /**
   * This should delete all the old notifications for the recurrences
   * and create new ones for the new recurrences
   * Also should update the parent event
   */
  it('Simple start time change of the parent', async () => {
    const now = dayjs();
    const oldEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          startDate: now.valueOf(),
          endDate: now.add(1, HOUR_UNIT).valueOf(),
          recurrenceRule: new RecurrenceRule({
            startDate: now.valueOf(),
            frequency: RecurrenceFrequency.Daily
          })
        }
      })
    );

    await putEventWithMerge(oldEvent);

    const addedNotificationsOnFirstUpdate = getVirtualizedRecurrences(
      [oldEvent],
      [],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    await expectUpdateNotificationsToBeCalledWith(1, [
      createWebviewEventUpdate(calendarID)(oldEvent),
      ...addedNotificationsOnFirstUpdate
    ]);

    const newEvent = DecryptedEventModel.fromDecryptedEvent({
      ...oldEvent,
      plainContent: {
        ...oldEvent.plainContent,
        startDate: now.add(1, HOUR_UNIT).valueOf(),
        endDate: now.add(2, HOUR_UNIT).valueOf(),
        recurrenceRule: new RecurrenceRule({
          startDate: now.add(1, HOUR_UNIT).valueOf(),
          frequency: RecurrenceFrequency.Daily
        })
      }
    });

    await putEventWithMerge(newEvent);

    const addedNotifications = getVirtualizedRecurrences(
      [newEvent],
      [],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    const removedNotifications = getVirtualizedRecurrences(
      [oldEvent],
      [],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    )
      .map((e) => ({
        ...e,
        plainContent: {
          ...e.plainContent,
          deleted: true
        }
      }))
      .map(createWebviewEventUpdate(calendarID));

    await expectUpdateNotificationsToBeCalledWith(2, [
      createWebviewEventUpdate(calendarID)(newEvent),
      ...addedNotifications,
      ...removedNotifications
    ]);
  });

  /**
   * This should simply update the instance
   */
  it('Simple start time change of an instance', async () => {
    const now = dayjs();
    const oldEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          startDate: now.valueOf(),
          endDate: now.add(1, HOUR_UNIT).valueOf(),
          recurrenceRule: new RecurrenceRule({
            startDate: now.valueOf(),
            frequency: RecurrenceFrequency.Daily
          }),
          recurrenceDate: now.add(1, DAY_UNIT).valueOf(),
          parentRecurrenceID: 'parent'
        }
      })
    );

    await putEventWithMerge(oldEvent);

    await expectUpdateNotificationsToBeCalledWith(1, [createWebviewEventUpdate(calendarID)(oldEvent)]);

    const newEvent = DecryptedEventModel.fromDecryptedEvent({
      ...oldEvent,
      plainContent: {
        ...oldEvent.plainContent,
        startDate: now.add(1, HOUR_UNIT).valueOf(),
        endDate: now.add(2, HOUR_UNIT).valueOf()
      }
    });

    await putEventWithMerge(newEvent);

    await expectUpdateNotificationsToBeCalledWith(2, [createWebviewEventUpdate(calendarID)(newEvent)]);
  });

  /**
   * This should
   * - delete all old recurrences and create new ones
   * - update the parent event
   * - delete and update the instance
   */
  it('Parent start time change with instance', async () => {
    const now = dayjs();
    const parentEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          startDate: now.valueOf(),
          endDate: now.add(1, HOUR_UNIT).valueOf(),
          recurrenceRule: new RecurrenceRule({
            startDate: now.valueOf(),
            frequency: RecurrenceFrequency.Daily
          })
        }
      })
    );

    // First updateNotification call here
    await putEventWithMerge(parentEvent);

    const instance = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        decryptedContent: {
          title: 'Instance'
        },
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: now.add(1, DAY_UNIT).valueOf(),
          startDate: now.add(1, DAY_UNIT).valueOf(),
          endDate: now.add(1, DAY_UNIT).add(1, HOUR_UNIT).valueOf()
        }
      })
    );

    await putEventWithMerge(instance);

    await expectUpdateNotificationsToBeCalledWith(2, [createWebviewEventUpdate(calendarID)(instance)]);

    const newParentEvent = DecryptedEventModel.fromDecryptedEvent({
      ...parentEvent,
      plainContent: {
        ...parentEvent.plainContent,
        startDate: now.add(1, HOUR_UNIT).valueOf(),
        endDate: now.add(2, HOUR_UNIT).valueOf(),
        recurrenceRule: new RecurrenceRule({
          startDate: now.add(1, HOUR_UNIT).valueOf(),
          frequency: RecurrenceFrequency.Daily
        })
      }
    });

    await putEventWithMerge(newParentEvent);

    // New instance after parent change (only recurrenceDate changed)
    const newInstance = DecryptedEventModel.fromDecryptedEvent({
      ...instance,
      plainContent: {
        ...instance.plainContent,
        recurrenceDate: dayjs(instance.plainContent.recurrenceDate).add(1, HOUR_UNIT).valueOf()
      }
    });

    const addedNotifications = getVirtualizedRecurrences(
      [newParentEvent],
      [newInstance],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    const removedNotifications = getVirtualizedRecurrences(
      [parentEvent],
      [instance],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    )
      .map((e) => ({
        ...e,
        plainContent: {
          ...e.plainContent,
          deleted: true
        }
      }))
      .map(createWebviewEventUpdate(calendarID));

    await expectUpdateNotificationsToBeCalledWith(3, [
      ...addedNotifications,
      ...removedNotifications,
      createWebviewEventUpdate(calendarID)({ ...instance, plainContent: { ...instance.plainContent, deleted: true } }),
      createWebviewEventUpdate(calendarID)(newInstance),
      createWebviewEventUpdate(calendarID)(newParentEvent)
    ]);
  });

  /**
   * This should
   * - delete all old recurrences and create new ones in the new intervals
   * - update the not deleted instance
   * - delete the old parent event
   */
  it('Parent interval change, with instances', async () => {
    const now = dayjs();
    const parentEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        decryptedContent: {
          title: 'Event 1'
        },
        plainContent: {
          startDate: now.valueOf(),
          endDate: now.add(1, HOUR_UNIT).valueOf(),
          recurrenceRule: new RecurrenceRule({
            startDate: now.valueOf(),
            frequency: RecurrenceFrequency.Daily
          })
        }
      })
    );

    // First updateNotification call here
    await putEventWithMerge(parentEvent);

    const instanceThatWillNotFitNewRule = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        decryptedContent: {
          title: 'Instance That Will Not Fit New Rule'
        },
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: now.add(1, DAY_UNIT).valueOf(),
          startDate: now.add(1, DAY_UNIT).valueOf(),
          endDate: now.add(1, DAY_UNIT).add(1, HOUR_UNIT).valueOf()
        }
      })
    );

    const instanceThatWillFitNewRule = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        decryptedContent: {
          title: 'Instance That Will Fit New Rule'
        },
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: now.add(2, DAY_UNIT).valueOf(),
          startDate: now.add(2, DAY_UNIT).valueOf(),
          endDate: now.add(2, DAY_UNIT).add(1, HOUR_UNIT).valueOf()
        }
      })
    );

    // Second updateNotification call here
    await putEventWithMerge(instanceThatWillNotFitNewRule);

    // Third updateNotification call here
    await putEventWithMerge(instanceThatWillFitNewRule);

    // Update only the interval
    const newParentEvent = DecryptedEventModel.fromDecryptedEvent({
      ...parentEvent,
      plainContent: {
        ...parentEvent.plainContent,
        recurrenceRule: new RecurrenceRule({
          startDate: parentEvent.plainContent.startDate,
          frequency: RecurrenceFrequency.Daily,
          interval: 2
        })
      }
    });

    // Fourth updateNotification call here
    await putEventWithMerge(newParentEvent);

    // Fetch the new parent
    // We are fetching with the external ID because the parent event ID is changed in the putEventWithMerge function
    // The external ID is the same
    const eventsInNewSeries = await getEventsByExternalID(parentEvent.externalID);
    const newParentEventID = eventsInNewSeries.find(isRecurringParent)?.parentEventID;
    assertExists(newParentEventID, 'New parent event ID should exist');
    newParentEvent.parentEventID = newParentEventID;

    const addedNotifications = getVirtualizedRecurrences(
      [newParentEvent],
      [
        {
          ...instanceThatWillFitNewRule,
          plainContent: { ...instanceThatWillFitNewRule.plainContent, parentRecurrenceID: newParentEventID }
        }
      ],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    const removedNotifications = getVirtualizedRecurrences(
      [parentEvent],
      [instanceThatWillFitNewRule, instanceThatWillNotFitNewRule],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    )
      .map((e) => ({
        ...e,
        plainContent: {
          ...e.plainContent,
          deleted: true
        }
      }))
      .map(createWebviewEventUpdate(calendarID));

    // See all the calls before in the test
    await expectUpdateNotificationsToBeCalledWith(4, [
      ...addedNotifications,
      ...removedNotifications,
      // Delete old parent event
      createWebviewEventUpdate(calendarID)({
        ...parentEvent,
        plainContent: { ...parentEvent.plainContent, deleted: true }
      }),
      // Create new parent event
      createWebviewEventUpdate(calendarID)(newParentEvent),
      // Delete old instance
      createWebviewEventUpdate(calendarID)({
        ...instanceThatWillFitNewRule,
        plainContent: { ...instanceThatWillFitNewRule.plainContent, deleted: true }
      }),
      // Create new instance
      createWebviewEventUpdate(calendarID)({
        ...instanceThatWillFitNewRule,
        plainContent: { ...instanceThatWillFitNewRule.plainContent, parentRecurrenceID: newParentEvent.parentEventID }
      }),
      createWebviewEventUpdate(calendarID)({
        ...instanceThatWillNotFitNewRule,
        plainContent: { ...instanceThatWillNotFitNewRule.plainContent, deleted: true }
      })
    ]);
  });

  /**
   * This should update the parent event and all instances
   */
  it('This and future title change', async () => {
    let now = dayjs();

    const parentEvent = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        decryptedContent: {
          title: 'Title Wow'
        },
        plainContent: {
          startDate: now.valueOf(),
          endDate: now.add(1, HOUR_UNIT).valueOf(),
          recurrenceRule: new RecurrenceRule({
            startDate: now.valueOf(),
            frequency: RecurrenceFrequency.Daily
          })
        }
      })
    );

    // First updateNotification call here
    await putEventWithMerge(parentEvent);

    const draftInstance = DecryptedDraftModel.fromDecryptedEvent(
      plainMockEvent({
        decryptedContent: {
          title: 'Title Change !'
        },
        plainContent: {
          parentRecurrenceID: parentEvent.parentEventID,
          recurrenceDate: now.add(5, DAY_UNIT).valueOf(),
          recurrenceRule: parentEvent.plainContent.recurrenceRule
        }
      })
    );

    await saveDraft(draftInstance);

    await saveDraftToEvent(draftInstance.parentEventID, undefined, SaveDraftModalRecurringAction.ThisAndFutureEvents);

    /**
     * We expect 3 calls here:
     * 1. The parent event
     * 2. The instance update with the new instances
     * 3. The parent even (rule slice) and deleted instances
     */
    await waitFor(() => {
      expect(updateLocalNotifications).toHaveBeenCalledTimes(3);
      return true;
    });

    // First call is for the parent event, already tested
    // Second to third are the interesting ones

    // Create parent from instance
    const parentFromInstance = DecryptedEventModel.fromDecryptedDraft({
      ...draftInstance,
      plainContent: {
        ...draftInstance.plainContent,
        recurrenceRule: new RecurrenceRule({
          startDate: draftInstance.plainContent.startDate,
          frequency: RecurrenceFrequency.Daily
        }),
        recurrenceDate: 0,
        parentRecurrenceID: undefined
      }
    });

    now = dayjs();

    const addedNotificationsForInstance = getVirtualizedRecurrences(
      [parentFromInstance],
      [],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    expectUpdateNotificationToBeCalledWithByCallIndex(2, [
      ...addedNotificationsForInstance,
      createWebviewEventUpdate(calendarID)(parentFromInstance)
    ]);

    // Fetch the new parent
    // We are fetching with the external ID because the parent event ID is changed in the putEventWithMerge function
    // The external ID is the same
    const eventsInNewSeries = await getEventsByExternalID(parentEvent.externalID);
    const newParentEvent = eventsInNewSeries.find(isRecurringParent);
    assertExists(newParentEvent, 'New parent event should exist');

    const addedNotifications = getVirtualizedRecurrences(
      [newParentEvent],
      [],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    const removedNotifications = getVirtualizedRecurrences(
      [
        {
          ...parentEvent,
          plainContent: {
            ...parentEvent.plainContent,
            deleted: true
          }
        }
      ],
      [],
      now.valueOf(),
      now.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
    ).map(createWebviewEventUpdate(calendarID));

    // Update parent
    await expectUpdateNotificationsToBeCalledWith(3, [
      ...addedNotifications,
      ...removedNotifications,
      createWebviewEventUpdate(calendarID)(newParentEvent),
      createWebviewEventUpdate(calendarID)({
        ...parentEvent,
        plainContent: {
          ...parentEvent.plainContent,
          deleted: true
        }
      })
    ]);
  });
});
