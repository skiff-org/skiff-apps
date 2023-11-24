import dayjs, { Dayjs } from 'dayjs';
import { useCallback } from 'react';

import { DAY_UNIT } from '../../constants/time.constants';

import { useGetFirstAndLastDayInView } from './useGetFirstAndLastDayInView';

/** Returns a function that gets the given date's index relative to the first day in the view */
export const useGetDayIndexInView = () => {
  const firstDayInView = useGetFirstAndLastDayInView().firstDay;

  const getDayIndex = useCallback(
    (date: Dayjs) => {
      // We need to compare both dates at the same time in the day in order to prevent rounding errors
      // So we get the start of the given date and compare it with firstDayInView
      // firstDayInView is already fetched at the start of its day
      const startOfDate = date.startOf(DAY_UNIT);
      return Math.round(dayjs.duration(startOfDate.diff(firstDayInView)).asDays());
    },
    [firstDayInView]
  );

  return getDayIndex;
};
