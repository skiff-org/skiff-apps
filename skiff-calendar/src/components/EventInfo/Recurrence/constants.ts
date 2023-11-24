import { RecurrenceDay, RecurrenceFrequency } from 'skiff-graphql';

export const REPEAT_OPTIONS = [
  {
    unitLabel: 'day',
    patternLabel: 'Daily',
    frequency: RecurrenceFrequency.Daily
  },
  {
    unitLabel: 'week',
    patternLabel: 'Weekly',
    frequency: RecurrenceFrequency.Weekly
  },
  {
    unitLabel: 'month',
    patternLabel: 'Monthly',
    frequency: RecurrenceFrequency.Monthly
  },
  {
    unitLabel: 'year',
    patternLabel: 'Yearly',
    frequency: RecurrenceFrequency.Yearly
  }
];

export const RECURRENCE_DAYS_ORDERED = [
  RecurrenceDay.Sunday,
  RecurrenceDay.Monday,
  RecurrenceDay.Tuesday,
  RecurrenceDay.Wednesday,
  RecurrenceDay.Thursday,
  RecurrenceDay.Friday,
  RecurrenceDay.Saturday
];

export const DOES_NOT_REPEAT_LABEL = 'Does not repeat';
