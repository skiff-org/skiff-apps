import { Dayjs } from 'dayjs';
import range from 'lodash/range';
import { colors, Typography, TypographySize, TypographyWeight, ACCENT_COLOR_VALUES } from 'nightwatch-ui';
import React from 'react';
import { isSameDate, useUserPreference, DayFormats, DAY_PICKER_SIZE } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { MOBILE_WEEK_VIEW_HEADER_VERTICAL_PADDING } from '../../../constants/calendar.constants';
import { DAY_UNIT, DAYS_IN_WEEK, WEEK_UNIT } from '../../../constants/time.constants';
import { dateToFormatString } from '../../../utils/dateTimeUtils';
import { useAppSelector } from '../../../utils/hooks/useAppSelector';
import { useCurrentCalendarView } from '../../../utils/hooks/useCalendarView';
import useJumpToDate from '../../../utils/hooks/useJumpToDate';
import { indexToDayjs } from '../../../utils/mobileDayViewUtils';
import ChronometricVirtualizedDisplay from '../views/ChronometricVirtualizedDisplay';

// Week view with collapsed mini month header height
const WEEK_VIEW_HEADER_HEIGHT = 68;

const Wrapper = styled.div<{ $view: CalendarView }>`
  height: ${({ $view }) => ($view === CalendarView.Weekly ? `${WEEK_VIEW_HEADER_HEIGHT}px` : 'fit-content')};
  padding-bottom: ${MOBILE_WEEK_VIEW_HEADER_VERTICAL_PADDING}px;
  box-sizing: border-box;
`;

const WeekHeaderContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${DAYS_IN_WEEK}, 1fr);
`;

const WeekDayColumn = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const WeekDayDate = styled.div<{ $isToday: boolean; $isSelectedDay: boolean }>`
  border-radius: 8px;

  ${({ $isSelectedDay, $isToday }) => {
    if (!$isSelectedDay && !$isToday) return undefined;
    const bgColor = $isToday ? `rgb(${colors['--orange-500']})` : ACCENT_COLOR_VALUES.orange[1];
    return `background: ${bgColor};`;
  }}
`;

const Label = styled(Typography)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${DAY_PICKER_SIZE}px;
  height: ${DAY_PICKER_SIZE}px;
  margin: auto;
`;

interface WeekHeaderProps {
  viewRefs: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>;
  scrollRef: React.MutableRefObject<number>;
  monthIndex: number;
  weekIndex: number;
}

const WeekHeader: React.FC<WeekHeaderProps> = ({ viewRefs, scrollRef, monthIndex, weekIndex }) => {
  const { selectedViewDate, currentTime } = useAppSelector((state) => state.time);

  const [userStartOfTheWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const { currCalendarView } = useCurrentCalendarView();
  const { jumpToDate } = useJumpToDate();

  const renderWeekDayLabel = (date: Dayjs) => (
    <Label color='disabled' selectable={false} size={TypographySize.SMALL}>
      {dateToFormatString(date, DayFormats.ExtraShortName)[0]}
    </Label>
  );

  // The month header is just the week day labels
  const renderMonthHeader = () => {
    const firstWeekDayDate = indexToDayjs(monthIndex, WEEK_UNIT, undefined, userStartOfTheWeek);
    return (
      <WeekHeaderContainer>
        {range(DAYS_IN_WEEK).map((dayIndex) => {
          const weekDayDate = firstWeekDayDate.add(dayIndex, DAY_UNIT);
          return renderWeekDayLabel(weekDayDate);
        })}
      </WeekHeaderContainer>
    );
  };

  const renderWeekHeader = (newIndex: number) => {
    const firstWeekDayDate = indexToDayjs(newIndex, WEEK_UNIT, undefined, userStartOfTheWeek);
    return (
      <WeekHeaderContainer>
        {range(DAYS_IN_WEEK).map((dayIndex) => {
          const weekDayDate = firstWeekDayDate.add(dayIndex, DAY_UNIT);

          const isSelectedDay = isSameDate(selectedViewDate, weekDayDate);
          const isToday = isSameDate(currentTime, weekDayDate);

          const weekDateTextColor = isToday ? 'white' : isSelectedDay ? 'link' : 'primary';
          const weekDateTextWeight = isSelectedDay || isToday ? TypographyWeight.BOLD : TypographyWeight.REGULAR;

          return (
            <WeekDayColumn key={dayIndex}>
              {renderWeekDayLabel(weekDayDate)}
              <WeekDayDate
                $isSelectedDay={isSelectedDay}
                $isToday={isToday}
                onClick={() => {
                  const scrollTop = viewRefs.current[1]?.current?.scrollTop;
                  if (scrollTop) scrollRef.current = scrollTop;
                  jumpToDate(weekDayDate);
                }}
              >
                <Label color={weekDateTextColor} size={TypographySize.SMALL} weight={weekDateTextWeight}>
                  {dateToFormatString(weekDayDate, DayFormats.ShortDate)}
                </Label>
              </WeekDayDate>
            </WeekDayColumn>
          );
        })}
      </WeekHeaderContainer>
    );
  };

  return (
    <Wrapper $view={currCalendarView}>
      {currCalendarView === CalendarView.Monthly && renderMonthHeader()}
      {currCalendarView === CalendarView.Weekly && (
        <ChronometricVirtualizedDisplay
          index={weekIndex}
          itemWidth={window.innerWidth}
          onIndexChange={(newIndex) => {
            // Swiping left / right updates the selected day to the first day in the next / previous week
            jumpToDate(indexToDayjs(newIndex, WEEK_UNIT, undefined, userStartOfTheWeek));
          }}
          slideRenderer={(newIndex, disableRender) => !disableRender && renderWeekHeader(newIndex)}
        />
      )}
    </Wrapper>
  );
};

export default WeekHeader;
