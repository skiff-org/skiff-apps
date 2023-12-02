import { Dayjs } from 'dayjs';

export enum CalendarDateFieldType {
  Start,
  End,
  None
}

export interface DateTime {
  startDateTime: Dayjs;
  endDateTime: Dayjs;
}
