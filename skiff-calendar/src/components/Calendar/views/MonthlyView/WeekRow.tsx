import { Dayjs } from 'dayjs';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

import { DAYS_IN_WEEK, DAY_UNIT } from '../../../../constants/time.constants';
import { useAppSelector } from '../../../../utils';

import DayCell from './DayCell';
import { MonthlyDisplayEvent } from './MonthlyView.types';

const WeekRowContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(${DAYS_IN_WEEK}, 1fr);
`;

interface WeekRowProps {
  weekEvents: (MonthlyDisplayEvent | null)[][];
  weekStartDate: Dayjs;
  virtualSelectedDate?: Dayjs;
}

const WeekRow: FC<WeekRowProps> = ({ weekEvents, weekStartDate, virtualSelectedDate }) => {
  const frozenEventIDs = useAppSelector((state) => state.event.frozenEventsIDs);

  const dayCells = useMemo(
    () =>
      weekEvents.map((dayEvents, dayIndex) => {
        const currentDayDate = weekStartDate.add(dayIndex, DAY_UNIT);
        return {
          currentDayDate,
          dayEvents
        };
      }),
    [weekEvents, weekStartDate]
  );

  return (
    <WeekRowContainer>
      {dayCells.map(({ currentDayDate, dayEvents }, dayIndex) => (
        <DayCell
          currentDayDate={currentDayDate}
          dayEvents={dayEvents}
          dayIndex={dayIndex}
          frozenEventIDs={frozenEventIDs}
          key={`day-${dayIndex}`}
          virtualSelectedDate={virtualSelectedDate}
        />
      ))}
    </WeekRowContainer>
  );
};

export default WeekRow;
