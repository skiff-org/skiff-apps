import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { remove } from 'lodash';

import { DraftInfo } from '../../utils/crypto/draftDatagram';

export interface SkemailDraftsReducerState {
  drafts: Array<DraftInfo>;
  currentDraftID: string | null;
}

export const initialSkemailDraftsState: SkemailDraftsReducerState = {
  drafts: [],
  currentDraftID: null
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
      state.currentDraftID = action.payload.draftID;
    },
    clearCurrentDraftID: (state) => {
      state.currentDraftID = null;
    },
    deleteDraft: (state, action: PayloadAction<{ draftID: string }>) => {
      const { draftID } = action.payload;
      remove(state.drafts, (draft) => draft.draftID === draftID);
    }
  }
});
