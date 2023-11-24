import { combineReducers } from '@reduxjs/toolkit';

import { skemailDraftsReducer } from './draftsReducer';
import { skemailHotKeysReducer } from './hotkeysReducer';
import { skemailImportReducer } from './importReducer';
import { skemailJoyrideReducer } from './joyrideReducer';
import { skemailMailboxReducer } from './mailboxReducer';
import { skemailMobileDrawerReducer } from './mobileDrawerReducer';
import { skemailModalReducer } from './modalReducer';
import { skemailSearchReducer } from './searchReducer';
import { skemailSettingsReducer } from './settingsReducer';
import { skemailWindowReducer } from './windowReducer';

export const reducer = combineReducers({
  window: skemailWindowReducer.reducer,
  modal: skemailModalReducer.reducer,
  draft: skemailDraftsReducer.reducer,
  dialog: skemailModalReducer.reducer,
  mobileDrawer: skemailMobileDrawerReducer.reducer,
  mailbox: skemailMailboxReducer.reducer,
  hotkeys: skemailHotKeysReducer.reducer,
  settings: skemailSettingsReducer.reducer,
  import: skemailImportReducer.reducer,
  search: skemailSearchReducer.reducer,
  joyride: skemailJoyrideReducer.reducer
});
