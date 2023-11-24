import dayjs, { Dayjs } from 'dayjs';
import IsSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import range from 'lodash/range';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DAYS_IN_WEEK, DAY_UNIT, WEEK_UNIT, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import { useAppSelector } from '..';
import { MonthlyDisplayEvent } from '../../components/Calendar/views/MonthlyView/MonthlyView.types';
import {
  getSortedAllDayEvents,
  getSortedTimedEvents
} from '../../components/Calendar/views/MonthlyView/MonthlyView.utils';
import { WEEKS_IN_MONTH } from '../../constants/time.constants';
import { isDraft } from '../../storage/models/draft/types';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';
import { isRecurringChild } from '../recurringUtils';

import { useGetDayEvents } from './useGetDayEvents';
import { useGetMaxNumDisplayedEvents } from './useGetMaxNumDisplayedEvents';
import { useGetMonthViewStartAndEndDates } from './useGetMonthViewStartAndEndDates';

dayjs.extend(IsSameOrAfter);

/**
 * Sorts and manages the display of events in a calendar monthly view.
 * It takes into account various properties of the events such as time, type (all-day or timed), and whether they span multiple days.
 * Returns a 2D array of MonthlyDisplayEvent objects sorted in order of appearance for each day of the week for each week of the month.
 */
export const useSortMonthlyEvents = (
  /** All all-day events within the current view */
  allDayEventsInView: DecryptedDraft[][],
  /** All timed events within the current view */
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[],
  virtualSelectedDate?: Dayjs
) => {
  const [sortedEventsInView, setSortedEventsInView] = useState(
    new Array<(MonthlyDisplayEvent | null)[][]>(WEEKS_IN_MONTH).fill([])
  );

  const [defaultCalendarColor] = useUserPreference(StorageTypes.DEFAULT_CALENDAR_COLOR);

  const maxNumDisplayedEvents = useGetMaxNumDisplayedEvents();
  const getDayEvents = useGetDayEvents(timedEventsInView);
  const getMonthViewStartAndEndDates = useGetMonthViewStartAndEndDates();

  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);
  const selectedDate = virtualSelectedDate ?? selectedViewDate;

  const monthStartDate = useMemo(
    () => getMonthViewStartAndEndDates(selectedDate).monthStartDate,
    [selectedDate, getMonthViewStartAndEndDates]
  );

  // Classifies all-day events as either multi-day or single-day events and sets each event's display properties
  const classifyAllDayEventsForDay = useCallback(
    (
      allDayEventsForDay: DecryptedDraft[],
      currDayDate: Dayjs,
      prevDayEvents: (MonthlyDisplayEvent | null)[],
      nextDayAllDayEvents: DecryptedDraft[],
      weekStartDate: Dayjs,
      weekEndDate: Dayjs
    ) => {
      const multiDayAllDayEvents: MonthlyDisplayEvent[] = [];
      const singleDayAllDayEvents: MonthlyDisplayEvent[] = [];

      // Loop through each event to classify and set its display properties
      allDayEventsForDay.forEach((currEvent) => {
        const { startDate, endDate } = currEvent.plainContent;
        const { color: customColor } = currEvent.decryptedPreferences || {};

        const startDateObject = dayjs(startDate);
        const endDateObject = dayjs(endDate);

        // Check if the event starts before or ends after the current week
        const startsBeforeWeekStart = startDateObject.isBefore(weekStartDate);
        const endsAfterWeekEnd = endDateObject.isAfter(weekEndDate);

        // Check for the same event in previous and next day
        const prevEventExists = !!prevDayEvents
          .slice(0, maxNumDisplayedEvents)
          .find((prevEvent) => prevEvent?.parentEventID === currEvent.parentEventID);
        const nextEventExists = nextDayAllDayEvents.find(
          (nextEvent) => nextEvent.parentEventID === currEvent.parentEventID
        );

        // Determine if it's the first or last instance of the event for the week
        const isFirstDisplayedEvent = !prevEventExists;
        const isLastDisplayedEvent = !nextEventExists;

        const startOfCurrDay = currDayDate.startOf(DAY_UNIT);
        const endOfCurrDay = currDayDate.endOf(DAY_UNIT);

        const startOfStartDate = startDateObject.startOf(DAY_UNIT);
        const endOfEndDate = endDateObject.endOf(DAY_UNIT);

        const endOfWeekEndDate = weekEndDate.endOf(DAY_UNIT);

        // Determine display start and end dates
        const displayStartDate = isFirstDisplayedEvent ? startOfCurrDay.valueOf() : startOfStartDate.valueOf();
        const displayEndDate = isLastDisplayedEvent
          ? endOfCurrDay.valueOf()
          : endsAfterWeekEnd
          ? endOfWeekEndDate.valueOf()
          : endOfEndDate.valueOf();

        // Prepare the display properties for the current event
        const displayEvent = {
          ...currEvent,
          color: customColor ?? defaultCalendarColor,
          displayStartDate,
          displayEndDate,
          isSplitDisplayEvent: startsBeforeWeekStart,
          isFirstDisplayedEvent,
          isLastDisplayedEvent,
          // Ghost events are used for alignment and are not primarily visible
          isGhost: !isFirstDisplayedEvent
        };

        // Classify event as multi-day or single-day and store it in its corresponding array
        const isMultiDayEvent = !!prevEventExists || !!nextEventExists;
        if (isMultiDayEvent) multiDayAllDayEvents.push(displayEvent);
        else singleDayAllDayEvents.push(displayEvent);
      });

      return { multiDayAllDayEvents, singleDayAllDayEvents };
    },
    [defaultCalendarColor, maxNumDisplayedEvents]
  );

  // Shifts new events to the top of the current day's event list
  // and re-arranges other days events accordingly.
  const handleShiftNewEvent = useCallback(
    (newEventInWeek: DecryptedDraft, sortedDayEvents: (MonthlyDisplayEvent | null)[]) => {
      const newDisplayEvent = sortedDayEvents.find(
        (dayEvent) => dayEvent?.parentEventID === newEventInWeek.parentEventID
      );

      if (!!newDisplayEvent) {
        // If the new event exists on the current day, unshift it to the top
        const originalIndex = sortedDayEvents.indexOf(newDisplayEvent);
        sortedDayEvents.splice(originalIndex, 1);
        sortedDayEvents.unshift(newDisplayEvent);
      } else {
        // If the new event does not exist on the current day,
        // check whether or not the current day has an event that extends to or after the day that has the new event
        // and shift accordingly
        const shouldShift = sortedDayEvents.find(
          (event) =>
            event?.decryptedContent.isAllDay &&
            dayjs(event.displayStartDate).isBefore(newEventInWeek?.plainContent.startDate) &&
            dayjs(event.displayEndDate).isSameOrAfter(newEventInWeek?.plainContent.startDate)
        );
        if (shouldShift) {
          // Find an event that does not extend to or after the day that has the new event to place at the top of the day cell
          const indexToUnshift = sortedDayEvents.findIndex(
            (event) =>
              dayjs(event?.displayStartDate).isAfter(newEventInWeek?.plainContent.endDate) ||
              dayjs(event?.displayEndDate).isBefore(newEventInWeek?.plainContent.startDate)
          );
          if (indexToUnshift !== -1 && sortedDayEvents[indexToUnshift]?.isFirstDisplayedEvent) {
            [sortedDayEvents[indexToUnshift], sortedDayEvents[0]] = [
              sortedDayEvents[0],
              sortedDayEvents[indexToUnshift]
            ];
          } else if (indexToUnshift === -1) {
            // If no such event exists, add a ghost event at the top of the day cell
            sortedDayEvents.unshift(null);
          }
        }
      }
    },
    []
  );

  // Sorts and arranges events for a single day
  const sortAndArrangeDayEvents = useCallback(
    (
      multiDayAllDayEvents: MonthlyDisplayEvent[],
      singleDayAllDayEvents: MonthlyDisplayEvent[],
      timedEvents: MonthlyDisplayEvent[],
      prevDayEvents: (MonthlyDisplayEvent | null)[],
      newEventInWeek?: DecryptedDraft
    ) => {
      // Sort all-day events by duration then by title
      const sortedMultiDayAllDayEvents = getSortedAllDayEvents(multiDayAllDayEvents) as MonthlyDisplayEvent[];
      const sortedSingleDayAllDayEvents = getSortedAllDayEvents(singleDayAllDayEvents) as MonthlyDisplayEvent[];
      // Sort timed events by title if they have the same start date
      const sortedTimedEvents = getSortedTimedEvents(timedEvents);

      // Combine sorted events for the day
      // All-day events take precedence over timed events
      // Multi-day all-day events take precedence over single-day all-day events
      const sortedDayEvents: (MonthlyDisplayEvent | null)[] = [
        ...sortedMultiDayAllDayEvents,
        ...sortedSingleDayAllDayEvents,
        ...sortedTimedEvents
      ];

      if (newEventInWeek) {
        handleShiftNewEvent(newEventInWeek, sortedDayEvents);
      }

      if (!sortedMultiDayAllDayEvents.length || !prevDayEvents.length) return sortedDayEvents;

      // Arrange events such that multi-day all-day events would maintain their position (index) across all days
      sortedMultiDayAllDayEvents.forEach((currEvent) => {
        // Do nothing if the event is being displayed for the first time
        if (currEvent.isFirstDisplayedEvent) return;

        // Current position of the event
        const currIndex = sortedDayEvents.findIndex((dayEvent) => dayEvent?.parentEventID === currEvent.parentEventID);
        // The position of the same event on the previous day
        const prevIndex = prevDayEvents.findIndex((prevEvent) => prevEvent?.parentEventID === currEvent.parentEventID);

        // Do nothing if current index matches the previous index,
        // indicating that the event is in the correct position
        if (currIndex === prevIndex) return;

        // If the current index does not match the previous index, we try to make them match
        if (!sortedDayEvents[prevIndex]) {
          // If the required index doesn't exist in the event array, add ghost events up until we reach the required index
          for (let i = sortedDayEvents.length; i < prevIndex; i++) {
            sortedDayEvents.push(null);
          }
          sortedDayEvents.push(currEvent);
        } else {
          // If the required index exists, switch the two events
          [sortedDayEvents[currIndex], sortedDayEvents[prevIndex]] = [sortedDayEvents[prevIndex], currEvent];
        }
      });

      return sortedDayEvents;
    },
    [handleShiftNewEvent]
  );

  // Gets the newly created event within the current week if it exists
  const getNewEventInWeek = useCallback(
    (allDayEventsInWeek: DecryptedDraft[][], timedEventsInWeek: MonthlyDisplayEvent[][]) => {
      let newEventInWeek: DecryptedDraft | undefined = undefined;
      range(DAYS_IN_WEEK).forEach((dayIndex) => {
        const dayEvents = [...(allDayEventsInWeek[dayIndex] ?? []), ...timedEventsInWeek[dayIndex]];
        dayEvents.forEach((event) => {
          const isNewEvent = isDraft(event) && !isRecurringChild(event);
          if (isNewEvent) newEventInWeek = event;
        });
      });
      return newEventInWeek;
    },
    []
  );

  // Sorts and arranges events for a single week
  const sortAndArrangeWeekEvents = useCallback(
    (
      timedEventsInWeek: MonthlyDisplayEvent[][],
      allDayEventsInWeek: DecryptedDraft[][],
      weekStartDate: Dayjs,
      weekEndDate: Dayjs
    ) => {
      // Array holding sorted events for each day of the week
      const sortedWeekEvents = new Array<(MonthlyDisplayEvent | null)[]>(DAYS_IN_WEEK).fill([]);
      // Newly created event within the curr week
      const newEventInWeek = getNewEventInWeek(allDayEventsInWeek, timedEventsInWeek);

      // Loop through each day of the week
      range(DAYS_IN_WEEK).forEach((dayIndex) => {
        if (!allDayEventsInWeek[dayIndex]) return;

        const currDayDate = weekStartDate.add(dayIndex, DAY_UNIT);

        // All events on the prev day
        const prevDayEvents = dayIndex > 0 ? sortedWeekEvents[dayIndex - 1] : [];
        // All-day events on the next day
        const nextDayAllDayEvents = dayIndex < allDayEventsInWeek.length - 1 ? allDayEventsInWeek[dayIndex + 1] : [];

        // Classify all-day events as either multi-day or single-day all-day events
        const { multiDayAllDayEvents, singleDayAllDayEvents } = classifyAllDayEventsForDay(
          allDayEventsInWeek[dayIndex],
          currDayDate.utc(true),
          prevDayEvents,
          nextDayAllDayEvents,
          weekStartDate.utc(true),
          weekEndDate.utc(true)
        );

        // Sort and arrange events for the current day
        const sortedDayEvents = sortAndArrangeDayEvents(
          multiDayAllDayEvents,
          singleDayAllDayEvents,
          timedEventsInWeek[dayIndex],
          prevDayEvents,
          newEventInWeek
        );

        sortedWeekEvents.splice(dayIndex, 1, sortedDayEvents);
      });

      return sortedWeekEvents;
    },
    [classifyAllDayEventsForDay, getNewEventInWeek, sortAndArrangeDayEvents]
  );

  useEffect(() => {
    // Loop through each week of the month to sort and arrange events for each day of that week
    for (let weekIndex = 0; weekIndex < WEEKS_IN_MONTH; weekIndex++) {
      const firstDayIndex = DAYS_IN_WEEK * weekIndex;
      const lastDayIndex = firstDayIndex + DAYS_IN_WEEK;

      // Slice to get all-day events for this week
      const allDayEventsInWeek = allDayEventsInView.slice(firstDayIndex, lastDayIndex);

      const weekStartDate = monthStartDate.add(weekIndex, WEEK_UNIT).startOf(DAY_UNIT);
      const weekEndDate = weekStartDate.add(DAYS_IN_WEEK - 1, DAY_UNIT).endOf(DAY_UNIT);

      // Timed events for the curr week, but only on their first instance
      const timedEventsInWeek = range(DAYS_IN_WEEK).map((dayIndex) => {
        const currDayDate = weekStartDate.add(dayIndex, DAY_UNIT);
        // Filter out multi-day timed events to only show on the first day
        return getDayEvents(currDayDate).filter((timedEvent) => timedEvent.isFirstDisplayedEvent);
      });

      // Sort and arrange events for the current week
      const sortedWeekEvents = sortAndArrangeWeekEvents(
        timedEventsInWeek,
        allDayEventsInWeek,
        weekStartDate,
        weekEndDate
      );

      sortedEventsInView[weekIndex] = sortedWeekEvents;
    }

    setSortedEventsInView([...sortedEventsInView]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDayEventsInView, monthStartDate, sortAndArrangeWeekEvents]);

  return sortedEventsInView;
};
