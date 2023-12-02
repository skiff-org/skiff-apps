import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { DAY_UNIT, MONTH_UNIT, getUserGuessedTimeZone, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import { CalendarView } from '../../../generated/graphql';
import { DAYS_IN_MONTH, DAYS_IN_WEEK } from '../../constants/time.constants';
import { getWeekStartAndEndDates } from '../dateTimeUtils';

import { useAppSelector } from './useAppSelector';
import { useCurrentCalendarView } from './useCalendarView';
import { useGetMonthViewStartAndEndDates } from './useGetMonthViewStartAndEndDates';

export const useGetFirstAndLastDayInView = () => {
  // Current selected date
  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);

  const [firstDay, setFirstDay] = useState(selectedViewDate);
  const [lastDay, setLastDay] = useState(selectedViewDate);
  const [numDaysToShow, setNumDaysToShow] = useState(0);

  const [userStartOfWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const [userTimeZone] = useUserPreference(StorageTypes.TIME_ZONE);
  const timeZone = userTimeZone ?? getUserGuessedTimeZone();

  const { currCalendarView } = useCurrentCalendarView();
  const getMonthViewStartAndEndDates = useGetMonthViewStartAndEndDates();

  useEffect(() => {
    if (isMobile) {
      // On Mobile, we render 3 consecutive months at a time - last month, current month and next month
      // So, the first day is the first day displayed in the last month
      // and the last day is the last day displayed in the next month
      const dateInPrevMonth = selectedViewDate.subtract(1, MONTH_UNIT);
      setFirstDay(getMonthViewStartAndEndDates(dateInPrevMonth).monthStartDate);

      const dateInNextMonth = selectedViewDate.add(1, MONTH_UNIT);
      setLastDay(getMonthViewStartAndEndDates(dateInNextMonth).monthEndDate);
    } else {
      if (currCalendarView === CalendarView.Monthly) {
        // Month view
        // Render 1 month at a time
        // We return the first day displayed in the curr month and the last day displayed in the curr month
        const { monthStartDate, monthEndDate } = getMonthViewStartAndEndDates(selectedViewDate);
        setFirstDay(monthStartDate);
        setLastDay(monthEndDate);
      } else {
        // Week view
        // Render 1 week at a time
        // So, the first day rendered is the first day of the week
        // and the last day rendered is the last day of the week
        const { weekStartDate, weekEndDate } = getWeekStartAndEndDates(selectedViewDate, userStartOfWeek, timeZone);
        setFirstDay(weekStartDate);
        setLastDay(weekEndDate);
      }
    }
  }, [currCalendarView, selectedViewDate, getMonthViewStartAndEndDates, timeZone, userStartOfWeek]);

  useEffect(() => {
    if (isMobile) {
      // On Mobile, we fetch events for 3 consecutive months for both Month view and Week view
      // since we can open the Mini month view in Week view
      setNumDaysToShow(lastDay.diff(firstDay, DAY_UNIT) + 1);
    } else {
      if (currCalendarView === CalendarView.Monthly) {
        // Month view
        setNumDaysToShow(DAYS_IN_MONTH);
      } else {
        // Week view
        setNumDaysToShow(DAYS_IN_WEEK);
      }
    }
  }, [currCalendarView, firstDay, lastDay]);

  return { firstDay, lastDay, numDaysToShow };
};
