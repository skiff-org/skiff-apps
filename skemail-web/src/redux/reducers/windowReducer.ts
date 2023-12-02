import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SkemailWindowReducerState {
  scrollOffset: Record<string, number>;
}

const initialSkemailWindowState: SkemailWindowReducerState = {
  scrollOffset: {}
};

export const skemailWindowReducer = createSlice({
  name: 'window',
  initialState: initialSkemailWindowState,
  reducers: {
    setScrollOffset: (state, action: PayloadAction<{ label: string; offset: number }>) => {
      state.scrollOffset[action.payload.label] = action.payload.offset;
    }
  }
});
