import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface HotKeysReducerState {
  activeThreadLabelsDropdownOpen: boolean;
  mailboxLabelsDropdownOpen: boolean;
}

const initialHotKeysState: HotKeysReducerState = {
  activeThreadLabelsDropdownOpen: false,
  mailboxLabelsDropdownOpen: false
};

export const skemailHotKeysReducer = createSlice({
  name: 'hotkeys',
  initialState: initialHotKeysState,
  reducers: {
    setActiveThreadLabelMenuOpen: (state, action: PayloadAction<boolean | undefined>) => {
      state.activeThreadLabelsDropdownOpen = action.payload ?? !state.activeThreadLabelsDropdownOpen;
    },
    setMailboxLabelsDropdownOpen: (state, action: PayloadAction<boolean | undefined>) => {
      state.mailboxLabelsDropdownOpen = action.payload ?? !state.mailboxLabelsDropdownOpen;
    }
  }
});
