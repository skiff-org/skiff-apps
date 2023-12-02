import Dexie from 'dexie';
import clone from 'lodash/clone';
import debounce from 'lodash/debounce';
import difference from 'lodash/difference';
import { isMobileApp, requireCurrentUserData } from 'skiff-front-utils';
import { AttendeePermission, EventUpdateType } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { assertExists, filterExists } from 'skiff-utils';
import { v4 } from 'uuid';

import {
  getCurrentCalendarID,
  getCurrentCalendarMetadata,
  requireCurrentCalendarID
} from '../../../apollo/currentCalendarMetadata';
import { MS_UNIT } from '../../../constants/time.constants';
import { toEncryptedEvent } from '../../../crypto/cryptoWebWorker';
import { dayjs } from '../../../utils/dateTimeUtils';
import { createWebviewEventUpdate, sliceEvents, updateLocalNotifications } from '../../../utils/mobileAppUtils';
import { queryAllEventRecurrences, queryAllRecurringParents, queryEventsBetween } from '../../../utils/queryUtils';
import { generateRecurrenceMap, isRecurringParent } from '../../../utils/recurringUtils';
import { requireAllResolvedAndSplitAttendees } from '../../crypto/utils';
import { db } from '../../db/db';
import { EncryptedEvent } from '../../schemas/event';
import { DecryptedDraft, isDraft, isEvent } from '../draft/types';

import { DecryptedEventModel } from './DecryptedEventModel';
import { mergeEvents, updateConflictMarkers } from './mergeUtils';
import { DecryptedEvent, EventLocalMetadata, EventSyncState } from './types';

export const NOTIFICATION_VIRTUAL_CALC_TIME = 1000 * 60 * 60 * 24 * 90; // 90 days in ms

/**
 * Get Virtualized events in range from the recurring parents
 *
 * This function generates events from each parent event that has recurrence rule
 * It will remove the events that are already in the events array
 *
 * @param recurringParents List of all recurring parents
 * @param events List of all events from start date to end date
 * @param startDate Start date of the range
 * @param endDate End date of the range
 */
export const getVirtualizedRecurrences = (
  recurringParents: (DecryptedEvent | DecryptedDraft)[],
  events: DecryptedEvent[],
  startDate: number,
  endDate: number
): DecryptedEventModel[] => {
  // Creates a map of parent event ID to all non-virtualized events dates
  // This is used to remove the dates that already have a non-virtualized event from the virtualized events
  const recurrenceIDsMaps = generateRecurrenceMap(events);

  const recurringEventsWithAllStartDates = recurringParents.map((recurringSeriesParent) => {
    const rule = recurringSeriesParent.plainContent.recurrenceRule;
    const parentEventLength = recurringSeriesParent.plainContent.endDate - recurringSeriesParent.plainContent.startDate;
    // All dates from the recurrence rule in the range
    const recurringStartDates = rule?.getDatesInRange(new Date(startDate - parentEventLength), new Date(endDate));

    return {
      recurringSeriesParent,
      recurringSeriesStartDates: recurringStartDates?.filter((dateString) => {
        // Do not create a virtualized event for the first date (This is the parent)
        if (dateString.valueOf() === recurringSeriesParent.plainContent.startDate) return false;
        // All dates that already have a non-virtualized event
        const recurrences = recurrenceIDsMaps.get(recurringSeriesParent.parentEventID);
        // Filters out the dates that already have a non-virtualized event
        return !recurrences?.includes(dateString.valueOf());
      })
    };
  });

  // Remove all recurring series that do not have any dates in the range
  const recurringSeriesParentsWithDates = recurringEventsWithAllStartDates.filter(
    (recurringEventWithAllStartDates) => !!recurringEventWithAllStartDates.recurringSeriesStartDates?.length
  );

  const allVirtualizedRecurringEvents = recurringSeriesParentsWithDates
    .map(({ recurringSeriesParent, recurringSeriesStartDates }) => {
      // Type guard to make sure that the recurring series parent is a recurring series
      if (!isRecurringParent(recurringSeriesParent)) return [];

      // Series event duration in milliseconds
      const millisecondDuration =
        recurringSeriesParent.plainContent.endDate - recurringSeriesParent.plainContent.startDate;

      const sequence = isEvent(recurringSeriesParent) ? recurringSeriesParent.plainContent.sequence : 0;

      return recurringSeriesStartDates?.map((date) => {
        const startDateDayjs = dayjs(date.valueOf());

        // Generate the virtualized event from the parent event
        const parentEventID = v4();
        return DecryptedEventModel.fromDecryptedEvent({
          ...recurringSeriesParent,
          parentEventID,
          externalID: recurringSeriesParent.externalID,
          plainContent: {
            lastUpdateKeyMap: {},
            ...recurringSeriesParent.plainContent,
            startDate: startDateDayjs.valueOf(),
            endDate: startDateDayjs.add(millisecondDuration, MS_UNIT).valueOf(),
            recurrenceRule: new RecurrenceRule(recurringSeriesParent.plainContent.recurrenceRule),
            recurrenceDate: startDateDayjs.valueOf(),
            parentRecurrenceID: recurringSeriesParent.parentEventID,
            sequence
          },
          localMetadata: {
            syncState: EventSyncState.Done,
            currentMailTimestamp: 0,
            requestMailTimestamp: 0,
            updatedAt: new Date().getTime(),
            eventEmails: { sent: [], queue: [] },
            ...recurringSeriesParent.localMetadata
          },
          decryptedContent: {
            lastUpdateKeyMap: {},
            ...recurringSeriesParent.decryptedContent
          },
          decryptedPreferences: {
            lastUpdateKeyMap: {},
            ...recurringSeriesParent.decryptedPreferences
          }
        });
      });
    })
    .flat()
    .filter(filterExists);

  return allVirtualizedRecurringEvents;
};

