import { useReactiveVar, FetchResult, ApolloError } from '@apollo/client';
import SuperTokensLock from 'browser-tabs-lock';
import debounce from 'lodash/debounce';
import partition from 'lodash/partition';
import some from 'lodash/some';
import { useEffect, useMemo, useState } from 'react';
import { models, PushCalendarEventInput2 } from 'skiff-front-graphql';
import { getStatusCodeFromApolloNetworkError, requireCurrentUserData, useToast } from 'skiff-front-utils';
import { filterExists } from 'skiff-utils';
import { CALENDAR_SYNC_ERROR_MESSAGE } from 'skiff-utils';

import {
  SyncState,
  Sync2Mutation,
  Sync2MutationVariables,
  Sync2Document,
  GetEventsQuery,
  GetEventsQueryVariables,
  GetEventsDocument
} from '../../generated/graphql';
import client from '../apollo/client';
import { requireCurrentCalendarMetadata } from '../apollo/currentCalendarMetadata';
import { EVENTS_TO_RECOVER_CHUNK } from '../constants';
import { toEncryptedEvent } from '../crypto/cryptoWebWorker';
import { scheduleEmailSender } from '../utils/hooks/useICSEmailSender';
import { checkUnreadICS } from '../utils/sync/icsUtils';

import { requireAllResolvedAndSplitAttendees } from './crypto/utils';
import { db } from './db/db';
import { CalendarMetadataDB } from './models/CalendarMetadata';
import { ErrorHandlerMetadataDB } from './models/ErrorHandlerMetadata';
import { DecryptedEventModel } from './models/event/DecryptedEventModel';
import {
  addBulkNewEvents,
  deleteAllRows,
  getUnsyncedEvents,
  deleteLocalEvent,
  deleteLocalEvents,
  saveContent,
  updateEvent
} from './models/event/modelUtils';
import { EventSyncState } from './models/event/types';
import { resolveAllAttendeesAndEncryptSessionKeys } from './models/event/utils';
import { EventsToRecover } from './models/EventsToRecover';
import { EncryptedEvent } from './schemas/event';
import { SyncInnerState } from './useSync.types';
import { setSyncing, SYNCED_STATE, syncing, useReadingUnreadICS } from './useSyncVars';

export const SYNC_INTERVAL = 30000; // ms
export const DEBOUNCE_INTERVAL = 300; // ms
const SYNC_BATCH_SIZE = 100;

type EnqueueToast = ReturnType<typeof useToast>['enqueueToast'];

/*
 * Enqueues a toast to notify the user that the calendar is re-syncing.
 */
const enqueueSyncErrorToast = (enqueueToast: EnqueueToast | null) => {
  if (!enqueueToast) return;

  enqueueToast({
    title: 'Calendar re-syncing',
    body: 'Events will re-populate in a few moments.'
  });
};

/**
 * Makes sure only one sync runs at a time.
 * uses browser-tabs-lock - https://www.npmjs.com/package/browser-tabs-lock
 * (we are not use native WebLocks API because of compatibility problems https://caniuse.com/mdn-api_lock)
 * this allows us to acquire a lock, run sync and release. Once we require a lock
 * we can be sure that nobody else has acquired it, until we release
 * when passing steal=true, it will cancel all current running syncs and start a new one,
 * this is very aggressive and meant to bee used only on deadlocks/after refresh.
 */
const SYNC_LOCK_NAME = 'calendar_sync';
const SYNC_WAITING_KEY = 'sync_scheduled';
enum ScheduleState {
  Scheduled = 'scheduled',
  Free = 'free'
}

const CHECK_UNREAD_ICS_LOCK_NAME = 'check_unread_ics';
const CHECK_UNREAD_ICS_WAITING_KEY = 'check_unread_ics_scheduled';

const superTokensLock = new SuperTokensLock();

const isSyncScheduled = () => localStorage.getItem(SYNC_WAITING_KEY) === ScheduleState.Scheduled;
const setSyncScheduled = (syncScheduleState: ScheduleState) =>
  localStorage.setItem(SYNC_WAITING_KEY, syncScheduleState);

