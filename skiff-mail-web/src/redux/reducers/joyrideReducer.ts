import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum JoyrideStepID {
  FILTER_BY_ALIAS = 'FILTER_BY_ALIAS',
  MANAGE_ALIASES = 'MANAGE_ALIASES'
}

export interface SkemailJoyrideReducerState {
  activeJoyrideStep?: JoyrideStepID;
}

const initialJoyrideReducerState: SkemailJoyrideReducerState = {};

export const skemailJoyrideReducer = createSlice({
  name: 'joyride',
  initialState: initialJoyrideReducerState,
  reducers: {
    setJoyrideStep: (state, action: PayloadAction<JoyrideStepID | undefined>) => {
      state.activeJoyrideStep = action.payload;
    }
  }
});
