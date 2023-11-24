import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum SettingsDrawerTypes {}
export enum DrawerTypes {
  EventInfo = 'event-info-drawer',
  CreateEvent = 'create-event-drawer',
  ParticipantActions = 'participant-actions-drawer',
  Settings = 'settings-drawer',

  // Settings sub drawers
  ChangeTimeZone = 'settings-timezone-drawer',
  ChangeStartDayOfTheWeek = 'settings-start-day-on-drawer',
  ChangeTimeFormat = 'settings-change-time-format-drawer',

  // EventInfo sub drawer
  EventInfoMoreOptions = 'event-info-more-options-drawer',
  CustomRecurrenceRule = 'custom-recurrence-rule-drawer'
}

export interface MobileDrawerReducerState {
  // There can be multiple drawers open at the same time
  openDrawers?: DrawerTypes[];
}

export const initialMobileDrawerReducerState: MobileDrawerReducerState = {
  openDrawers: undefined
};

export const mobileDrawerReducer = createSlice({
  name: 'mobileDrawer',
  initialState: initialMobileDrawerReducerState,
  reducers: {
    openDrawer: (state, action: PayloadAction<DrawerTypes>) => {
      state.openDrawers = [...(state.openDrawers ?? []), action.payload];
    },
    closeDrawer: (state, action: PayloadAction<DrawerTypes>) => {
      state.openDrawers = state.openDrawers?.filter((drawer) => drawer !== action.payload);
    }
  }
});
