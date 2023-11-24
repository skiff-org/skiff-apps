import { CalendarView } from 'skiff-graphql';

// NB: it's important for hot key actions to have unique values
// in case a single action has hot keys that span two or more single-key, single-combination and multi-combination hot keys
// considering that the handler wrapper handles single-key, single-combination and multi-combination hot keys differently
export enum SingleKeyActions {
  DELETE_EVENT = 'SINGLE_KEY_DELETE_EVENT',
  CHANGE_CALENDAR_VIEW = 'SINGLE_KEY_CHANGE_CALENDAR_VIEW'
}

export const CALENDAR_VIEW_SHORTCUT: Record<CalendarView, string> = {
  WEEKLY: 'w',
  MONTHLY: 'm'
};

/** Key map for sequences made up of a single key */
export const SINGLE_KEY_MAP = {
  [SingleKeyActions.DELETE_EVENT]: ['del', 'backspace'],
  [SingleKeyActions.CHANGE_CALENDAR_VIEW]: [
    CALENDAR_VIEW_SHORTCUT[CalendarView.Weekly],
    CALENDAR_VIEW_SHORTCUT[CalendarView.Monthly]
  ]
};
