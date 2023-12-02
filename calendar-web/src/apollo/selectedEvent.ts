import { makeVar, useReactiveVar } from '@apollo/client';

import {
  DraftPlainContent,
  DraftDecryptedContent,
  DraftDecryptedPreferences,
  DecryptedDraft
} from '../storage/models/draft/types';
import { EventAttendee, DecryptedEvent } from '../storage/models/event/types';

// Diff states of a selected event
export enum EventDiffState {
  // Event is brand new and has not been saved
  New = 'NEW',
  // All event changes are saved in DB
  Settled = 'SETTLED',
  // Event has unsaved changes
  PendingChanges = 'PENDING_CHANGES'
}

// Diff value for a field
export type FieldDiff<T> =
  | {
      new: T;
      old: T | undefined;
    }
  | undefined;

// Diff map for changes between the draft and the event
export type EventDiffMap = {
  plainContent: { [key in keyof DraftPlainContent]?: FieldDiff<DraftPlainContent[key]> };
  // Omitting attendees to handle them separately
  decryptedContent: {
    [key in keyof Omit<DraftDecryptedContent, 'attendees'>]?: FieldDiff<Omit<DraftDecryptedContent, 'attendees'>[key]>;
  };
  decryptedPreferences: { [key in keyof DraftDecryptedPreferences]?: FieldDiff<DraftDecryptedPreferences[key]> };
};

// Props to omit from the attendee diff map
export const attendeeOmitProps = ['id', 'type', 'deleted', 'updatedAt', 'publicKey'] as const;
type AttendeeOmitProps = typeof attendeeOmitProps[number];

// Same as EventDiffMap but for attendees
export type AttendeeDiffMap = {
  [key in keyof Omit<EventAttendee, AttendeeOmitProps>]?: FieldDiff<Omit<EventAttendee, AttendeeOmitProps>[key]>;
} & {
  id: string;
};

// Complete diff values for changes between the draft and the event
export interface EventDraftDiff {
  diffState: EventDiffState;
  diff: EventDiffMap;
  attendeesDiff: {
    new: EventAttendee[];
    deleted: EventAttendee[];
    updated: AttendeeDiffMap[];
  };
}
interface SelectedEventState {
  selectedEvent: DecryptedEvent | null;
  parentRecurringEvent: DecryptedEvent | null;
  selectedDraft: DecryptedDraft | null;
  diffMap: EventDraftDiff | undefined;
}

export const selectedEventState = makeVar<SelectedEventState>({
  selectedEvent: null,
  parentRecurringEvent: null,
  selectedDraft: null,
  diffMap: undefined
});

export const getSelectedEventState = () => selectedEventState();

export const setSelectedEventState = (state: SelectedEventState) => {
  selectedEventState(state);
};

/**
 * If the entire selectedEvent / selectedDraft / diffMap is not needed
 * use useSelectedEventDiffState instead,
 * This hook will call a lot more renders than useSelectedEventDiffState
 */
export const useSelectedEventState = () => {
  const state = useReactiveVar(selectedEventState);
  return state;
};

export const selectedEventDiffState = makeVar<EventDiffState>(EventDiffState.Settled);

export const getSelectedEventDiffState = () => selectedEventDiffState();

export const setSelectedEventDiffState = (state: EventDiffState) => {
  selectedEventDiffState(state);
};

/**
 * Returns the diff state of the draft from the selected event
 */
export const useSelectedEventDiffState = () => {
  const state = useReactiveVar(selectedEventDiffState);
  return state;
};
