import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { StorageTypes } from 'skiff-utils';

import { HOUR_UNIT } from '../../constants/time.constants';
import { timeReducer } from '../../redux/reducers/timeReducer';
import { calculateTrueHour, getUserGuessedTimeZone } from '../dateTimeUtils';

import { useAppSelector } from './useAppSelector';
import { useLocalSetting } from './useLocalSetting';

const useJumpToDate = () => {
  const dispatch = useDispatch();
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const timeZone = userPreferredTimezone ?? getUserGuessedTimeZone();
  const currentTime = useAppSelector((state) => state.time.currentTime);
  const currentTimeWithTrueHour = currentTime.set(HOUR_UNIT, calculateTrueHour(currentTime, timeZone));

  const jumpToToday = () => {
    dispatch(timeReducer.actions.setSelectedViewDate(currentTimeWithTrueHour));
  };

  const jumpToDate = (newSelectedDate: Date | unknown) => {
    if (!newSelectedDate) return;
    const selectedDate = dayjs(newSelectedDate as Date);
    const selectedDateWithTrueHour = selectedDate
      .tz(timeZone, true) // Add timezone to time and keep local time
      .set(HOUR_UNIT, calculateTrueHour(selectedDate, timeZone)); // Calculate true hour for timezone
    dispatch(timeReducer.actions.setSelectedViewDate(selectedDateWithTrueHour));
  };

  return { jumpToToday, jumpToDate };
};

export default useJumpToDate;
