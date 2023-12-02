import dayjs, { Dayjs } from 'dayjs';
import { AccentColor } from 'nightwatch-ui';

import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';

export interface MockEvent {
  id: string;
  start: Dayjs;
  end: Dayjs;
  title: string;
  color: AccentColor;
}

export interface CalculatedEvent {
  event: DisplayEvent; // The actual event object
  indentation: number; // Padding left
  width: number; // The actual width of the event on the board
  left: number; // px from left to locate the event
}

type DisplayProps = {
  displayStartDate: number;
  displayEndDate: number;
  isSplitDisplayEvent: boolean;
  isLastDisplayedEvent: boolean;
  isFirstDisplayedEvent: boolean;
  color: AccentColor;
};

// This is the data for that specific display instate, an event that splits between 2 days has 2 display Events instances
export type DisplayEvent = (DecryptedEvent | DecryptedDraft) & DisplayProps;

export type TimeUnit = dayjs.ManipulateType;
