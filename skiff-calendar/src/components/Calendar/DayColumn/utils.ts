import { dayjs, sortByDuration } from '../../../utils';
import { CalculatedEvent, DisplayEvent } from '../types';
export const hasConflictWithNextEvent = (
  currentEventStartDate: number,
  currentEventEndDate: number,
  nextEventStartDate: number
) => {
  // if event start times differ by at least 45m, don't treat as overlapping (enough space to read 2 lines of text)
  const bufferEndTime = dayjs(currentEventStartDate).add(45, 'minute');

  // If the next event's start date is after or exactly 45 minutes from the current event's end date, treat them as non-overlapping.
  if (dayjs(nextEventStartDate).isAfter(bufferEndTime) || dayjs(nextEventStartDate).isSame(bufferEndTime)) {
    return false;
  }

  return dayjs(nextEventStartDate).isBefore(dayjs(currentEventEndDate));
};
const sortByDate = (a: DisplayEvent, b: DisplayEvent) => a.plainContent.startDate - b.plainContent.startDate;

const sortByID = (a: DisplayEvent, b: DisplayEvent) =>
  (a.plainContent.parentRecurrenceID ?? '').localeCompare(b.plainContent.parentRecurrenceID ?? '');

/**
 * Handle positional conflicts between events, calculate indentation and width and left pos
 *
 * < ----- Width ------ >
 * | ---- Event  3 ---- |
 *
 *  < - Left >
 *  | Event 2 | Event 1 |
 * ^- 1 Indentation
 *
 */
export const calculateEvents = (events: DisplayEvent[]) => {
  const calculatedEvents: CalculatedEvent[] = [];
  const groups: DisplayEvent[][] = [];
  let currentGroup: DisplayEvent[] = [];

  // Sort events by date then duration if date is the same, and if they have the same duration and start time - sort by their IDs
  events = events.sort((a, b) => sortByDate(a, b) || sortByDuration(a, b) || sortByID(a, b));

  const indentationsList: { endDate: number; eventId: string }[][] = [];
  const indentationMap = new Map<string, number>();

  events.forEach((currentEvent, i) => {
    /**
     * Indentation calculation
     *
     * for each event, check what past events endDate is after his startDate
     * Set indentation to highest indentation the event is colliding + 1
     *
     * Events are ordered by startDate !
     *
     * for each event check with what last event collisions you are also colliding.
     * including that last event (he is not colliding with himself).
     *
     * take the last event from the collision list and add 1 to his indentation.
     * because they are ordered by start date last event in that list must be the most indented
     */
    if (i === 0) {
      // First event
      indentationsList.push([{ endDate: currentEvent.plainContent.endDate, eventId: currentEvent.parentEventID }]);
      indentationMap.set(currentEvent.parentEventID, 0);
    } else {
      const lastIndentationList = [...indentationsList[i - 1]];
      // Filter out all non-colliding events
      const relevantEvents = lastIndentationList.filter(({ endDate }) => endDate > currentEvent.plainContent.startDate);
      if (relevantEvents.length) {
        // Has a collision
        indentationMap.set(
          currentEvent.parentEventID,
          (indentationMap.get(relevantEvents[relevantEvents.length - 1].eventId) || 0) + 1
        );
      } else {
        // No collision
        indentationMap.set(currentEvent.parentEventID, 0);
      }

      // Add current event to the current collision list
      indentationsList.push([
        ...relevantEvents,
        {
          endDate: currentEvent.plainContent.endDate,
          eventId: currentEvent.parentEventID
        }
      ]);
    }

    if (currentGroup.length > 0) {
      const lastEventInGroup = currentGroup[currentGroup.length - 1];

      if (
        hasConflictWithNextEvent(
          lastEventInGroup.plainContent.startDate,
          lastEventInGroup.plainContent.endDate,
          currentEvent.plainContent.startDate
        )
      ) {
        currentGroup.push(currentEvent);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentEvent]; // Create a new group for non-overlapping event
      }
    } else {
      currentGroup.push(currentEvent); // Add the first event to the current group
    }
  });

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  // Go over all event groups and calculate width + left
  groups.forEach((group) => {
    group.forEach((event, indexInGroup) => {
      const width = (group.length - indexInGroup) / group.length;
      calculatedEvents.push({
        event,
        indentation: indexInGroup === 0 ? indentationMap.get(event.parentEventID) || 0 : 0,
        width,
        left: 1 - width
      });
    });
  });
  return calculatedEvents;
};