// Exported for testing purposes only,
// do not use this function directly
export const updateNotificationsFromPutWithMerge = async (
  mergedEvent: DecryptedEvent,
  oldEvent: DecryptedEvent | undefined,
  eventsFromRuleUpdateResult: EventsFromRuleUpdateResult | undefined
) => {
  const decryptedAdded = eventsFromRuleUpdateResult?.added.length
    ? await DecryptedEventModel.fromManyDexie(eventsFromRuleUpdateResult.added)
    : [];

  const decryptedRemoved = (
    eventsFromRuleUpdateResult?.deleted.length
      ? await DecryptedEventModel.fromManyDexie(eventsFromRuleUpdateResult.deleted)
      : []
  )
    // We need to mark the events as deleted so that the notification is removed
    // Not all events in this array will have the deleted flag set to true
    // See updateEventFromRule the case that the rule does not change interval
    .map((_event) => ({ ..._event, plainContent: { ..._event.plainContent, deleted: true } }));

  const events = [mergedEvent, ...decryptedAdded, ...decryptedRemoved];

  if (isRecurringParent(mergedEvent)) {
    assertExists(db, 'createWebviewEventUpdate: db is not defined');
    const recurrences = await queryAllEventRecurrences(db.events, mergedEvent.parentEventID);
    const decryptedRecurrences = await DecryptedEventModel.fromManyDexie(recurrences);
    const now = new Date().valueOf();
    const virtualRecurrences = isRecurringParent(mergedEvent)
      ? getVirtualizedRecurrences([mergedEvent], decryptedRecurrences, now, now + NOTIFICATION_VIRTUAL_CALC_TIME)
      : [];

    // Creating virtual recurrences for new parent -> For Update
    events.push(...virtualRecurrences);

    if (oldEvent && eventsFromRuleUpdateResult) {
      if (eventsFromRuleUpdateResult?.deleteOldParent) {
        events.push({ ...oldEvent, plainContent: { ...oldEvent.plainContent, deleted: true } });
      }

      // Creating virtual recurrences for old parent -> For Deletion
      const oldVirtualRecurrences = getVirtualizedRecurrences(
        [oldEvent],
        decryptedRemoved,
        now,
        now + NOTIFICATION_VIRTUAL_CALC_TIME
      );
      events.push(
        ...oldVirtualRecurrences.map((_event) => ({
          ..._event,
          plainContent: { ..._event.plainContent, deleted: true }
        }))
      );
    }
  }

  const calendarID = getCurrentCalendarID();
  if (calendarID) updateLocalNotifications(events.map(createWebviewEventUpdate(calendarID)));
};