const isCheckUnreadICSScheduled = () => localStorage.getItem(CHECK_UNREAD_ICS_WAITING_KEY) === ScheduleState.Scheduled;
const setCheckUnreadICSScheduled = (syncScheduleState: ScheduleState) =>
  localStorage.setItem(CHECK_UNREAD_ICS_WAITING_KEY, syncScheduleState);

/**
 * We have to parts in this logic:
 * locking the sync with browser-tabs-lock  - makes sure no syncs run together
 * flagging  for scheduled sync - enabling to “hold” sync in order to run immediately  after the current locking one will finish
 */
const scheduleSync = async (enqueueToast: EnqueueToast | null, intervalSync?: boolean, steal?: boolean) => {
  if (steal) {
    await superTokensLock.releaseLock(SYNC_LOCK_NAME);
  }

  // acquire the lock - returns true if the sync is not locked and can immediately run. when acquiring the lock, if unlocked it will lock it.
  const lock = await superTokensLock.acquireLock(SYNC_LOCK_NAME, 100);

  // if lock is false that means the sync is locked
  if (!lock) {
    // mark flag to schedule another sync
    setSyncScheduled(ScheduleState.Scheduled);
    return;
  }

  // wrapping the sync with try/catch to make sure the release will be executed
  try {
    await sync(enqueueToast, intervalSync);
  } catch (err) {
    console.error(err);
  }

  // release the lock
  await superTokensLock.releaseLock(SYNC_LOCK_NAME);

  // if another sync is flagged - run it
  if (isSyncScheduled()) {
    // remove the flag
    setSyncScheduled(ScheduleState.Free);
    void scheduleSync(enqueueToast);
  }
};

export const scheduleCheckUnreadICS = async (steal?: boolean, withRecurring = false) => {
  if (steal) {
    await superTokensLock.releaseLock(CHECK_UNREAD_ICS_LOCK_NAME);
  }

  // acquire the lock - returns true if the check unread ics is not locked and can immediately run. when acquiring the lock, if unlocked it will lock it.
  const lock = await superTokensLock.acquireLock(CHECK_UNREAD_ICS_LOCK_NAME, 100);

  // if lock is false that means the check unread ics is locked
  if (!lock) {
    // mark flag to schedule another check unread ics
    setCheckUnreadICSScheduled(ScheduleState.Scheduled);
    return;
  }

  // wrapping the function with try/catch to make sure the release will be executed
  try {
    await checkUnreadICS(withRecurring);
  } catch (err) {
    console.error('Check Unread ICS Error:', err);
  }

  // release the lock
  await superTokensLock.releaseLock(CHECK_UNREAD_ICS_LOCK_NAME);

  // if another check unread ics is flagged - run it
  if (isCheckUnreadICSScheduled()) {
    // remove the flag
    setCheckUnreadICSScheduled(ScheduleState.Free);
    void scheduleCheckUnreadICS(undefined, withRecurring);
  }
};

const updateHandler = debounce(scheduleSync, DEBOUNCE_INTERVAL);

/**
 * Exported for testing purposes
 */
export const fromEventsWithChangesToEventsToPush = async (args: {
  eventsWithLocalChanges: DecryptedEventModel[];
  calendarMetadata: CalendarMetadataDB;
  userData: models.User;
  activeCalendarPrivateKey: string;
}): Promise<PushCalendarEventInput2[]> => {
  const { calendarMetadata, eventsWithLocalChanges, userData, activeCalendarPrivateKey } = args;

  const eventsToPush: PushCalendarEventInput2[] = [];

  for (const event of eventsWithLocalChanges) {
    try {
      await resolveAllAttendeesAndEncryptSessionKeys(
        event,
        calendarMetadata,
        userData.privateUserData.privateKey,
        userData.publicKey
      );

      // Preserve current sync state so we still send emails if we in WaitingtoSendEmail state.
      await saveContent(event, false, event.localMetadata.syncState);

      eventsToPush.push(
        await event.toGraphqlPush(calendarMetadata.calendarID, calendarMetadata, activeCalendarPrivateKey)
      );
    } catch (e) {
      console.error('Error while parsing event to graphql', e);
      // Add event to recover list
      await EventsToRecover.add(event.parentEventID);
      // Add error to error handler
      await ErrorHandlerMetadataDB.create({
        parentEventID: event.parentEventID,
        calendarID: calendarMetadata.calendarID,
        lastUpdated: event.localMetadata.updatedAt,
        message: [(e as { toString: () => string }).toString()]
      });
      // Delete event from DB
      await deleteLocalEvent(event.parentEventID);
    }
  }

  return eventsToPush;
};

