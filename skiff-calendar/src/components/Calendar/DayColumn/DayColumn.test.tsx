import dayjs, { Dayjs } from 'dayjs';
import { v4 } from 'uuid';

import { EventLocalMetadata } from '../../../storage/models/event/types';
import { DisplayEvent } from '../types';

import { calculateEvents } from '.';

const createMockEvent = (start: Dayjs, end: Dayjs): DisplayEvent => {
  return {
    decryptedContent: {
      title: start.format('YYYY-MM-DD HH:mm:ss'),
      attendees: [],
      lastUpdateKeyMap: {}
    },
    plainContent: {
      startDate: start.valueOf(),
      endDate: end.valueOf(),
      creatorCalendarID: 'creatorCalendarID',
      lastUpdateKeyMap: {},
      externalCreator: 'externalCreator',
      recurrenceDate: 0,
      sequence: 0,
      reminders: []
    },
    displayStartDate: start.valueOf(),
    displayEndDate: end.valueOf(),
    parentEventID: v4(),
    isSplitDisplayEvent: false,
    isLastDisplayedEvent: false,
    isFirstDisplayedEvent: false,
    color: 'blue',
    decryptedSessionKey: 'decryptedSessionKey',
    localMetadata: {} as unknown as EventLocalMetadata,
    externalID: 'externalID'
  };
};
const createMockEvents = (eventDates: { start: Dayjs; end: Dayjs }[]): DisplayEvent[] => {
  return eventDates.map(({ start, end }) => createMockEvent(start, end));
};

