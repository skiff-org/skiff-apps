import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MailboxEmailInfo } from '../../models/email';

/**
 * Contains all the states for mobile drawers (show, setShow and others)
 */
export interface SkemailMobileDrawerReducerState {
  showFilterDrawer: boolean;
  showSettingsDrawer: boolean;
  showMoreThreadOptionsDrawer: boolean;
  showMoveThreadDrawer: boolean;
  showReportThreadBlockDrawer: boolean;
  multipleItemSelector: boolean; //Is multiple item selector active
  currentEmail: MailboxEmailInfo | null; // The current mail selected for more thread options drawer
  reportThreadBlockOptions: ReportOptions;
}

const initialPageState: SkemailMobileDrawerReducerState = {
  showFilterDrawer: false,
  showSettingsDrawer: false,
  showMoreThreadOptionsDrawer: false,
  showMoveThreadDrawer: false,
  showReportThreadBlockDrawer: false,
  multipleItemSelector: false,
  currentEmail: null,
  reportThreadBlockOptions: []
};

export const skemailMobileDrawerReducer = createSlice({
  name: 'mobileDrawer',
  initialState: initialPageState,
  reducers: {
    setShowFilterDrawer: (state, action: PayloadAction<boolean>) => {
      state.showFilterDrawer = action.payload;
    },
    setShowSettingsDrawer: (state, action: PayloadAction<boolean>) => {
      state.showSettingsDrawer = action.payload;
    },
    setMultipleItemSelector: (state, action: PayloadAction<boolean>) => {
      state.multipleItemSelector = action.payload;
    },
    setShowMoreThreadOptionsDrawer: (state, action: PayloadAction<boolean>) => {
      state.showMoreThreadOptionsDrawer = action.payload;
    },
    setShowMoveThreadDrawer: (state, action: PayloadAction<boolean>) => {
      state.showMoveThreadDrawer = action.payload;
    },
    setCurrentEmail: (state, action: PayloadAction<MailboxEmailInfo | null>) => {
      state.currentEmail = action.payload;
    },
    setShowReportThreadBlockDrawer: (state, action: PayloadAction<boolean>) => {
      state.showReportThreadBlockDrawer = action.payload;
    },
    setReportThreadBlockOptions: (state, action: PayloadAction<ReportOptions>) => {
      state.reportThreadBlockOptions = action.payload;
    }
  }
});

type ReportOptions = {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}[];
