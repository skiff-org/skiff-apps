import { makeVar, ReactiveVar, useReactiveVar } from '@apollo/client';
import { Dayjs } from 'dayjs';
import Dexie, { liveQuery, Observable } from 'dexie';
import { useObservable } from 'dexie-react-hooks';
import uniq from 'lodash/uniq';
import { useEffect } from 'react';
import { assertExists, filterExists } from 'skiff-utils';

import { DATE_UNIT, DAY_UNIT } from '../../../constants/time.constants';
import { queryAllRecurringParents, queryEventsBetween, queryEventsCovering } from '../../../utils/queryUtils';
import { isRecurringChild } from '../../../utils/recurringUtils';
import { DecryptedDraftModel } from '../../models/draft/DecryptedDraftModel';
import { DecryptedEventModel } from '../../models/event/DecryptedEventModel';
import { EncryptedDraft } from '../../schemas/draft';
import { EncryptedEvent } from '../../schemas/event';
import { db } from '../db';

const DAYS_BUFFER = 1; // Buffer to be added to the start and end dates while fetching events

const createRecurringParentsQuery = () => {
  return liveQuery(async () => {
    if (!db) return [];
    return db.transaction('rw!', db.events, db.drafts, db.calendarMetadata, async () => {
      assertExists(db, 'DB is closed');
      const draftParents = await queryAllRecurringParents(db.drafts);
      const eventParents = (await queryAllRecurringParents(db.events)).filter((event) => !event.deleted);

      const allIds = [
        ...new Set([
          ...draftParents.map((event) => event.parentEventID),
          ...eventParents.map((event) => event.parentEventID)
        ])
      ];

      const eventsToDecrypt: EncryptedEvent[] = [];
      const draftsToDecrypt: EncryptedDraft[] = [];

      allIds.forEach((id) => {
        const draft = draftParents.find((_draft) => _draft.parentEventID === id);
        const event = eventParents.find((_event) => _event.parentEventID === id);
        if (event) eventsToDecrypt.push(event);
        else if (draft) draftsToDecrypt.push(draft);
      });

      const events = await Dexie.waitFor(DecryptedEventModel.fromManyDexie(eventsToDecrypt));
      const drafts = await Dexie.waitFor(DecryptedDraftModel.fromManyDexie(draftsToDecrypt));

      return [...events, ...drafts];
    });
  });
};

export const recurringParentsQuery = makeVar(createRecurringParentsQuery());

const createPeriodEventsQuery = (startDate?: number, endDate?: number) => {
  return liveQuery(async () => {
    if (!db || !startDate || !endDate) return [];
    return db.transaction('rw!', db.events, db.calendarMetadata, async () => {
      assertExists(db, 'DB is closed');
      const betweenEvents = await queryEventsBetween<EncryptedEvent>(db.events, startDate, endDate);
      const coveringEvents = await queryEventsCovering<EncryptedEvent>(db.events, startDate, endDate);
      const decryptedEvents = await Dexie.waitFor(
        DecryptedEventModel.fromManyDexie([...betweenEvents, ...coveringEvents])
      );

      const childsWithoutPreferences = decryptedEvents.filter(
        (event) => isRecurringChild(event) && !event.decryptedPreferences?.color
      );

      const parents = uniq(
        childsWithoutPreferences.map((child) => child.plainContent.parentRecurrenceID).filter(filterExists)
      );

      const encryptedParents = await db.events.bulkGet(parents);
      const decryptedParents = await Dexie.waitFor(
        DecryptedEventModel.fromManyDexie(encryptedParents.filter(filterExists))
      );

      const childsWithoutPreferencesIDs = childsWithoutPreferences.map((child) => child.parentEventID);

      const decryptedEventsWithPreferences = decryptedEvents.map((event) => {
        if (!childsWithoutPreferencesIDs.includes(event.parentEventID)) return event;

        const parent = decryptedParents.find(
          (_parent) => _parent.parentEventID === event.plainContent.parentRecurrenceID
        );

        if (!parent) return event;

        return {
          ...event,
          decryptedPreferences: parent.decryptedPreferences
        };
      });

      return decryptedEventsWithPreferences;
    });
  });
};

export const periodEventQuery = makeVar(createPeriodEventsQuery());

const createDraftQuery = () => {
  return liveQuery(async () => {
    if (!db) return [];
    return db.transaction('rw!', db.drafts, db.calendarMetadata, async () => {
      assertExists(db, 'DB is closed');
      const encryptedDrafts = await db.drafts.toArray();
      return Dexie.waitFor(DecryptedDraftModel.fromManyDexie(encryptedDrafts));
    });
  });
};

export const draftQuery = makeVar(createDraftQuery());

// Hooks

export interface DexieQueriesProps {
  firstDay: Dayjs;
  daysToShow: number;
}

/**
 * This hook keeps the Dexie liveQueries up to date
 *
 * Currently this is used to update the periodEventQuery when the firstDay or daysToShow changes
 * draftQuery does not need to be updated as it has no dependencies
 */
export const useUpdateDexieQueries = (props: DexieQueriesProps) => {
  const { daysToShow, firstDay } = props;

  const firstDayTimestamp = firstDay.valueOf();

  useEffect(() => {
    let start = firstDay.startOf(DATE_UNIT);
    let end = firstDay.endOf(DATE_UNIT).add(daysToShow - 1, DAY_UNIT);

    // Add a buffer to handle all timezones
    start = start.subtract(DAYS_BUFFER, DAY_UNIT);
    end = end.add(DAYS_BUFFER, DAY_UNIT);

    periodEventQuery(createPeriodEventsQuery(start.valueOf(), end.valueOf()));
  }, [daysToShow, firstDayTimestamp]);
};

/**
 * Use instead of useLiveQuery, we predefine the query and update it with the useUpdateDexieQueries hook
 * Then we can use the reactiveVar with the observable to get the data from the query with this hook
 */
export const useDexieLiveQuery = <T>(query: ReactiveVar<Observable<T>>): T | undefined => {
  const queryUpdates = useReactiveVar(query);
  return useObservable(() => queryUpdates, [queryUpdates]);
};