/**
 * Exported for testing purposes
 */
export const callSyncMutationAndHandleErrors = async (args: {
  calendarID: string;
  eventsToPush: PushCalendarEventInput2[];
  lastUpdated?: number;
  enqueueToast: EnqueueToast | null;
}) => {
  const { calendarID, eventsToPush, lastUpdated, enqueueToast } = args;
  try {
    if (!calendarID) {
      // sometimes the sync happens before the calendarID is set in the DB. This is expected to happen on the first open
      console.warn('Tried syncing without calendarID');
      return;
    }
    return await client.mutate<Sync2Mutation, Sync2MutationVariables>({
      mutation: Sync2Document,
      variables: {
        request: {
          events: eventsToPush,
          checkpoint: lastUpdated ? new Date(lastUpdated) : undefined,
          calendarID
        }
      },
      fetchPolicy: 'network-only'
    });
  } catch (e) {
    // TODO: arpeetk - BACK-503 for a common error handling util
    const error = e as ApolloError;

    const isCalendarSyncError = error.message === CALENDAR_SYNC_ERROR_MESSAGE;
    const isBadRequest = error.networkError && getStatusCodeFromApolloNetworkError(error.networkError) === 400;

    if (isBadRequest || isCalendarSyncError) {
      enqueueSyncErrorToast(enqueueToast);

      // Add all the events to recover list
      await EventsToRecover.addMany(eventsToPush.map((event) => event.parentEventID));

      // Add error to error handler
      await ErrorHandlerMetadataDB.create({
        calendarID,
        lastUpdated,
        message: ['Sync Backend Error', (e as { toString: () => string }).toString()]
      });

      // Delete all the events from DB
      await deleteLocalEvents(eventsToPush.map((event) => event.parentEventID));
    }
    console.error('Error while syncing to the backend', e);
    setSyncing({
      syncing: false,
      error: (e as Error).message || 'Error while syncing to the backend',
      intervalSync: false
    });
    return;
  }
};

/**
 * The sync is responsible both for sending locally modified events to the server to store and update collaborators,
 * and for getting remote modified events (from collaborators) and set them to the local DB.
 *
 * Theres 2 ways that sync is triggered - 10 sec background interval or when theres changes in the local DB (event creation/update/delete).
 * The DB changes are triggered using a middleware that calls the debounced function
 *
 * Syncs will run always one at a time, if a sync is triggered in any way (interval or change in the DB) while another is still running,
 * he will be delayed until the current one finishes. If another sync is already delayed only one will run once the current finishes.
 *
 * -----
 * Flow:
 * -----
 *
 * 1. Get all the events in the local DB that has been modified by syncState. (handles only the first 100, if theres more schedules another sync)
 *    Will handle the events from old to new, so that no events will get buried
 *
 * 2. Get internal skiff info for all attendees of the events(if they are skiff users) + encrypt session key for each internal attendee
 *
 * 3. Parse the locally modified events to send them to the server
 *
 * 4. Send the events to the sever - will return:
 *    - new checkpoint
 *    - all the events that has been modified in other clients (collabs, different machines)
 *    - sync state - determines if push was accepted and if theres changes that still not updated in the local DB
 *
 * 5. Merge the events received from the server with the local DB,
 *   if there will be conflicts with the local events the conflicts will be solved locally and the events will be updated, another sync will be triggered
 *
 * 6. Update the calendar checkpoint with the one received from the server
 *
 * 7. If the server is synced with all the local events, mark all the events that send to the server as synced
 *
 * -----
 * Notes
 * -----
 *
 * - A sync request is accepted only if the sender is completly synced with the BE,
 *  otherwise all the changes are rejected and the missing updates from the BE are returned
 *
 * - Mail sending is also handled in a offline first design, but not as part of the sync
 *
 * - The checkpoint is used to keep track on the backend sync time. Not for what are the local new changes
 *
 * - Currently on a unknown error in the sync process we clear the local DB and sync again
 *
 * see calendar.md for full docs
 */

