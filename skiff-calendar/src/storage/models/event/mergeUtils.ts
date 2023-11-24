import isEqual from 'lodash/isEqual';
import { EventUpdateType } from 'skiff-graphql';

import { mergeAttendees } from '../EventAttendee';

import {
  ContentLastUpdateKeyMap,
  DecryptedEvent,
  EventAttendee,
  eventContentConflictProps,
  EventDecryptedContent,
  EventDecryptedPreferences,
  EventPlainContent,
  eventPlainContentConflictProps,
  eventPreferencesConflictProps,
  EventSyncState,
  PlainContentLastUpdateKeyMap,
  PreferencesLastUpdateKeyMap
} from './types';

export const computeLastUpdatedAtMap = (
  oldEvent: DecryptedEvent | undefined,
  newEvent: DecryptedEvent,
  updatedAt: number
) => {
  const contentLastUpdateKeyMap: ContentLastUpdateKeyMap = oldEvent?.decryptedContent.lastUpdateKeyMap || {};
  const eventPlainContentConflictMap: PlainContentLastUpdateKeyMap = oldEvent?.plainContent.lastUpdateKeyMap || {};
  const preferencesLastUpdateKeyMap: PreferencesLastUpdateKeyMap =
    oldEvent?.decryptedPreferences?.lastUpdateKeyMap || {};

  const propsIncludesAndNotEqual = (
    props: string[],
    key: string,
    oldContent: EventPlainContent | EventDecryptedContent | EventDecryptedPreferences | undefined,
    newContent: EventPlainContent | EventDecryptedContent | EventDecryptedPreferences
  ) => props.includes(key) && !isEqual(newContent[key], oldContent?.[key]);

  // content props
  for (const key of Object.keys(newEvent.decryptedContent)) {
    if (
      propsIncludesAndNotEqual(eventContentConflictProps, key, oldEvent?.decryptedContent, newEvent.decryptedContent)
    ) {
      contentLastUpdateKeyMap[key] = updatedAt;
    }
  }

  // preferences props
  for (const key of Object.keys(newEvent.decryptedPreferences || {})) {
    if (
      propsIncludesAndNotEqual(
        eventPreferencesConflictProps,
        key,
        oldEvent?.decryptedPreferences,
        newEvent.decryptedPreferences || {
          lastUpdateKeyMap: {}
        }
      )
    ) {
      preferencesLastUpdateKeyMap[key] = updatedAt;
    }
  }

  // plain props
  for (const key of Object.keys(newEvent.plainContent)) {
    if (propsIncludesAndNotEqual(eventPlainContentConflictProps, key, oldEvent?.plainContent, newEvent.plainContent)) {
      if (key === 'startDate' || key === 'endDate') {
        eventPlainContentConflictMap.endDate = updatedAt;
        eventPlainContentConflictMap.startDate = updatedAt;
      } else {
        eventPlainContentConflictMap[key] = updatedAt;
      }
    }
  }

  return { contentLastUpdateKeyMap, preferencesLastUpdateKeyMap, eventPlainContentConflictMap };
};

export const updateConflictMarkers = (oldEvent: DecryptedEvent | undefined, newEvent: DecryptedEvent) => {
  const updatedAt = Date.now();
  newEvent.localMetadata.updatedAt = updatedAt;
  const { contentLastUpdateKeyMap, preferencesLastUpdateKeyMap, eventPlainContentConflictMap } =
    computeLastUpdatedAtMap(oldEvent, newEvent, updatedAt);

  newEvent.decryptedContent.lastUpdateKeyMap = contentLastUpdateKeyMap;
  newEvent.plainContent.lastUpdateKeyMap = eventPlainContentConflictMap;
  if (!newEvent.decryptedPreferences)
    newEvent.decryptedPreferences = {
      lastUpdateKeyMap: preferencesLastUpdateKeyMap
    };
  else newEvent.decryptedPreferences.lastUpdateKeyMap = preferencesLastUpdateKeyMap;
};

export const mergeByLastUpdateMap = (
  propsToCompare: string[],
  newData: EventPlainContent | EventDecryptedContent | EventDecryptedPreferences,
  currentData: EventPlainContent | EventDecryptedContent | EventDecryptedPreferences | undefined,
  mergedData: EventPlainContent | EventDecryptedContent | EventDecryptedPreferences
) => {
  let conflict = false;
  propsToCompare.forEach((prop) => {
    const currentLastUpdated = (currentData?.lastUpdateKeyMap[prop] as number) || 0;
    const newLastUpdated = (newData.lastUpdateKeyMap[prop] as number) || 0;
    /**
     * There are 4 possibilities here:
     * 1. currentLastUpdated + newLastUpdated defined - bigger wins
     * 2. currentLastUpdated undefined, newLastUpdated defined - newLastUpdated wins and no conflict
     * 3. currentLastUpdated defined, newLastUpdated undefined - currentLastUpdated wins with conflict
     * 4. currentLastUpdated + newLastUpdated undefined - newLastUpdated wins and no conflict
     */
    if (currentLastUpdated > newLastUpdated) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mergedData[prop] = currentData![prop];
      mergedData.lastUpdateKeyMap[prop] = currentLastUpdated;
      conflict = true;
    }
  });

  return conflict;
};

