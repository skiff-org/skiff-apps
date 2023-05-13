import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserLabelVariant } from 'skiff-graphql';

import { MailboxEmailInfo } from '../../models/email';

interface ThreadOptionsDrawerPayload {
  open: boolean;
  /**
   * True if we want to render options specific to an email.
   * False if the options apply to the entire thread
   */
  emailSpecific: boolean;
}
/**
 * Contains all the states for mobile drawers (show, setShow and others)
 */
export interface SkemailMobileDrawerReducerState {
  showFilterDrawer: boolean;
  showMoreThreadOptionsDrawer: ThreadOptionsDrawerPayload;
  showMoveThreadDrawer: boolean;
  showReportThreadBlockDrawer: boolean;
  showApplyLabelDrawer: UserLabelVariant | null;
  showMailboxMoreOptionsDrawer: boolean;
  showMailboxSelectDrawer: boolean;
  showReplyDrawer: boolean;
  showComposeMoreOptionsDrawer: boolean;
  showAliasDrawer: boolean;
  multipleItemSelector: boolean; //Is multiple item selector active
  currentEmail: MailboxEmailInfo | null; // The current mail selected for more thread options drawer
  reportThreadBlockOptions: ReportOptions;
}

export const initialPageState: SkemailMobileDrawerReducerState = {
  showFilterDrawer: false,
  showMoreThreadOptionsDrawer: {
    open: false,
    emailSpecific: false
  },
  showMoveThreadDrawer: false,
  showReplyDrawer: false,
  showReportThreadBlockDrawer: false,
  showApplyLabelDrawer: null,
  multipleItemSelector: false,
  showMailboxMoreOptionsDrawer: false,
  showMailboxSelectDrawer: false,
  showComposeMoreOptionsDrawer: false,
  showAliasDrawer: false,
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
    setMultipleItemSelector: (state, action: PayloadAction<boolean>) => {
      state.multipleItemSelector = action.payload;
    },
    setShowMoreThreadOptionsDrawer: (state, action: PayloadAction<ThreadOptionsDrawerPayload>) => {
      state.showMoreThreadOptionsDrawer = action.payload;
    },
    setShowReplyDrawer: (state, action: PayloadAction<boolean>) => {
      state.showReplyDrawer = action.payload;
    },
    setShowMoveThreadDrawer: (state, action: PayloadAction<boolean>) => {
      state.showMoveThreadDrawer = action.payload;
    },
    setShowApplyLabelDrawer: (state, action: PayloadAction<UserLabelVariant | null>) => {
      state.showApplyLabelDrawer = action.payload;
    },
    setCurrentEmail: (state, action: PayloadAction<MailboxEmailInfo | null>) => {
      state.currentEmail = action.payload;
    },
    setShowReportThreadBlockDrawer: (state, action: PayloadAction<boolean>) => {
      state.showReportThreadBlockDrawer = action.payload;
    },
    setReportThreadBlockOptions: (state, action: PayloadAction<ReportOptions>) => {
      state.reportThreadBlockOptions = action.payload;
    },
    setShowMailboxMoreOptionsDrawer: (state, action: PayloadAction<boolean>) => {
      state.showMailboxMoreOptionsDrawer = action.payload;
    },
    setShowMailboxSelectDrawer: (state, action: PayloadAction<boolean>) => {
      state.showMailboxSelectDrawer = action.payload;
    },
    setShowComposeMoreOptionsDrawer: (state, action: PayloadAction<boolean>) => {
      state.showComposeMoreOptionsDrawer = action.payload;
    },
    setShowAliasDrawer: (state, action: PayloadAction<boolean>) => {
      state.showAliasDrawer = action.payload;
    }
  }
});

export type ReportOptions = {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}[];