export async function clearDBOnError(withoutMetadata = false) {
  await deleteAllRows();
  if (!withoutMetadata) await CalendarMetadataDB.updateMetadata({ lastUpdated: 0 });
  // Clear debounce so we wait the full interval before syncing again.
  updateHandler.cancel();
}

export const sync = async (enqueueToast: EnqueueToast | null, intervalSync?: boolean) => {
  console.log('|| --- Sync --- ||');
  try {
    setSyncing({ syncing: true, intervalSync: !!intervalSync });

    // Get calendarIDs and checkpoint
    const calendarMetadata = await requireCurrentCalendarMetadata();
    const { lastUpdated, calendarID, publicKey } = calendarMetadata;
    const userData = requireCurrentUserData();

    // Get all the locally changes that not updated with BE
    const allEventsWithLocalChanges = await getUnsyncedEvents(lastUpdated);
    const eventsWithLocalChanges = allEventsWithLocalChanges.slice(0, SYNC_BATCH_SIZE);

    // if this batch is full schedule another sync
    if (allEventsWithLocalChanges.length > SYNC_BATCH_SIZE) void scheduleSync(enqueueToast);

    const activeCalendarPrivateKey = calendarMetadata.getDecryptedCalendarPrivateKey(
      userData.privateUserData.privateKey,
      userData.publicKey
    );

    // Format all the events in a way we want to store on the DB
    const eventsToPush = await fromEventsWithChangesToEventsToPush({
      eventsWithLocalChanges,
      calendarMetadata,
      userData,
      activeCalendarPrivateKey
    });

    const eventsToRecoverIDs = (await EventsToRecover.get(EVENTS_TO_RECOVER_CHUNK)).map((event) => event.parentEventID);

    let recoverResponse: FetchResult<GetEventsQuery>;
    if (!eventsToRecoverIDs.length) {
      recoverResponse = { data: { events: [] } };
    } else {
      try {
        recoverResponse = await client.query<GetEventsQuery, GetEventsQueryVariables>({
          query: GetEventsDocument,
          variables: {
            request: {
              calendarID,
              eventsIDs: eventsToRecoverIDs
            }
          },
          fetchPolicy: 'network-only'
        });
      } catch (e) {
        console.error('Error while getting events to recover', e);
        recoverResponse = { data: { events: [] } };
      }
    }

    const syncResponse = await callSyncMutationAndHandleErrors({
      eventsToPush,
      calendarID,
      lastUpdated,
      enqueueToast
    });

    const { events: eventsToPull, state, checkpoint } = syncResponse?.data?.sync2 || {};
    const recoveredEvents = recoverResponse?.data?.events;

    const recoveredEventsSet = new Set(recoveredEvents?.map((event) => event.parentEventID));

    const pulledEvents = [...(eventsToPull || []), ...(recoveredEvents || [])];
    const recoveredEventsIDs: string[] = [];

    if (pulledEvents.length) {
      const pulledEventsIDs = pulledEvents.map((event) => event?.parentEventID).filter(filterExists);
      const pulledEventsInDB = await db?.events
        .filter((dbEvent) => pulledEventsIDs.includes(dbEvent.parentEventID))
        .toArray();
      const pulledEventsInDbIDs = pulledEventsInDB?.map((event) => event.parentEventID);
      const [existingPulledEvents, newPulledEvents] = partition(pulledEvents.filter(filterExists), (event) =>
        pulledEventsInDbIDs?.includes(event.parentEventID)
      );

      // merge and update existing events
      for (const pulledEvent of existingPulledEvents) {
        try {
          const newEvent = await DecryptedEventModel.fromGraphql(pulledEvent, activeCalendarPrivateKey, publicKey);
          const eventFromDB = pulledEventsInDB?.find((dbEvent) => dbEvent.parentEventID === pulledEvent.parentEventID);
          if (!eventFromDB) return;
          // save content will take care of merging the new event into the one from the db
          await saveContent(newEvent, false, eventFromDB.syncState);
        } catch (e) {
          // It basically means pull event from backend failed and after the checkpoint is updated, this event will no longer be pulled from backend.
          // Mark this event as a failed event by storing it in the error handler state to be reconciled later.
          console.error('Error while trying merge pulled event to local db', pulledEvent, e);
          await ErrorHandlerMetadataDB.create({
            parentEventID: pulledEvent.parentEventID,
            calendarID: calendarID,
            lastUpdated: pulledEvent.updatedAt,
            message: [(e as { toString: () => string }).toString()]
          });
        }
      }

      const encryptedNewEvents: EncryptedEvent[] = [];

      // create new events
      for (const event of newPulledEvents) {
        if (!event) return;
        try {
          const decryptedEvent = await DecryptedEventModel.fromGraphql(event, activeCalendarPrivateKey, publicKey);
          const attendeesForEncryption = requireAllResolvedAndSplitAttendees(decryptedEvent.decryptedContent.attendees);
          encryptedNewEvents.push(
            await toEncryptedEvent(
              decryptedEvent,
              calendarMetadata.publicKey,
              activeCalendarPrivateKey,
              attendeesForEncryption
            )
          );
          if (recoveredEventsSet.has(decryptedEvent.parentEventID))
            recoveredEventsIDs.push(decryptedEvent.parentEventID);
        } catch (e) {
          // It basically means pull event from backend failed and after the checkpoint is updated, this event will no longer be pulled from backend.
          // Mark this event as a failed event by storing it in the error handler state to be reconciled later.
          console.error('Error while trying to encrypt pulled event to local db', event, e);
          await ErrorHandlerMetadataDB.create({
            parentEventID: event.parentEventID,
            calendarID: calendarID,
            lastUpdated: event.updatedAt,
            message: [(e as { toString: () => string }).toString()]
          });
        }
      }

      await addBulkNewEvents(encryptedNewEvents);
    }

    if (eventsToRecoverIDs.length) {
      const nonRecoveredIds = eventsToRecoverIDs.filter((id) => !recoveredEventsIDs.includes(id));
      await EventsToRecover.increaseTryCount(nonRecoveredIds);
      await EventsToRecover.removeMany(recoveredEventsIDs);
    }

    // Update the calendar checkpoint with the checkpoint received from the server
    if (checkpoint) {
      await CalendarMetadataDB.updateMetadata({ lastUpdated: checkpoint });
    }

    // In case client is up to date, the BE will try to apply changes, in case of success it will return SyncState.Synced
    // Then we will mark all updatedEvents as done, to avoid try to apply the same changes again and again
    if (state === SyncState.Synced) {
      await Promise.all(
        eventsWithLocalChanges.map((eventWithLocalChanges) => {
          // This should be "internal" update shouldnt change lastupdated or so
          return updateEvent(eventWithLocalChanges.parentEventID, {
            syncState: EventSyncState.Done,
            updateType: []
          });
        })
      );
      // After being saved manually trigger send email scheduler
      const shouldSendMail = some(eventsWithLocalChanges.map((event) => event.shouldSendMail()));
      if (shouldSendMail) void scheduleEmailSender();
    }
    setSyncing(SYNCED_STATE);

    if (!calendarMetadata.initializedLocalDB) {
      void CalendarMetadataDB.updateMetadata({ initializedLocalDB: true });
    }

    return { checkpoint, state };
  } catch (error) {
    setSyncing({
      syncing: false,
      error: (error as Error).message || 'Error while syncing to the backend',
      intervalSync: false
    });
    console.error(error);
  }
};

