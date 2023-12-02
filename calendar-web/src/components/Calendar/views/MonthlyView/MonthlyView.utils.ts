import { DecryptedDraft } from '../../../../storage/models/draft/types';
import { sortByDuration, sortByTitle } from '../../../../utils';
import { DisplayEvent } from '../../types';

/** Sort all-day events by duration then by title */
export const getSortedAllDayEvents = (events: (DecryptedDraft | DisplayEvent)[]) =>
  events.sort((eventA, eventB) => sortByDuration(eventA, eventB) || sortByTitle(eventA, eventB));

/**
 * Sort timed events by start date then by title
 * Display events are already sorted by start date,
 * so we just need to sort by title if the events have the same start date
 */
export const getSortedTimedEvents = (events: DisplayEvent[]) =>
  events.sort(function (eventA, eventB) {
    if (eventA.displayStartDate === eventB.displayStartDate) return sortByTitle(eventA, eventB);
    return 0;
  });
