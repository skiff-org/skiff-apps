import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EventReducerState {
  // The ID of the event shown in the side panel
  selectedEventID?: string;
  isSelectedEventLastDisplayed?: boolean;
  // list of  event that should not re-render - used in bulk updates with recurring events
  frozenEventsIDs: string[];
}

export const initialEventReducerState: EventReducerState = {
  selectedEventID: undefined,
  isSelectedEventLastDisplayed: undefined,
  frozenEventsIDs: []
};

export const eventReducer = createSlice({
  name: 'event',
  initialState: initialEventReducerState,
  reducers: {
    setSelectedEventID: (
      state,
      action: PayloadAction<{ eventID: string | undefined; isLastDisplayedEvent?: boolean }>
    ) => {
      state.selectedEventID = action.payload.eventID;
      state.isSelectedEventLastDisplayed = action.payload.isLastDisplayedEvent ?? undefined;
    },
    addFrozenEventIDs: (state, action: PayloadAction<string[]>) => {
      state.frozenEventsIDs = Array.from(new Set([...state.frozenEventsIDs, ...action.payload]));
    },
    removeFrozenEventIDs: (state, action: PayloadAction<string[]>) => {
      state.frozenEventsIDs = state.frozenEventsIDs.filter((id) => !action.payload.includes(id));
    }
  }
});
