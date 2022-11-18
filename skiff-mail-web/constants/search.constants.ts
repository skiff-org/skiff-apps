export const MAX_DATE_WIDTH = '53px'; // Max possible width of the date text
export const DATE_TEXT_RIGHT = '12px';
export const UNREAD_INDICATOR_DIAMETER = '8px';
export const GAP_BETWEEN_UNREAD_INDICATOR_AND_DATE_TEXT = '12px';
export const DATE_FILTERS = [
  { subject: 'Today', start: 1, end: 0 },
  { subject: 'Yesterday', start: 2, end: 1 },
  { subject: 'Last 7 days', start: 7, end: 0 },
  { subject: 'Last 30 days', start: 30, end: 0 },
  { subject: 'Last year', start: 365, end: 0 }
];
