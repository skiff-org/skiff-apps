import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CalendarView } from 'skiff-graphql';

export type CalendarRef = React.RefObject<HTMLDivElement> | null;

export interface CalendarState {
  calendarRef: CalendarRef;
  requestHCaptchaTokenRef: (() => Promise<string>) | null;
  calendarView?: CalendarView;
}

export const initialCalendarState: CalendarState = {
  calendarRef: null,
  requestHCaptchaTokenRef: null,
  calendarView: undefined
};

export const calendarReducer = createSlice({
  name: 'calendar',
  initialState: initialCalendarState,
  reducers: {
    setCalendarRef: (state, action: PayloadAction<CalendarRef>) => ({
      ...state,
      calendarRef: action.payload
    }),
    setRequestHCaptchaTokenRef: (state, action: PayloadAction<() => Promise<string>>) => ({
      ...state,
      requestHCaptchaTokenRef: action.payload
    }),
    setCalendarView: (state, action: PayloadAction<CalendarView>) => ({
      ...state,
      calendarView: action.payload
    })
  }
});
