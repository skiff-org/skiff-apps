import React, { useCallback, useMemo } from 'react';

import { DAYS_IN_MONTH, MONTH_UNIT } from '../../../../constants/time.constants';
import { DecryptedDraft } from '../../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../../storage/models/event/types';
import { useAppSelector } from '../../../../utils/hooks/useAppSelector';
import { useGetDayIndexInView } from '../../../../utils/hooks/useGetDayIndexInView';
import { useGetMonthViewStartAndEndDates } from '../../../../utils/hooks/useGetMonthViewStartAndEndDates';
import { useGetVirtualSelectedDate } from '../../../../utils/hooks/useGetVirtualSelectedDate';
import useJumpToDate from '../../../../utils/hooks/useJumpToDate';
import { dayjsToIndex } from '../../../../utils/mobileDayViewUtils';
import ChronometricVirtualizedDisplay from '../ChronometricVirtualizedDisplay';

import MonthlyView from './MonthlyView';

interface MobileMonthlyViewProps {
  allDayEventsInView: DecryptedDraft[][];
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
}

/**
 * On Mobile, we always render 3 consecutive months; the previous month, the current month and the next month,
 * in order to make slide navigation smoother between months
 */
const MobileMonthlyView = ({ allDayEventsInView, timedEventsInView }: MobileMonthlyViewProps) => {
  const { jumpToDate } = useJumpToDate();
  const getDayIndexInView = useGetDayIndexInView();
  const getMonthViewStartAndEndDates = useGetMonthViewStartAndEndDates();
  const getVirtualSelectedDate = useGetVirtualSelectedDate();

  // Actual selected date in the current month
  const actualSelectedDate = useAppSelector((state) => state.time.selectedViewDate);

  // Current month index
  const monthIndex = useMemo(() => dayjsToIndex(actualSelectedDate, MONTH_UNIT), [actualSelectedDate]);

  const slideRenderer = useCallback(
    (virtualIndex: number, disableRender: boolean) => {
      if (disableRender) return;
      // Since month rendering is dependent on the selected view date
      // and since the selected view date is not updated until we are done swiping,
      // we get virtual selected dates for the previous and next months which are then passed to the date picker
      // in order to correctly render them when swiping starts
      const virtualSelectedDate = getVirtualSelectedDate(virtualIndex);
      const selectedDate = virtualSelectedDate ?? actualSelectedDate;

      // Displayed start date for the current month slide
      const monthStartDate = getMonthViewStartAndEndDates(selectedDate).monthStartDate;

      // Since allDayEventsInView has events that span the 3 consecutive months rendered by the slider,
      // we want to get the all-day events for the current month only
      const startIndex = getDayIndexInView(monthStartDate);
      // We add the fixed number of days in each month to the start index to get the end index
      const endIndex = startIndex + DAYS_IN_MONTH;
      // Slice the all-day events array to get the all-day events for the current month only
      const allDayEventsForMonth = allDayEventsInView.slice(startIndex, endIndex);

      return (
        <MonthlyView
          allDayEventsInView={allDayEventsForMonth}
          timedEventsInView={timedEventsInView}
          virtualSelectedDate={virtualSelectedDate}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allDayEventsInView, timedEventsInView]
  );

  return (
    <ChronometricVirtualizedDisplay
      index={monthIndex}
      itemWidth={window.innerWidth}
      onIndexChange={(newIndex) => {
        // Swiping left / right updates the selected day to first day in the next / previous month
        jumpToDate(getVirtualSelectedDate(newIndex));
      }}
      slideRenderer={slideRenderer}
    />
  );
};

export default MobileMonthlyView;
