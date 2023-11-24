import { Dayjs } from 'dayjs';
import range from 'lodash/range';

import { getCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { DATE_UNIT, DAY_UNIT } from '../../constants/time.constants';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { doesEventExistForAttendee, getVirtualizedRecurrences } from '../../storage/models/event/modelUtils';
import { DecryptedEvent } from '../../storage/models/event/types';
import { unixDateToStartOfDateInUTC } from '../dateTimeUtils';
import { getEventCardKey } from '../eventUtils';
import { isRecurringChild, isRecurringParent } from '../recurringUtils';

/**
 * Filters events that has an active draft (we show the draft instead)
 */
const filterEventsWithPendingChanges = (events: DecryptedEvent[], drafts: DecryptedDraft[]) => {
  const draftKeys = drafts.map((draft) => getEventCardKey(draft));
  return events.filter((event) => !draftKeys.includes(getEventCardKey(event)));
};

/**
 * This function filters out parent events that have an instance on that time
 * This is a case that we have 2 events for the same recurrence the parent and the instance
 *
 *
 * And filters the parents that does not fit the rule
 */
const filterParentsThatHaveInstance = (eventsForTimeRange: DecryptedEvent[], allEventsToSearch: DecryptedEvent[]) => {
  // we get the parents and children from `allEventsToSearch` because for all-day events we run this function separately for each day
  // so we need to check all the events in the week and not only the ones in this specific day.
  // (because it is possible that the parent has been moved a day back/forward)
  const parents = allEventsToSearch.filter(isRecurringParent);
  const children = allEventsToSearch.filter(isRecurringChild);

  const parentsWithInstance = parents
    .filter((parent) => {
      // If the parent is not in the rule, we don't need to check the children
      if (isRecurringParent(parent)) {
        const utcStartDate = unixDateToStartOfDateInUTC(parent.plainContent.startDate).valueOf();
        // Check all day events separately as we don't want the timezone
        const isAllDayEventInRule =
          parent.decryptedContent.isAllDay &&
          parent.plainContent.recurrenceRule?.startDate &&
          parent.plainContent.recurrenceRule?.startDate > utcStartDate;
        const isNonAllDayEventInRule =
          !parent.decryptedContent.isAllDay &&
          !parent.plainContent.recurrenceRule.eventInRule(new Date(parent.plainContent.startDate));
        if (isAllDayEventInRule || isNonAllDayEventInRule) {
          return true;
        }
      }

      // Get all the children that have the same parent
      const childrenForParent = children.filter(
        (child) => child.plainContent.parentRecurrenceID === parent.parentEventID
      );
      if (!childrenForParent.length) return false;

      // check if any of the children has the same recurrence date as the parent startDate
      return childrenForParent.some((child) => child.plainContent.recurrenceDate === parent.plainContent.startDate);
    })
    .map((parent) => parent.parentEventID);

  return eventsForTimeRange.filter((event) => !parentsWithInstance.includes(event.parentEventID));
};

const between = (number: number, min: number, max: number) => number >= min && number <= max;
const greaterThen = (number: number, value: number) => number > value;
const smallerThen = (number: number, value: number) => number < value;

const filterAllDayEvents = (event: DecryptedEvent | DecryptedDraft) => event.decryptedContent.isAllDay;
const filterNotAllDayEvents = (event: DecryptedEvent | DecryptedDraft) => !event.decryptedContent.isAllDay;

/**
 * Check if either the start or end date of the event is between the start and end date of the period
 */
export const getEventsBetween = (startDate: number, endDate: number, allEvents: (DecryptedEvent | DecryptedDraft)[]) =>
  allEvents.filter(
    (event) =>
      between(event.plainContent.startDate, startDate, endDate) ||
      between(event.plainContent.endDate, startDate, endDate)
  );

/**
 * Events that start before the period and end after the period
 */
export const getEventsCovering = (startDate: number, endDate: number, allEvents: (DecryptedEvent | DecryptedDraft)[]) =>
  allEvents.filter(
    (event) => greaterThen(event.plainContent.endDate, endDate) && smallerThen(event.plainContent.startDate, startDate)
  );

/**
 * returns contained and covering events for a period
 */
const getEventsForPeriod = <T extends DecryptedEvent | DecryptedDraft>(
  start: number,
  end: number,
  allEvents: T[]
): T[] => {
  const eventsBetween = getEventsBetween(start, end, allEvents);
  const eventsCovering = getEventsCovering(start, end, allEvents);

  return [...eventsBetween, ...eventsCovering] as T[];
};

const getEventsForDay = <T extends DecryptedEvent | DecryptedDraft>(day: Dayjs, allEvents: T[]): T[] => {
  const startOfCurrentDay = day.startOf(DATE_UNIT).valueOf();
  const endOfCurrentDay = day.endOf(DATE_UNIT).valueOf();

  return getEventsForPeriod(startOfCurrentDay, endOfCurrentDay, allEvents);
};

/**
 * get all-day events by day.
 * @param events
 * @param drafts - should get all the drafts in the db
 * @param firstDay - start of day time in UTC
 * @param daysToShow
 * @param calendarID
 */
export const getAllDayEventsForDaysRange = (
  events: DecryptedEvent[],
  drafts: DecryptedDraft[],
  recurringParents: (DecryptedEvent | DecryptedDraft)[],
  firstDay: Dayjs,
  daysToShow: number
) => {
  const calendarID = getCurrentCalendarID();
  if (!calendarID) return [];

  const allDayEvents = events.filter(filterAllDayEvents);
  const allDayDrafts = drafts.filter(filterAllDayEvents);
  const start = firstDay.startOf(DATE_UNIT);
  const end = firstDay.add(daysToShow, DAY_UNIT).endOf(DATE_UNIT);

  const virtualizedEvents = getVirtualizedRecurrences(
    recurringParents.filter(filterAllDayEvents).filter((event) => doesEventExistForAttendee(event, calendarID)),
    events,
    start.valueOf(),
    end.valueOf()
  );

  const allDayEventsWithVirtualized = [...allDayEvents, ...virtualizedEvents];

  const allDayEventsByDays = range(daysToShow).map((day) => {
    const currentDay = start.add(day, DAY_UNIT);
    const allEventsForTheDay = getEventsForDay<DecryptedEvent>(currentDay, allDayEventsWithVirtualized);

    // get drafts for the day and add to the drafts list - will be used later to replace actual events with drafts
    const allDraftForTheDay = getEventsForDay<DecryptedDraft>(currentDay, allDayDrafts);

    const eventsWithoutParentsThatHaveInstances = filterParentsThatHaveInstance(
      allEventsForTheDay,
      allDayEventsWithVirtualized
    );

    // filter all deleted events or events the user is not active attendee in
    // no need to do teh same for drafts' because drafts wil always be for the current user
    const eventsWithCurrentUser = eventsWithoutParentsThatHaveInstances.filter((event) =>
      doesEventExistForAttendee(event, calendarID)
    );

    // filter events with active draft
    // (we're passing all the drafts in the db to make sure there is no active draft out of the time range scope)
    // For example, you can have a draft for an event that is in a different month, we will still want to hide the related event
    const eventWithoutPendingChanges = filterEventsWithPendingChanges(eventsWithCurrentUser, drafts);

    return [...eventWithoutPendingChanges, ...allDraftForTheDay].sort(
      (eventA, eventB) => eventA.plainContent.startDate - eventB.plainContent.startDate
    );
  });

  return allDayEventsByDays;
};

/**
 * filter events with active drafts
 * join draft relevant for the days range
 * @param events - the events relevant for this days range
 * @param drafts - all the drafts in the db
 * @param firstDay
 * @param daysToShow
 * @param calendarID
 * @returns
 */
export const getEventsForDaysRange = (
  events: DecryptedEvent[],
  drafts: DecryptedDraft[],
  recurringParents: (DecryptedEvent | DecryptedDraft)[],
  firstDay: Dayjs,
  daysToShow: number
) => {
  const calendarID = getCurrentCalendarID();
  if (!calendarID) return [];

  const notAllDayEvents = events.filter(filterNotAllDayEvents);
  const notAllDayDrafts = drafts.filter(filterNotAllDayEvents);
  const start = firstDay.startOf(DATE_UNIT);
  const end = firstDay.endOf(DATE_UNIT).add(daysToShow - 1, DAY_UNIT);

  const draftInDaysRange = getEventsForPeriod(start.valueOf(), end.valueOf(), notAllDayDrafts);

  const eventsWithoutParentsThatHaveInstances = filterParentsThatHaveInstance(notAllDayEvents, events);

  // filter all deleted events or events the user is not active attendee in
  // no need to do teh same for drafts' because drafts wil always be for the current user
  const eventsWithCurrentUser = eventsWithoutParentsThatHaveInstances.filter((event) =>
    doesEventExistForAttendee(event, calendarID)
  );

  const virtualizedEvents = getVirtualizedRecurrences(
    recurringParents.filter(filterNotAllDayEvents).filter((event) => doesEventExistForAttendee(event, calendarID)),
    events,
    start.valueOf(),
    end.valueOf()
  );

  // filter events with active draft
  // (we're passing all the drafts in the  db to make sure there is no active draft out of the time range scope)
  const eventWithoutPendingChanges = filterEventsWithPendingChanges(
    [...eventsWithCurrentUser, ...virtualizedEvents],
    drafts
  );

  const eventAndDrafts: (DecryptedDraft | DecryptedEvent)[] = [...eventWithoutPendingChanges, ...draftInDaysRange].sort(
    (eventA, eventB) => eventA.plainContent.startDate - eventB.plainContent.startDate
  );

  return eventAndDrafts;
};
