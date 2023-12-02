import dayjs from 'dayjs';
import { RecurrenceDay, RecurrenceFrequency } from 'skiff-graphql';

import { RecurrenceRule } from '../src';

const startDate = dayjs(1577757600000); // Use explicit date to avoid timezone issues

describe('test Recurrence Rule class', () => {
  const simpleRule = new RecurrenceRule({
    frequency: RecurrenceFrequency.Daily,
    startDate: startDate.valueOf()
  });

  test('simple rule, should return 7 dates', () => {
    const dates = simpleRule.getDatesInRange(startDate.toDate(), startDate.add(6, 'day').toDate());
    expect(dates.length).toBe(7);
  });

  test('simple rule, should cap to 1000', () => {
    const dates = simpleRule.getAllDates();
    expect(dates.length).toBe(1000);
  });

  test('byDay rule, should return correct dates', () => {
    const byDayRule = new RecurrenceRule({
      frequency: RecurrenceFrequency.Weekly,
      startDate: startDate.valueOf(),
      byDays: [RecurrenceDay.Sunday, RecurrenceDay.Monday],
      timezone: 'UTC'
    });
    const dates = byDayRule.getDatesInRange(startDate.toDate(), startDate.add(7, 'day').toDate());
    expect(dates.length).toBe(2);
    for (const date of dates) {
      expect([0, 1]).toContain(date.getUTCDay());
    }
  });

  test('recurrences rule snapshots', () => {
    const r1 = new RecurrenceRule({
      frequency: RecurrenceFrequency.Daily,
      interval: 3,
      startDate: startDate.valueOf(),
      count: 5000
    });

    const r2 = new RecurrenceRule({
      frequency: RecurrenceFrequency.Monthly,
      startDate: startDate.valueOf(),
      until: startDate.add(1, 'year').valueOf()
    });

    const r3 = new RecurrenceRule({
      frequency: RecurrenceFrequency.Weekly,
      startDate: startDate.valueOf(),
      byDays: [RecurrenceDay.Sunday, RecurrenceDay.Wednesday, RecurrenceDay.Thursday]
    });

    expect(r1.toJsonString()).toMatchSnapshot();
    expect(r2.toJsonString()).toMatchSnapshot();
    expect(r3.toJsonString()).toMatchSnapshot();
  });
});
