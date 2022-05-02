import { combineReducers } from '@reduxjs/toolkit';

import { skemailBottomToolbarReducer } from './bottomToolbarReducer';
import { skemailDraftsReducer } from './draftsReducer';
import { skemailMailboxReducer } from './mailboxReducer';
import { skemailMobileMenuReducer } from './mobileMenuReducer';
import { skemailMobileDrawerReducer } from './mobileDrawerReducer';
import { skemailModalReducer } from './modalReducer';
import { skemailWindowReducer } from './windowReducer';

export const reducer = combineReducers({
  window: skemailWindowReducer.reducer,
  toolbar: skemailBottomToolbarReducer.reducer,
  modal: skemailModalReducer.reducer,
  draft: skemailDraftsReducer.reducer,
  menu: skemailMobileMenuReducer.reducer,
  dialog: skemailModalReducer.reducer,
  mobileDrawer: skemailMobileDrawerReducer.reducer,
  mailbox: skemailMailboxReducer.reducer
});