export const addBulkNewEvents = async (events: EncryptedEvent[]) => {
  assertExists(db, 'addBulkNewEvents: DB is closed');
  const result = await db.transaction('rw!', db.events, db.calendarMetadata, async () => {
    assertExists(db, 'addBulkNewEvents: DB is closed');
    try {
      const dexieEvent = await db.events.bulkAdd(events);
      return dexieEvent;
    } catch (err) {
      console.error(err);
    }
  });

  if (result) {
    void (async () => {
      const decryptedEvent = await DecryptedEventModel.fromManyDexie(events);
      await Promise.all(
        decryptedEvent.map(async (event) => updateNotificationsFromPutWithMerge(event, undefined, undefined))
      );
    })();
  }

  return result;
};

interface EventsFromRuleUpdateResult {
  added: EncryptedEvent[];
  deleted: EncryptedEvent[];
  deleteOldParent: boolean;
}

/**
 * This function is used when updating a recurring parent event
 * It will update all the recurrences of this event as needed
 *
 * This is exported for testing purposes
 * should not be used outside of this file
 */
export const updateEventsFromRule = async (
  oldRule: RecurrenceRule,
  newRule: RecurrenceRule,
  eventFromDB: DecryptedEventModel
): Promise<EventsFromRuleUpdateResult> => {
  // Updated events for notifications updates
  const eventsFromRuleUpdateResult: EventsFromRuleUpdateResult = {
    added: [],
    deleted: [],
    deleteOldParent: false
  };

  assertExists(db, 'updateEventsFromRule: DB is closed');
  const allOldRecurrencesDates = oldRule.getAllDates().map((date) => date.getTime());
  const allNewRecurrencesDates = newRule.getAllDates().map((date) => date.getTime());

  // Get from db all the recurrences of this event
  const recurrences = await queryAllEventRecurrences(db.events, eventFromDB.parentEventID);

  // Check id the rule frequency and interval are the same
  if (
    allNewRecurrencesDates.length === allOldRecurrencesDates.length &&
    newRule.frequency === oldRule.frequency &&
    newRule.interval === oldRule.interval &&
    newRule.byDays === oldRule.byDays
  ) {
    // If the rule frequency and interval are the same, we just need to update the recurrenceDate
    // We get the index of the old recurrenceDate in the old rule date series
    // and we use it to get the new recurrenceDate in the new rule date series
    await Dexie.waitFor(
      Promise.all(
        recurrences.map(async (recurrence) => {
          assertExists(db, 'putEventWithMerge: DB is closed');
          const recurrenceIndex = allOldRecurrencesDates.indexOf(recurrence.recurrenceDate);
          eventsFromRuleUpdateResult.deleted.push(recurrence);
          const newRecurrence = {
            ...recurrence,
            recurrenceDate: allNewRecurrencesDates[recurrenceIndex] || 0,
            syncState: EventSyncState.Waiting
          };
          eventsFromRuleUpdateResult.added.push(newRecurrence);
          await db.events.put(newRecurrence);
        })
      )
    );
  } else {
    eventsFromRuleUpdateResult.deleteOldParent = true;
    // If the rule frequency and interval are not the same, we need to delete the recurrences that don't fit the new rule

    // Get all the dates that don't fit the new rule
    const allNotFittingRecurrences = difference(allOldRecurrencesDates, allNewRecurrencesDates);

    // Check if we have recurrences that don't fit the new rule
    const hasNonFittingRecurrences = recurrences
      .map((recurrence) => recurrence.recurrenceDate)
      .some((date) => allNotFittingRecurrences.includes(date));

    // If there are non fitting recurrences, we need to create a new parent event
    // And delete the old parent event
    // This will be the new parent event id
    const newParentID = hasNonFittingRecurrences ? v4() : undefined;

    await Dexie.waitFor(
      Promise.all(
        recurrences.map(async (recurrence) => {
          assertExists(db, 'putEventWithMerge: DB is closed');
          if (allNotFittingRecurrences.includes(recurrence.recurrenceDate)) {
            // Delete all the ones that don't fit the new rule
            eventsFromRuleUpdateResult.deleted.push(recurrence);
            await db.events.put({
              ...recurrence,
              syncState: EventSyncState.Waiting,
              updateType: Array.from(new Set([...recurrence.updateType, EventUpdateType.Content])),
              deleted: true
            });
          } else if (newParentID) {
            // Update the parent event id of the ones that fit the new rule
            eventsFromRuleUpdateResult.deleted.push(recurrence);
            const newRecurrence = {
              ...recurrence,
              parentRecurrenceID: newParentID,
              updateType: Array.from(new Set([...recurrence.updateType, EventUpdateType.Content])),
              syncState: EventSyncState.Waiting
            };
            eventsFromRuleUpdateResult.added.push(newRecurrence);
            await db.events.put(newRecurrence);
          }
        })
      )
    );

    // If we have a new parent event id, delete the old parent event
    if (newParentID) {
      await db.events.update(eventFromDB.parentEventID, {
        deleted: true,
        syncState: EventSyncState.Waiting,
        updateType: Array.from(new Set([...eventFromDB.localMetadata.updateType, EventUpdateType.Content]))
      });
      // change the ID of eventFromDB so he will be saved as a new event
      eventFromDB.parentEventID = newParentID;
    }
  }

  return eventsFromRuleUpdateResult;
};