describe('DayColumn Test', () => {
  it('Two overlapping events with same start time should have full width and half width', () => {
    /**
     *    Event |  Event    *
     */
    const start = dayjs();
    const end = start.add(30, 'minute');
    const event = { start, end };
    const displayEvents = createMockEvents([event, event]);
    const calculatedEvents = calculateEvents(displayEvents);

    expect(calculatedEvents).toHaveLength(2);
    expect(calculatedEvents[0].width).toBe(1); // Full width
    expect(calculatedEvents[0].left).toBe(0); // At start
    expect(calculatedEvents[0].indentation).toBe(0);
    expect(calculatedEvents[1].width).toBe(0.5); // Half width
    expect(calculatedEvents[1].left).toBe(0.5); // In the middle
    expect(calculatedEvents[1].indentation).toBe(0);
  });

  it('Two overlapping events without same start time should have full width and half width', () => {
    /**
     *    Event |
     *          |  Event    *
     */
    const start1 = dayjs();
    const start2 = start1.add(5, 'minute');
    const end = start1.add(20, 'minute');
    const event1 = { start: start1, end };
    const event2 = { start: start2, end };
    const displayEvents = createMockEvents([event1, event2]);
    const calculatedEvents = calculateEvents(displayEvents);
    expect(calculatedEvents).toHaveLength(2);
    expect(calculatedEvents[0].width).toBe(1); // Full width
    expect(calculatedEvents[0].left).toBe(0); // At start
    expect(calculatedEvents[0].indentation).toBe(0);
    expect(calculatedEvents[1].width).toBe(0.5); // Half width
    expect(calculatedEvents[1].left).toBe(0.5); // In the middle
    expect(calculatedEvents[1].indentation).toBe(0);
  });

  it('Three overlapping events with same start time should have full width, 2/3 width and 1/3 width', () => {
    /**
     *    Event |  Event |  Event    *
     */
    const start = dayjs();
    const end = start.add(20, 'minute');
    const event = { start, end };
    const displayEvents = createMockEvents([event, event, event]);
    const calculatedEvents = calculateEvents(displayEvents);
    expect(calculatedEvents).toHaveLength(3);
    expect(calculatedEvents[0].width).toBe(1); // Full width
    expect(calculatedEvents[0].left).toBe(0); // At start
    expect(calculatedEvents[0].indentation).toBe(0);
    expect(calculatedEvents[1].width).toBeCloseTo(2 / 3); // 2/3 width
    expect(calculatedEvents[1].left).toBeCloseTo(1 / 3); // A third from start
    expect(calculatedEvents[1].indentation).toBe(0);
    expect(calculatedEvents[2].width).toBeCloseTo(1 / 3); // 1/3 width
    expect(calculatedEvents[2].left).toBeCloseTo(2 / 3); // Two thirds from start
    expect(calculatedEvents[2].indentation).toBe(0);
  });

  it('Two overlapping events with another non-overlapping event, should have full width, half width, and full width', () => {
    /**
     *    Event |  Event    *
     *    Event             *
     */
    const start1 = dayjs();
    const end1 = start1.add(15, 'minute');
    const event1 = { start: start1, end: end1 };
    const start2 = end1;
    const end2 = start2.add(15, 'minute');
    const event2 = { start: start2, end: end2 };
    const displayEvents = createMockEvents([event1, event1, event2]);
    const calculatedEvents = calculateEvents(displayEvents);
    expect(calculatedEvents).toHaveLength(3);
    expect(calculatedEvents[0].width).toBe(1); // Full width
    expect(calculatedEvents[0].left).toBe(0); // At start
    expect(calculatedEvents[0].indentation).toBe(0);
    expect(calculatedEvents[1].width).toBe(0.5); // Half width
    expect(calculatedEvents[1].left).toBe(0.5); // In the middle
    expect(calculatedEvents[1].indentation).toBe(0);
    expect(calculatedEvents[2].width).toBe(1); // Full width;
    expect(calculatedEvents[2].left).toBe(0); // At start
    expect(calculatedEvents[2].indentation).toBe(0);
  });

  it('Events with same start date should be ordered by longest to shortest duration', () => {
    const start = dayjs();
    const end1 = start.add(15, 'minute');
    const end2 = start.add(30, 'minute');
    const end3 = start.add(45, 'minute');
    const event1 = { start, end: end1 };
    const event2 = { start, end: end2 };
    const event3 = { start, end: end3 };
    const displayEvents = createMockEvents([event1, event2, event3]);
    const calculatedEvents = calculateEvents(displayEvents);

    expect(calculatedEvents).toHaveLength(3);
    // First event should be longer than second
    expect(calculatedEvents[0].event.plainContent.endDate).toBeGreaterThan(
      calculatedEvents[1].event.plainContent.endDate
    );
    // Second event should be longer than third
    expect(calculatedEvents[1].event.plainContent.endDate).toBeGreaterThan(
      calculatedEvents[2].event.plainContent.endDate
    );
    // First, second and third events should have full, 2/3 and 1/3 widths
    expect(calculatedEvents[0].width).toBe(1); // Full width
    expect(calculatedEvents[0].left).toBe(0); // At start
    expect(calculatedEvents[1].width).toBeCloseTo(2 / 3); // 2/3 width
    expect(calculatedEvents[1].left).toBeCloseTo(1 / 3); // A third from start
    expect(calculatedEvents[2].width).toBeCloseTo(1 / 3); // 1/3 width
    expect(calculatedEvents[2].left).toBeCloseTo(2 / 3); // Two thirds from start

    expect(calculatedEvents[0].indentation).toBe(0);
    expect(calculatedEvents[1].indentation).toBe(0);
    expect(calculatedEvents[2].indentation).toBe(0);
  });

  it('Overlapping event should get base indentation from parent', () => {
    /**
     *  | Event 1 |                                *
     *  | Event 1 |  Event 2 |                     *
     *  | Event 1 |  Event 2 | Event 3 |           *
     *  | Event 1 |          | Event 3 |           *
     *  | Event 1 |          | Event 3 | Event 4 | *
     *  | Event 1 |          |         | Event 4 | *
     */
    const start = dayjs();
    const end1 = start.add(45 * 6, 'minute');
    const end2 = start.add(45 * 3, 'minute');
    const end3 = start.add(45 * 5, 'minute');
    const end4 = start.add(45 * 6, 'minute');

    const start1 = start;
    const start2 = start.add(45, 'minute');
    const start3 = start.add(45 * 2, 'minute');
    const start4 = start.add(45 * 4, 'minute');

    const event1 = { start: start1, end: end1 };
    const event2 = { start: start2, end: end2 };
    const event3 = { start: start3, end: end3 };
    const event4 = { start: start4, end: end4 };

    const displayEvents = createMockEvents([event1, event2, event3, event4]);
    const calculatedEvents = calculateEvents(displayEvents);

    expect(calculatedEvents).toHaveLength(4);

    expect(calculatedEvents[0].width).toBe(1);
    expect(calculatedEvents[0].left).toBe(0);
    expect(calculatedEvents[0].indentation).toBe(0);

    expect(calculatedEvents[1].width).toBe(1);
    expect(calculatedEvents[1].left).toBe(0);
    expect(calculatedEvents[1].indentation).toBe(1);

    expect(calculatedEvents[2].width).toBe(1);
    expect(calculatedEvents[2].left).toBe(0);
    expect(calculatedEvents[2].indentation).toBe(2);

    expect(calculatedEvents[3].width).toBe(1);
    expect(calculatedEvents[3].left).toBe(0);
    expect(calculatedEvents[3].indentation).toBe(3);
  });
});
