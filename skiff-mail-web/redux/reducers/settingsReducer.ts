import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SETTINGS_QUERY_PARAM, SettingValue, TabPage, TABS_QUERY_PARAM } from 'skiff-front-utils';

import { getSettingsParams } from '../../utils/locationUtils';

export interface SettingsReducerState {
  settingTab?: TabPage;
  setting?: SettingValue;
  fullsize?: boolean;
}

const { [SETTINGS_QUERY_PARAM]: setting, [TABS_QUERY_PARAM]: settingTab, fullsize } = getSettingsParams();
const initialSettingsState: SettingsReducerState = {
  settingTab,
  setting,
  fullsize
};

export const skemailSettingsReducer = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    setSettings: (state, action: PayloadAction<SettingsReducerState>) => {
      state.settingTab = action.payload.settingTab;
      state.setting = action.payload.setting;
      state.fullsize = action.payload.fullsize;
    }
  }
});
