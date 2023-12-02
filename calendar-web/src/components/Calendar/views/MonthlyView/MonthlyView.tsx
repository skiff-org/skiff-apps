import { Dayjs } from 'dayjs';
import React, { useMemo } from 'react';
import { WEEK_UNIT } from 'skiff-front-utils';
import styled from 'styled-components';

import { DAY_UNIT, WEEKS_IN_MONTH } from '../../../../constants/time.constants';
import { DecryptedDraft } from '../../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../../storage/models/event/types';
import { useAppSelector } from '../../../../utils';
import { useGetMonthViewStartAndEndDates } from '../../../../utils/hooks/useGetMonthViewStartAndEndDates';
import { useSortMonthlyEvents } from '../../../../utils/hooks/useSortMonthlyEvents';

import WeekRow from './WeekRow';

const MonthlyViewContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: repeat(${WEEKS_IN_MONTH}, 1fr);
  user-select: none;
`;

interface MonthlyViewProps {
  allDayEventsInView: DecryptedDraft[][];
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
  virtualSelectedDate?: Dayjs;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ allDayEventsInView, timedEventsInView, virtualSelectedDate }) => {
  const getMonthViewStartAndEndDates = useGetMonthViewStartAndEndDates();
  const sortedEventsInView = useSortMonthlyEvents(allDayEventsInView, timedEventsInView, virtualSelectedDate);

  const selectedViewDate = useAppSelector((state) => state.time).selectedViewDate;
  const selectedDate = virtualSelectedDate ?? selectedViewDate;

  const monthStartDate = useMemo(
    () => getMonthViewStartAndEndDates(selectedDate).monthStartDate,
    [selectedDate, getMonthViewStartAndEndDates]
  );

  const weekRows = useMemo(
    () =>
      sortedEventsInView.map((weekEvents, weekIndex) => {
        const weekStartDate = monthStartDate.add(weekIndex, WEEK_UNIT).startOf(DAY_UNIT);
        return { weekEvents, weekStartDate };
      }),
    [monthStartDate, sortedEventsInView]
  );

  return (
    <MonthlyViewContainer>
      {weekRows.map(({ weekEvents, weekStartDate }, weekIndex) => (
        <WeekRow
          key={`week-${weekIndex}`}
          virtualSelectedDate={virtualSelectedDate}
          weekEvents={weekEvents}
          weekStartDate={weekStartDate}
        />
      ))}
    </MonthlyViewContainer>
  );
};

export default MonthlyView;
