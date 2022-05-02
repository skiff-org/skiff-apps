import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SkemailMobileMenuReducerState {
  active: boolean;
}

const initialMenuState: SkemailMobileMenuReducerState = {
  active: true
};

export const skemailMobileMenuReducer = createSlice({
  name: 'menu',
  initialState: initialMenuState,
  reducers: {
    openMenu: (state, action: PayloadAction<boolean>) => {
      state.active = action.payload;
    }
  }
});
