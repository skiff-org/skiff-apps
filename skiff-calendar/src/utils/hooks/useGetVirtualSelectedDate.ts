import { useCallback, useMemo } from 'react';

import { useAppSelector } from '..';
import { MONTH_UNIT } from '../../constants/time.constants';
import { dayjsToIndex } from '../mobileDayViewUtils';

export const useGetVirtualSelectedDate = () => {
  // Actual selected date in the current month
  const actualSelectedDate = useAppSelector((state) => state.time.selectedViewDate);

  // Current month index
  const monthIndex = useMemo(() => dayjsToIndex(actualSelectedDate, MONTH_UNIT), [actualSelectedDate]);

  // Returns the selected day for a month given a virtual month index
  const getVirtualSelectedDate = useCallback(
    (virtualIndex: number) => {
      // Curr month
      // We return nothing for the curr month bec the curr month's selected day is already the actual selected day
      if (virtualIndex === monthIndex) return;

      // Prev month
      if (virtualIndex < monthIndex) {
        // We return a virtual selected date for the prev month
        const prevMonthVirtualSelectedDate = actualSelectedDate.subtract(1, MONTH_UNIT).startOf(MONTH_UNIT);
        return prevMonthVirtualSelectedDate;
      }

      // Next month
      // We return a virtual selected date for the next month
      const nextMonthVirtualSelectedDate = actualSelectedDate.add(1, MONTH_UNIT).startOf(MONTH_UNIT);
      return nextMonthVirtualSelectedDate;
    },
    [actualSelectedDate, monthIndex]
  );

  return getVirtualSelectedDate;
};
