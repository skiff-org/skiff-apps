import dayjs from 'dayjs';

import { plainMockEvent } from '../../../tests/mocks/encryptedEvent';
import { DAY_UNIT } from '../../constants/time.constants';
import { DecryptedEvent } from '../../storage/models/event/types';

import { getAllDayEventsForDaysRange, getEventsBetween, getEventsCovering, getEventsForDaysRange } from './useEvents';

const calendarID = '891b0268-cd69-4124-b704-f71fc32ee01d';

jest.mock('../../apollo/currentCalendarMetadata', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../../apollo/currentCalendarMetadata');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    getCurrentCalendarID: () => calendarID
  };
});

const startDate = dayjs('2021-01-01');
const endDate = startDate.add(7, DAY_UNIT);

const betweenEvents = [
  plainMockEvent({
    plainContent: {
      startDate: startDate.add(1, DAY_UNIT).valueOf(),
      endDate: startDate.add(3, DAY_UNIT).valueOf()
    }
  }),
  plainMockEvent({
    plainContent: {
      startDate: startDate.add(4, DAY_UNIT).valueOf(),
      endDate: startDate.add(5, DAY_UNIT).valueOf()
    }
  }),
  plainMockEvent({
    plainContent: {
      startDate: startDate.add(1, DAY_UNIT).valueOf()
    }
  })
];

const coveringEvents = [
  plainMockEvent({
    plainContent: {
      startDate: startDate.subtract(1, DAY_UNIT).valueOf(),
      endDate: endDate.add(2, DAY_UNIT).valueOf()
    }
  }),
  plainMockEvent({
    plainContent: {
      startDate: startDate.subtract(10, DAY_UNIT).valueOf(),
      endDate: endDate.add(8, DAY_UNIT).valueOf()
    }
  })
];

const nonInPeriodEvents = [
  plainMockEvent({
    plainContent: {
      startDate: startDate.subtract(10, DAY_UNIT).valueOf(),
      endDate: startDate.subtract(1, DAY_UNIT).valueOf()
    }
  }),
  plainMockEvent({
    plainContent: {
      startDate: startDate.add(8, DAY_UNIT).valueOf(),
      endDate: startDate.add(18, DAY_UNIT).valueOf()
    }
  })
];

const events = [...betweenEvents, ...coveringEvents, ...nonInPeriodEvents];
const drafts = [
  { ...betweenEvents[0], externalID: 'Draft' },
  { ...coveringEvents[0], externalID: 'Draft' },
  { ...nonInPeriodEvents[0], externalID: 'Draft' }
];

describe('getEventsForPeriod', () => {
  test('getEventsBetween', () => {
    const between = getEventsBetween(startDate.valueOf(), endDate.valueOf(), events);

    expect(between.length).toBe(betweenEvents.length);
    between.forEach((event) => {
      expect(betweenEvents.map((e) => e.parentEventID).includes(event.parentEventID)).toBe(true);
    });
  });

  test('getEventsCovering', () => {
    const covering = getEventsCovering(startDate.valueOf(), endDate.valueOf(), events);

    expect(covering.length).toBe(coveringEvents.length);
    covering.forEach((event) => {
      expect(coveringEvents.map((e) => e.parentEventID).includes(event.parentEventID)).toBe(true);
    });
  });

  test('getEventsForDaysRange', () => {
    const weekEvents = [...coveringEvents, ...betweenEvents];
    const eventsForRange = getEventsForDaysRange(weekEvents, drafts, [], startDate, 7);

    expect(eventsForRange.length).toBe(weekEvents.length);

    eventsForRange.forEach((event) => {
      expect(weekEvents.map((e) => e.parentEventID).includes(event.parentEventID)).toBe(true);

      if (drafts.map((e) => e.parentEventID).includes(event.parentEventID)) {
        expect((event as DecryptedEvent).externalID).toBe('Draft');
      }
    });
  });

  const allDayEvents = events.map((event) => ({
    ...event,
    decryptedContent: {
      ...event.decryptedContent,
      isAllDay: true
    }
  }));

  const allDayDrafts = drafts.map((draft) => ({
    ...draft,
    decryptedContent: {
      ...draft.decryptedContent,
      isAllDay: true
    }
  }));

  test('getAllDayEventsForDaysRange - Split to many days', () => {
    const betweenEvent = allDayEvents[0];
    const startDateDayjs = dayjs(betweenEvent.plainContent.startDate);
    const endDateDayjs = dayjs(betweenEvent.plainContent.endDate);
    const eventsForRange = getAllDayEventsForDaysRange([betweenEvent], [], [], startDate, 7);

    eventsForRange.forEach((dayEvents, index) => {
      if (startDate.add(index, DAY_UNIT).isBetween(startDateDayjs, endDateDayjs, null, '[]')) {
        expect(dayEvents.length).toBe(1);
      } else {
        expect(dayEvents.length).toBe(0);
      }
    });
  });

  test('getAllDayEventsForDaysRange - Hide day from non all-day draft', () => {
    const betweenEvent = allDayEvents[0];
    const betweenDraft = {
      ...allDayDrafts[0],
      decryptedContent: { ...allDayDrafts[0].decryptedContent, isAllDay: false }
    };

    const eventsForRange = getAllDayEventsForDaysRange([betweenEvent], [betweenDraft], [], startDate, 7);
    expect(eventsForRange.flat().length).toBe(0);
  });

  test('getAllDayEventsForDaysRange - Show expected events', () => {
    const weekEvents = allDayEvents.filter(
      ({ parentEventID }) => !nonInPeriodEvents.map((e) => e.parentEventID).includes(parentEventID)
    );
    const eventsForRange = getAllDayEventsForDaysRange(allDayEvents, allDayDrafts, [], startDate, 7);

    eventsForRange.forEach((daysEvents, dayIndex) => {
      const expectedLength = weekEvents.filter((event) => {
        const startDateDayjs = dayjs(event.plainContent.startDate);
        const endDateDayjs = dayjs(event.plainContent.endDate);
        return startDate.add(dayIndex, DAY_UNIT).isBetween(startDateDayjs, endDateDayjs, null, '[]');
      }).length;

      expect(daysEvents.length).toBe(expectedLength);

      daysEvents.forEach((event) => {
        expect(weekEvents.map((e) => e.parentEventID).includes(event.parentEventID)).toBe(true);

        if (drafts.map((e) => e.parentEventID).includes(event.parentEventID)) {
          expect((event as DecryptedEvent).externalID).toBe('Draft');
        }
      });
    });
  });
});
