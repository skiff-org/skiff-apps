import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ThreadNavigationIDs } from '../../components/Thread/Thread.types';

export interface SkemailSearchReducerState {
  isSearchBarOpen: boolean;
  shouldFocus: boolean;
  /** Keeps track of the active thread in the search route */
  activeThread?: ThreadNavigationIDs;
}

export const initialSkemailSearchState: SkemailSearchReducerState = {
  isSearchBarOpen: false,
  shouldFocus: false
};

/**
 * Keeps track of open and focus state for global inline search bar,
 * as well as active thread in search route;
 * search query and result state is handled via SearchProvider.
 */
export const skemailSearchReducer = createSlice({
  name: 'search',
  initialState: initialSkemailSearchState,
  reducers: {
    openSearchBar: (state) => {
      state.isSearchBarOpen = true;
    },
    closeSearchBar: (state) => {
      state.isSearchBarOpen = false;
    },
    setShouldFocus: (state, action: PayloadAction<{ shouldFocus: boolean }>) => {
      state.shouldFocus = action.payload.shouldFocus;
    },
    setActiveThread: (state, action: PayloadAction<ThreadNavigationIDs | undefined>) => {
      state.activeThread = action.payload;
    }
  }
});
