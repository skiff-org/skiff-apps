import { createSlice, PayloadAction } from '@reduxjs/toolkit';

//Calendar
export enum ImportType {
  Google,
  ICS
}

//Calendar
export interface ImportState {
  activeImport: ImportType[];
}

export const initialImportState: ImportState = {
  activeImport: []
};

export const importReducer = createSlice({
  name: 'import',
  initialState: initialImportState,
  reducers: {
    addActiveImport: ({ activeImport }, action: PayloadAction<ImportType>) => ({
      activeImport: [...new Set([action.payload, ...activeImport])]
    }),
    removeActiveImport: ({ activeImport }, action: PayloadAction<ImportType>) => ({
      activeImport: activeImport.filter((type) => type !== action.payload)
    })
  }
});
