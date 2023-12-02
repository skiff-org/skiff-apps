import { RecurrenceRule } from 'skiff-ics';
import { assertExists, ifMapHas } from 'skiff-utils';

import { DecryptedDraft } from '../../storage/models/draft/types';
import { getEventByID } from '../../storage/models/event/modelUtils';
import { DecryptedEvent } from '../../storage/models/event/types';
import { getDraftIfExistOrEvent } from '../eventUtils';

export type RecurrenceEvent = (DecryptedDraft | DecryptedEvent) & {
  plainContent: {
    recurrenceRule: RecurrenceRule;
    parentRecurrenceID: undefined | string;
  };
};

export const isRecurringEvent = (event: DecryptedEvent | DecryptedDraft): event is RecurrenceEvent =>
  !!event.plainContent.recurrenceRule || !!event.plainContent.parentRecurrenceID;

export type RecurrenceParent = (DecryptedDraft | DecryptedEvent) & {
  plainContent: {
    recurrenceRule: RecurrenceRule;
    parentRecurrenceID: undefined;
  };
};

export const isRecurringParent = (event: DecryptedEvent | DecryptedDraft): event is RecurrenceParent =>
  isRecurringEvent(event) && !event.plainContent.parentRecurrenceID;

export type RecurrenceChild = (DecryptedDraft | DecryptedEvent) & {
  plainContent: {
    recurrenceRule: RecurrenceRule;
    parentRecurrenceID: string;
  };
};

// We are creating virtualized instances of recurring event by their parent event rrule once user update a specific instance we creating a "real" event/draft
// this function helps to detect if the event is Recurrence children (not parent)
export const isRecurringChild = (event: DecryptedEvent | DecryptedDraft): event is RecurrenceChild =>
  isRecurringEvent(event) && event.plainContent.recurrenceDate !== 0 && !!event.plainContent.parentRecurrenceID;

/**
 * get parentEventID and returns the parent event
 * @param parentEventID
 */
export const getRecurrenceParent = async (parentEventID: string) => {
  const draftOrEvent = await getDraftIfExistOrEvent(parentEventID);
  assertExists(draftOrEvent, `No draft or event for ${parentEventID}`);

  // if the id passed is the parent event return him
  if (!draftOrEvent.plainContent.parentRecurrenceID) {
    const parentEvent = await getEventByID(parentEventID);
    assertExists(parentEvent, `No event for ${parentEventID}`);
    return parentEvent;
  } else {
    const parentEvent = await getEventByID(draftOrEvent.plainContent.parentRecurrenceID);
    assertExists(parentEvent, `No event for ${draftOrEvent.plainContent.parentRecurrenceID}`);
    return parentEvent;
  }
};

/**
 * A mapping of all the recurrences, grouped by parent event ID
 */
export const generateRecurrenceMap = (events: DecryptedEvent[]) =>
  events.reduce<Map<string, number[]>>((map, event) => {
    if (!event.plainContent.parentRecurrenceID) return map;

    if (ifMapHas(map, event.plainContent.parentRecurrenceID))
      map.set(event.plainContent.parentRecurrenceID, [
        ...new Set([...map.get(event.plainContent.parentRecurrenceID), event.plainContent.recurrenceDate])
      ]);
    else map.set(event.plainContent.parentRecurrenceID, [event.plainContent.recurrenceDate]);

    return map;
  }, new Map());
