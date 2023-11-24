import { FilledVariant, Icon, IconText } from 'nightwatch-ui';
import React, { FC } from 'react';
import { CalendarView } from 'skiff-graphql';
import styled from 'styled-components';

import { MONTH_UNIT, WEEK_UNIT } from '../../constants/time.constants';
import { timeReducer } from '../../redux/reducers/timeReducer';
import { useAppDispatch, useAppSelector } from '../../utils';
import { useCurrentCalendarView } from '../../utils/hooks/useCalendarView';

const PAGINATE_VALUE = 1;

const Arrows = styled.div`
  display: flex;
  gap: 6px;
`;

enum PaginationDirection {
  Forward,
  Backward
}

export const CalendarController: FC = () => {
  const { selectedViewDate } = useAppSelector((state) => state.time);
  const dispatch = useAppDispatch();
  const { currCalendarView } = useCurrentCalendarView();
  const paginateUnit = currCalendarView === CalendarView.Weekly ? WEEK_UNIT : MONTH_UNIT;

  const paginate = (direction: PaginationDirection) => {
    const newSelectedDate =
      direction === PaginationDirection.Forward
        ? selectedViewDate.add(PAGINATE_VALUE, paginateUnit)
        : selectedViewDate.subtract(PAGINATE_VALUE, paginateUnit);
    dispatch(timeReducer.actions.setSelectedViewDate(newSelectedDate));
  };

  return (
    <Arrows>
      <IconText
        onClick={() => paginate(PaginationDirection.Backward)}
        startIcon={Icon.ChevronLeft}
        variant={FilledVariant.FILLED}
      />
      <IconText
        onClick={() => paginate(PaginationDirection.Forward)}
        startIcon={Icon.ChevronRight}
        variant={FilledVariant.FILLED}
      />
    </Arrows>
  );
};
