import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ImportProgress {
  numEmailsImported: number;
  areImportsComplete: boolean;
  silencingSuggestionsComplete: boolean;
}

export interface ImportReducerState {
  isImportInProgress: boolean; // if there's an import in progress or not
  areSilencingSuggestionsGenerating: boolean; // if we are currently generating noisy sender suggestions
  progress?: ImportProgress;
}

export const initialSkemailImportState: ImportReducerState = {
  isImportInProgress: false,
  areSilencingSuggestionsGenerating: false,
  progress: undefined
};

export const skemailImportReducer = createSlice({
  name: 'import',
  initialState: initialSkemailImportState,
  reducers: {
    setProgress: (state, action: PayloadAction<{ progress?: ImportProgress; progressRetrievalError?: boolean }>) => {
      const { progress, progressRetrievalError } = action.payload;
      if (progress) {
        const newNumEmailsImported = progress.numEmailsImported;
        const currNumEmailsImported = state.progress?.numEmailsImported ?? 0;
        state.progress = {
          ...progress,
          numEmailsImported: newNumEmailsImported > currNumEmailsImported ? newNumEmailsImported : currNumEmailsImported
        };
      } else {
        state.progress = undefined;
      }

      if (progress && !state.isImportInProgress) {
        state.isImportInProgress = true;
      }

      if (progress?.areImportsComplete || progressRetrievalError) {
        state.isImportInProgress = false;
        state.areSilencingSuggestionsGenerating = !progress?.silencingSuggestionsComplete;
      }
    },
    startImport: (state) => {
      state.isImportInProgress = true;
      state.progress = undefined;
    },
    stopImport: (state) => {
      state.isImportInProgress = false;
    }
  }
});
