import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Dayjs } from 'dayjs';
import { StorageTypes } from 'skiff-utils';

import { DATE_UNIT, HOUR_UNIT, MONTH_UNIT, YEAR_UNIT } from '../../constants/time.constants';
import { calculateTrueHour, dayjs } from '../../utils/dateTimeUtils';
import { getLocalSettingCurrentValue } from '../../utils/hooks/useLocalSetting';

export interface TimeReducerState {
  currentTime: Dayjs;
  selectedViewDate: Dayjs;
}

export const getSelectedViewDateFromUrl = () => {
  const userTimeZone = getLocalSettingCurrentValue(StorageTypes.TIME_ZONE);

  const trueHour = calculateTrueHour(dayjs(), userTimeZone);

  const [, , year, month, day] = location.pathname.split('/');
  const urlSelectedTime = dayjs()
    .tz(userTimeZone)
    .set(YEAR_UNIT, +year)
    .set(MONTH_UNIT, +month - 1)
    .set(DATE_UNIT, +day)
    .set(HOUR_UNIT, trueHour);
  return !(year && month && day) || !urlSelectedTime.isValid()
    ? dayjs().tz(userTimeZone).set(HOUR_UNIT, trueHour)
    : urlSelectedTime;
};

const userTimeZone = getLocalSettingCurrentValue(StorageTypes.TIME_ZONE);

export const initialTimeReducerState: TimeReducerState = {
  selectedViewDate: getSelectedViewDateFromUrl(),
  currentTime: dayjs().tz(userTimeZone)
};

export const timeReducer = createSlice({
  name: 'time',
  initialState: initialTimeReducerState,
  reducers: {
    setSelectedViewDate: (state, action: PayloadAction<Dayjs>) => {
      state.selectedViewDate = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<Dayjs>) => {
      state.currentTime = action.payload;
    }
  }
});
