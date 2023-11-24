import dayjs, { Dayjs } from 'dayjs';
import { useCallback } from 'react';
import { DAY_UNIT, MONTH_UNIT, WEEK_UNIT, getUserGuessedTimeZone, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import { WEEKS_IN_MONTH } from '../../constants/time.constants';
import { getWeekStartAndEndDates } from '../dateTimeUtils';

export const useGetMonthViewStartAndEndDates = () => {
  const [userStartOfWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const [userTimeZone] = useUserPreference(StorageTypes.TIME_ZONE);
  const timeZone = userTimeZone ?? getUserGuessedTimeZone();

  /** Given a date, returns the first and last days displayed in its corresponding month */
  const getMonthViewStartAndEndDates = useCallback(
    (date: Dayjs) => {
      const firstDayOfMonth = date.startOf(MONTH_UNIT);
      const monthStartDate = getWeekStartAndEndDates(firstDayOfMonth, userStartOfWeek, timeZone).weekStartDate.startOf(
        DAY_UNIT
      );

      const lastDayOfMonth = date.endOf(MONTH_UNIT);
      let monthEndDate = getWeekStartAndEndDates(lastDayOfMonth, userStartOfWeek, timeZone).weekEndDate.endOf(DAY_UNIT);

      const numOfWeeks = Math.round(dayjs.duration(monthEndDate.diff(monthStartDate)).asWeeks());
      if (numOfWeeks < WEEKS_IN_MONTH) {
        // Add a week for every week rendered that is outside the curr month
        monthEndDate = monthEndDate.add(WEEKS_IN_MONTH - numOfWeeks, WEEK_UNIT);
      }

      return { monthStartDate, monthEndDate };
    },
    [userStartOfWeek, timeZone]
  );

  return getMonthViewStartAndEndDates;
};