// Receive new event update (added/deleted/updated) and merge it into the client DB
// It might have conflict with some local changes, in that case we will mark this event as waiting for sync + will update his lastUpdate time
export const mergeEvents = (oldEvent: DecryptedEvent | undefined, newEvent: DecryptedEvent) => {
  // Event that already existing on client DB have new update (changed/deleted)
  const mergedEvent: DecryptedEvent = {
    ...oldEvent,
    ...newEvent,
    decryptedContent: {
      ...oldEvent?.decryptedContent,
      ...newEvent.decryptedContent
    },
    decryptedPreferences: {
      lastUpdateKeyMap: {},
      ...oldEvent?.decryptedPreferences,
      ...newEvent.decryptedPreferences
    },
    plainContent: {
      ...oldEvent?.plainContent,
      ...newEvent.plainContent
    },
    localMetadata: {
      ...oldEvent?.localMetadata,
      ...newEvent.localMetadata
    }
  };

  const contentConflict = mergeByLastUpdateMap(
    eventContentConflictProps,
    newEvent.decryptedContent,
    oldEvent?.decryptedContent,
    mergedEvent.decryptedContent
  );

  const contentPlainConflict = mergeByLastUpdateMap(
    eventPlainContentConflictProps,
    newEvent.plainContent,
    oldEvent?.plainContent,
    mergedEvent.plainContent
  );

  const preferencesConflict = mergeByLastUpdateMap(
    eventPreferencesConflictProps,
    newEvent.decryptedPreferences || { lastUpdateKeyMap: {} },
    oldEvent?.decryptedPreferences || { lastUpdateKeyMap: {} },
    mergedEvent.decryptedPreferences || { lastUpdateKeyMap: {} }
  );

  const {
    mergedAttendees,
    updatedAt: attendeesUpdatedAt,
    contentConflict: attendeesContentConflict,
    rsvpConflict: attendeesRsvpConflict
  } = mergeAttendees(oldEvent?.decryptedContent.attendees, newEvent.decryptedContent.attendees);

  mergedEvent.decryptedContent.attendees = mergedAttendees;

  // Override local event last updated with the new event value
  mergedEvent.localMetadata.updatedAt = Math.max(
    newEvent.localMetadata.updatedAt,
    mergedEvent.localMetadata.updatedAt,
    attendeesUpdatedAt
  );

  const updateTypeSet = new Set(mergedEvent.localMetadata.updateType);

  // add update typos according to the conflicts
  if (contentConflict || contentPlainConflict || attendeesContentConflict) updateTypeSet.add(EventUpdateType.Content);
  if (preferencesConflict) updateTypeSet.add(EventUpdateType.Preferences);
  if (attendeesRsvpConflict) updateTypeSet.add(EventUpdateType.Rsvp);

  mergedEvent.localMetadata.updateType = Array.from(updateTypeSet);

  const needToUpdateAttendees =
    contentConflict || attendeesContentConflict || attendeesRsvpConflict || preferencesConflict;

  // set the event to EventSyncState.Waiting state if any of the content has changed
  if (needToUpdateAttendees && mergedEvent.localMetadata.syncState === EventSyncState.Done) {
    mergedEvent.localMetadata.syncState = EventSyncState.Waiting;
  }

  Object.assign(oldEvent || {}, mergedEvent);
};

export const mergeAndSetAttendees = (event: DecryptedEvent, attendeesToSet: EventAttendee[]) => {
  const {
    mergedAttendees,
    contentConflict: attendeesContentConflict,
    rsvpConflict: attendeesRsvpConflict
  } = mergeAttendees(event.decryptedContent.attendees, attendeesToSet);
  const updateTypeSet = new Set(event.localMetadata.updateType);

  if (attendeesContentConflict) updateTypeSet.add(EventUpdateType.Content);
  if (attendeesRsvpConflict) updateTypeSet.add(EventUpdateType.Rsvp);

  event.localMetadata.updateType = Array.from(updateTypeSet);
  event.decryptedContent.attendees = mergedAttendees;
};