export enum CalendarLocalSyncState {
  Synced = 'synced',
  Syncing = 'syncing',
  Offline = 'offline',
  Error = 'error'
}

/**
 * Subscribes sync to local DB changes and set auto sync interval
 */
export const useSync = () => {
  const { enqueueToast } = useToast();

  useEffect(() => {
    if (!db) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    // subscribe to changes in the local DB, every modification triggers a sync
    db.on('update', updateHandler);

    // set a 10 sec interval to sync with the server and check for unread ics mail (that will be parsed to events)
    const pullInterval = setInterval(() => {
      void (async () => {
        // We should always sync before checking for ICS messages, because otherwise
        // an ICS invite could get created for the same event with a new decryption key.
        await scheduleSync(enqueueToast, true);
        // Acquires emails that have ICS file (and are unread),
        // reads the ICS event details and updates the local client DB.
        // Once local state is updated, the emails with ICS are marked as read.
        await scheduleCheckUnreadICS(undefined, true);
      })();
    }, SYNC_INTERVAL);
    // pass steal=true incase there were any deadlocks
    void scheduleSync(enqueueToast, false, true);
    void scheduleCheckUnreadICS(true, true);
    return () => {
      if (!db) return;
      db.on('update').unsubscribe(updateHandler);
      clearInterval(pullInterval);
    };
  }, [db]);
};

