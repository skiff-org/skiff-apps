import { Table } from 'dexie';

import { EncryptedDraft } from '../storage/schemas/draft';
import { EncryptedEvent } from '../storage/schemas/event';

export const queryEventsBetween = <T extends EncryptedDraft | EncryptedEvent>(
  table: Table<T>,
  startDate: number,
  endDate: number
): Promise<T[]> =>
  table.where('startDate').between(startDate, endDate).or('endDate').between(startDate, endDate).toArray();

export const queryEventsCovering = <T extends EncryptedDraft | EncryptedEvent>(
  table: Table<T>,
  startDate: number,
  endDate: number
): Promise<T[]> =>
  table
    .where('endDate')
    .above(endDate)
    .and((draft) => draft.startDate < startDate)
    .sortBy('startDate');

/**
 * Query all the recurrences of a parent event, without the parent event itself
 */
export const queryAllEventRecurrences = (
  table: Table<EncryptedEvent>,
  parentEventID: string
): Promise<EncryptedEvent[]> =>
  table
    .where('parentRecurrenceID')
    .equals(parentEventID)
    .and((_event) => !!_event.recurrenceDate)
    .toArray();

/**
 * Query all the recurrences of a parent event after a date, without the parent event itself
 */
export const queryAllEventRecurrencesAfter = (
  table: Table<EncryptedEvent>,
  parentRecurrenceID: string,
  date: number
): Promise<EncryptedEvent[]> =>
  table
    .where('parentRecurrenceID')
    .equals(parentRecurrenceID)
    .and((_event) => !!_event.recurrenceDate && _event.recurrenceDate > date)
    .toArray();

export const queryAllRecurringParents = <T extends EncryptedEvent | EncryptedDraft>(table: Table<T>): Promise<T[]> =>
  table
    .where('recurrenceRule')
    .notEqual('')
    .and((event) => event.recurrenceDate === 0 && !event.parentRecurrenceID)
    .sortBy('startDate');
