import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SkemailMailboxReducerState {
  selectedThreadIDs: string[];
}

const initialSkemailMailboxState: SkemailMailboxReducerState = {
  selectedThreadIDs: []
};

export const skemailMailboxReducer = createSlice({
  name: 'mailbox',
  initialState: initialSkemailMailboxState,
  reducers: {
    setSelectedThreadIDs: (state, action: PayloadAction<{ selectedThreadIDs: string[] }>) => {
      const { selectedThreadIDs } = action.payload;
      state.selectedThreadIDs = selectedThreadIDs;
    }
  }
});
