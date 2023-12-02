import { combineReducers } from '@reduxjs/toolkit';

import { calendarReducer } from './calendarReducer';
import { eventReducer } from './eventReducer';
import { importReducer } from './importReducer';
import { mobileDrawerReducer } from './mobileDrawerReducer';
import { modalReducer } from './modalReducer';
import { sharedEventDraggingReducer } from './sharedEventDraggingReducer';
import { timeReducer } from './timeReducer';

export const reducer = combineReducers({
  time: timeReducer.reducer,
  calendar: calendarReducer.reducer,
  modal: modalReducer.reducer,
  event: eventReducer.reducer,
  mobileDrawer: mobileDrawerReducer.reducer,
  eventDragging: sharedEventDraggingReducer.reducer,
  import: importReducer.reducer
});