const updateSequence = (newEvent: DecryptedEvent, oldEvent: DecryptedEvent) => {
  // if theres no old event no need to increment the sequence
  if (!oldEvent) return;

  // if the sequence is already raised - no need to raise it again
  // this can happen when parsing updates from external client and the ics received has higher sequence number
  if (newEvent.plainContent.sequence > oldEvent.plainContent.sequence) return;

  // only the organizer is responsible to increase the sequence number
  // if the current user is not the organizer - don't increment the sequence
  // in case the event has external organizer the updated sequence will be parsed from the ics and already be included in the new event
  const currentCalendarID = requireCurrentCalendarID();
  const owner = newEvent.decryptedContent.attendees.find(
    (attendee) => attendee.permission === AttendeePermission.Owner
  );
  if (!owner || owner.id !== currentCalendarID) return;

  // check if the new event have changes that require sequence raising
  if (
    newEvent.plainContent.startDate !== oldEvent.plainContent.startDate ||
    newEvent.plainContent.endDate !== oldEvent.plainContent.endDate
  ) {
    newEvent.plainContent.sequence += 1;
  }
};

export const getEventByID = async (
  parentEventID: string,
  getDeleted = false
): Promise<DecryptedEventModel | undefined> => {
  assertExists(db, 'getEventByID: DB is closed');
  const dexieEvent = await db.events.get(parentEventID);

  if (!dexieEvent || (dexieEvent.deleted && !getDeleted)) {
    return undefined;
  }

  return DecryptedEventModel.fromDexie(dexieEvent);
};

