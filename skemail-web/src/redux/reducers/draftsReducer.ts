import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import remove from 'lodash/remove';
import { DraftInfo } from 'skiff-front-graphql';

export interface SkemailDraftsReducerState {
  drafts: Array<DraftInfo>;
  currentDraftID: string | null;
  currentDraftIDToDelete: string | null;
}

export const initialSkemailDraftsState: SkemailDraftsReducerState = {
  drafts: [],
  currentDraftID: null,
  currentDraftIDToDelete: null
};

export const skemailDraftsReducer = createSlice({
  name: 'drafts',
  initialState: initialSkemailDraftsState,
  reducers: {
    setDrafts: (state, action: PayloadAction<{ drafts: Array<DraftInfo> }>) => {
      const { drafts } = action.payload;
      state.drafts = drafts;
    },
    saveDraft: (state, action: PayloadAction<{ draftInfo: DraftInfo }>) => {
      const { draftInfo } = action.payload;
      const existingDraftIndex = state.drafts.findIndex((draft) => draft.draftID === draftInfo.draftID);
      if (existingDraftIndex >= 0) {
        state.drafts[existingDraftIndex] = draftInfo;
      } else {
        state.drafts.push(draftInfo);
      }
    },
    setCurrentDraftID: (state, action: PayloadAction<{ draftID: string }>) => {
      // Before selecting a draft, reset the currentDraftIDToDelete
      // If we are opening up a new draft, this means there is no current draft we are deleting
      if (state.currentDraftIDToDelete) {
        state.currentDraftIDToDelete = null;
      }
      state.currentDraftID = action.payload.draftID;
    },
    clearCurrentDraftID: (state) => {
      state.currentDraftID = null;
    },
    deleteDraft: (state, action: PayloadAction<{ draftID: string }>) => {
      const { draftID } = action.payload;
      remove(state.drafts, (draft) => draft.draftID === draftID);
    },
    setCurrentDraftIDToDelete: (state, action: PayloadAction<{ draftID: string }>) => {
      state.currentDraftIDToDelete = action.payload.draftID;
    },
    clearCurrentDraftIDToDelete: (state) => {
      state.currentDraftIDToDelete = null;
    }
  }
});
