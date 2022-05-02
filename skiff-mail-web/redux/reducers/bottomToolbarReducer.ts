import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
export interface SkemailBottomToolbarState {
  content: React.ReactNode | null;
  update: boolean;
}

const initialSkemailBottomToolbarState: SkemailBottomToolbarState = {
  content: null,
  update: false
};

export const skemailBottomToolbarReducer = createSlice({
  name: 'toolbar',
  initialState: initialSkemailBottomToolbarState,
  reducers: {
    // Set the content of the bottom toolbar
    setContent: (state, action: PayloadAction<React.ReactNode>) => {
      state.content = action.payload;
    },
    forceUpdate: (state) => {
      state.update = !state.update;
    }
  }
});