export const putEventWithMerge = async (event: DecryptedEventModel) => {
  assertExists(db, 'putEventWithMerge: DB is closed');
  const calendarMetaData = await getCurrentCalendarMetadata();
  const userData = requireCurrentUserData();
  if (!calendarMetaData) return;

  const activeCalendarPrivateKey = calendarMetaData.getDecryptedCalendarPrivateKey(
    userData.privateUserData.privateKey,
    userData.publicKey
  );

  let eventsFromRuleUpdateResult: EventsFromRuleUpdateResult | undefined;
  let oldEvent: DecryptedEvent | undefined;
  let mergedEvent: DecryptedEvent | undefined;

  const tr = await db.transaction('rw!', db.events, db.calendarMetadata, async () => {
    assertExists(db, 'putEventWithMerge: DB is closed');
    const eventFromDB = await Dexie.waitFor(getEventByID(event.parentEventID, true));
    oldEvent = clone(eventFromDB);
    if (eventFromDB) {
      const oldRule = eventFromDB.plainContent.recurrenceRule;
      const newRule = event.plainContent.recurrenceRule;

      updateSequence(event, eventFromDB);

      mergeEvents(eventFromDB, event);
      // Handle recurrences update
      if (isRecurringParent(eventFromDB) && oldRule && newRule && oldRule.toJsonString() !== newRule.toJsonString()) {
        eventsFromRuleUpdateResult = await updateEventsFromRule(oldRule, newRule, eventFromDB);
      }
      mergedEvent = eventFromDB;
    } else {
      mergedEvent = event;
    }

    const attendeesForEncryption = requireAllResolvedAndSplitAttendees(mergedEvent.decryptedContent.attendees);

    const encryptedEvent = await Dexie.waitFor(
      toEncryptedEvent(mergedEvent, calendarMetaData.publicKey, activeCalendarPrivateKey, attendeesForEncryption)
    );
    const dexieEvent = await db.events.put(encryptedEvent, encryptedEvent.parentEventID);
    if (!dexieEvent) {
      throw new Error(`Failed saving event with id: ${encryptedEvent.parentEventID}`);
    }
    return dexieEvent;
  });

  // If on mobile send the event to webview
  if (isMobileApp() && mergedEvent) {
    // Call as void to avoid blocking the transaction return
    void updateNotificationsFromPutWithMerge(mergedEvent, oldEvent, eventsFromRuleUpdateResult);
  }

  return tr;
};

export const updateEvent = async (parentEventID: string, fieldsToUpdate: Partial<EventLocalMetadata>) => {
  assertExists(db, 'updateEvent: DB is closed');
  return db.transaction('rw!', db.events, db.calendarMetadata, async () => {
    assertExists(db, 'updateEvent: DB is closed');

    const dexieEvent = await db.events.update(parentEventID, fieldsToUpdate);
    if (!dexieEvent) {
      throw new Error(`Failed updating event with id: ${parentEventID}`);
    }
    return dexieEvent;
  });
};

/**
 * update the event with `put` method.
 * merges the event with the current db version and replace it completely
 * @param updateConflictState
 * @param syncState
 * @returns
 */
export const saveContent = async (
  event: DecryptedEventModel,
  updateConflictState = true,
  syncState = EventSyncState.Waiting
) => {
  if (updateConflictState) {
    const oldEvent = await getEventByID(event.parentEventID);
    updateConflictMarkers(oldEvent, event);
  }
  event.localMetadata.syncState = syncState;
  return putEventWithMerge(DecryptedEventModel.fromDecryptedEvent(event));
};

// Get all the events that not updated with the BE
export const getUnsyncedEvents = async (lastUpdated?: number | null): Promise<DecryptedEventModel[]> => {
  assertExists(db, 'getUnsyncedEvents: DB is closed');

  const dexieEvents = lastUpdated
    ? await db.events.where('syncState').noneOf([EventSyncState.Done]).sortBy('updatedAt')
    : await db.events.toArray();

  return DecryptedEventModel.fromManyDexie(dexieEvents);
};

/**
 * Function that returns all events between 2 dates.
 * Will return deleted events and events that
 * the current calendar was removed from.
 * @param startDate start the search from date
 * @param endDate end the search on date
 * @returns List of all events as DecryptedEvent
 */
export const getEventsBetween = async (startDate: number, endDate: number): Promise<DecryptedEventModel[]> => {
  assertExists(db, 'getEventsBetween: DB is closed');
  const dexieEvents = await queryEventsBetween<EncryptedEvent>(db.events, startDate, endDate);
  const decryptedEvents = await DecryptedEventModel.fromManyDexie(dexieEvents);
  return decryptedEvents.filter((event) => !event.decryptedContent.isAllDay);
};