export const useSyncState = () => {
  const { enqueueToast } = useToast();

  const unsupportedUserAgentsPattern = /Windows.*Chrome|Windows.*Firefox|Linux.*Chrome/;
  // check if the browser supports the online API: https://github.com/cwise89/react-detect-offline/blob/master/src/index.js#L7
  const browserLacksOnlineSupport = unsupportedUserAgentsPattern.test(navigator.userAgent);
  // If the browser doesn't support, set status as online by default. Otherwise, use navigator.onLine.
  const [online, setOnline] = useState(
    browserLacksOnlineSupport || typeof navigator.onLine !== 'boolean' ? true : navigator.onLine
  );

  const [calendarLocalSyncState, setCalendarLocalSyncState] = useState(CalendarLocalSyncState.Synced);
  const syncInnerState = useReactiveVar(syncing);
  const isReadingUnreadICS = useReadingUnreadICS();

  const offlineTrigger = () => {
    setOnline(false);
  };

  const onlineTrigger = () => {
    setOnline(true);
    void scheduleSync(enqueueToast);
  };

  useEffect(() => {
    window.addEventListener('offline', offlineTrigger);
    window.addEventListener('online', onlineTrigger);
    // returned function will be called on component unmount
    return () => {
      window.removeEventListener('offline', offlineTrigger);
      window.removeEventListener('online', onlineTrigger);
    };
  }, []);

  // debounce the sync state to prevent changing the state when fast syncs executed
  const debouncedSetSyncState = useMemo(
    () =>
      debounce((syncInnerStateProp: SyncInnerState, onlineProp: boolean, readingUnreadICSProp: boolean) => {
        // if syncing from interval - don't change the badge status
        if (syncInnerStateProp.intervalSync) return;

        // if offline - show offline
        if (!onlineProp) {
          setCalendarLocalSyncState(CalendarLocalSyncState.Offline);
        } else if (syncInnerStateProp.error) {
          setCalendarLocalSyncState(CalendarLocalSyncState.Error);
        } else {
          // if syncing - show syncing
          if (syncInnerStateProp.syncing || readingUnreadICSProp)
            setCalendarLocalSyncState(CalendarLocalSyncState.Syncing);
          // if not syncing - show synced
          else if (!syncInnerStateProp.syncing) setCalendarLocalSyncState(CalendarLocalSyncState.Synced);
        }
      }, 200),
    []
  );

  useEffect(() => {
    debouncedSetSyncState(syncInnerState, online, isReadingUnreadICS);
  }, [online, syncInnerState, debouncedSetSyncState, isReadingUnreadICS]);

  return { state: calendarLocalSyncState, error: syncInnerState.error };
};