export const getEventsByExternalID = async (externalID: string, getDeleted = false): Promise<DecryptedEventModel[]> => {
  assertExists(db, 'getEventsByExternalID: DB is closed');
  let events = await db.events.where({ externalID }).toArray();

  if (!getDeleted) {
    events = events.filter((event) => !event.deleted);
  }
  return DecryptedEventModel.fromManyDexie(events);
};

/**
 * Query all events that currentMailTimestamp is smaller than requestedMailTimestamp
 * @returns all events that we should send mail for
 */
export const getEventsThatShouldSendMail = async (): Promise<DecryptedEventModel[]> => {
  assertExists(db, 'getEventsThatShouldSendMail: DB is closed');

  const dexieEvent = db.events.filter((event) => event.currentMailTimestamp < event.requestMailTimestamp);

  const events = await dexieEvent.toArray();

  return DecryptedEventModel.fromManyDexie(events);
};

/**
 *
 * @param eventID ID of event to be delete
 * @returns True if successful, False if unable to find event or error
 */
export const deleteEventByID = async (eventID: string, currentUserCalendarID: string): Promise<boolean> => {
  const event = await getEventByID(eventID);

  if (!event) {
    console.error(`Failed to delete event: Could not find with given ID ${eventID}`);
    return false;
  }

  try {
    if (currentUserCalendarID !== event.plainContent.creatorCalendarID) {
      throw Error('User does not have permission to delete this event.');
    }
    event.plainContent.deleted = true;
    event.localMetadata.updateType = [EventUpdateType.Content, EventUpdateType.Rsvp, EventUpdateType.Preferences];
    // Note: We don't send email here since it's handled in ParticipantsSuggestions
    const deletedEvent = await saveContent(event);
    return !!deletedEvent;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const deleteAllRows = async (): Promise<void> => {
  await db?.events.clear();
};

/**
 * This should be used only if the event is later recovered
 * deleting an event should be done with deleteEventByID
 */
export const deleteLocalEvent = async (eventID: string): Promise<void> => {
  assertExists(db, 'deleteLocalEvent: DB is closed');
  await db.events.delete(eventID);
};

/**
 * This should be used only if the events are later recovered
 * deleting events should be done with deleteEventByID
 */
export const deleteLocalEvents = async (eventIDs: string[]): Promise<void> => {
  assertExists(db, 'deleteLocalEvents: DB is closed');
  await db.events.bulkDelete(eventIDs);
};

/**
 * Query all events nearest to date, used for syncing mobile app
 * @returns  all events nearest to date
 */
export const getEventsNearestToDate = async (date: Date): Promise<DecryptedEventModel[]> => {
  assertExists(db, 'getEventsNearestToDate: DB is closed');

  const events = await db.events.where('startDate').aboveOrEqual(date.getTime()).toArray();
  const decryptedEvents = await DecryptedEventModel.fromManyDexie(events);
  const recurrenceParents = await queryAllRecurringParents(db.events);
  const decryptedRecurringParents = await DecryptedEventModel.fromManyDexie(recurrenceParents);
  const virtualized = getVirtualizedRecurrences(
    decryptedRecurringParents,
    decryptedEvents,
    date.valueOf(),
    date.valueOf() + NOTIFICATION_VIRTUAL_CALC_TIME
  );
  return [...decryptedEvents, ...virtualized].sort((a, b) => a.plainContent.startDate - b.plainContent.startDate);
};

/**
 * Checks that the event is not deleted and the attendee exists in the event
 * @param event event to check
 * @param calendarID the attendee to check
 */
export const doesEventExistForAttendee = (event: DecryptedEvent | DecryptedDraft, calendarID: string) =>
  ((isEvent(event) && !event.plainContent.deleted) || isDraft(event)) &&
  event.decryptedContent.attendees.find((attendee) => attendee.id === calendarID && !attendee.deleted);

export const debouncedQueryAndUpdatedEvents = debounce(async (now: Date) => {
  const calendarID = getCurrentCalendarID();
  if (!calendarID) return;

  const events = sliceEvents(await getEventsNearestToDate(now));
  const updates = events.map(createWebviewEventUpdate(calendarID));
  updateLocalNotifications(updates);
}, 1000);
