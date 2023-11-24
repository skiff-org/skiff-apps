import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Dayjs } from 'dayjs';
import { getThemedColor, TEXT_COLOR_VALUES, ThemeMode, AccentColor } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { DAY_UNIT, MONTH_UNIT } from '../../../constants';
import { dayjs, isSameDate } from '../../../utils';
import EventDot, { EVENT_DOT_CLASS_NAME, EVENT_DOT_CONTAINER_HEIGHT } from '../../EventDot';
import { DATE_PICKER_DOT_SIZE, MAX_NUM_OF_EVENTS_DISPLAYED } from '../DatePicker.constants';
import { DAY_PICKER_LABEL_CSS, DAY_TYPE_CSS, WEEK_DAY_CSS } from '../DatePicker.styles';
import { DatePickerEvent } from '../DatePicker.types';

import { DatePickerDayProps } from './DatePickerDay.types';

const DayContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CustomPickersDay = styled(PickersDay)<{
  $highlightCurrentWeek: boolean;
  $isInCurrWeek: boolean;
  $isToday: boolean;
  $isWeekStartDate: boolean;
  $isWeekEndDate: boolean;
  $forceTheme?: ThemeMode;
}>`
  &.MuiPickersDay-root {
    color: ${({ $forceTheme }) => getThemedColor(TEXT_COLOR_VALUES.primary, $forceTheme)};

    &.MuiPickersDay-today {
      border: none;
    }

    &.MuiPickersDay-dayWithMargin {
      ${DAY_PICKER_LABEL_CSS}
      ${({ $highlightCurrentWeek, $isInCurrWeek }) => $highlightCurrentWeek && $isInCurrWeek && WEEK_DAY_CSS}
      ${DAY_TYPE_CSS}
    }
  }
`;

const EventsDotsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${EVENT_DOT_CONTAINER_HEIGHT}px;
`;

const StyledEventDot = styled(EventDot)<{ $isFirstDot: boolean; $bgColor?: string }>`
  width: ${DATE_PICKER_DOT_SIZE + 2}px;
  height: ${DATE_PICKER_DOT_SIZE + 2}px;
  border-radius: 50%;
  background: ${({ $bgColor }) => $bgColor ?? 'white'};
  ${({ $isFirstDot }) => !$isFirstDot && 'margin-left: -3px;'}

  .${EVENT_DOT_CLASS_NAME} {
    width: ${DATE_PICKER_DOT_SIZE}px;
    height: ${DATE_PICKER_DOT_SIZE}px;
  }
`;

const DatePickerDay: React.FC<(PickersDayProps<Dayjs> | any) & DatePickerDayProps> = ({
  day,
  selectedDate,
  forceTheme,
  highlightCurrentWeek,
  weekStartDate,
  weekEndDate,
  shouldDisplayEvents,
  currentDayWithTimeZone,
  datePickerEvents,
  bgColor,
  ...other
}: (PickersDayProps<Dayjs> | any) & DatePickerDayProps) => {
  const dateValue = dayjs(day).utc(true);

  const isToday = isSameDate(currentDayWithTimeZone, dateValue);
  const isWeekStartDate = isSameDate(weekStartDate, dateValue);
  const isWeekEndDate = isSameDate(weekEndDate, dateValue);
  const isInCurrWeek =
    isWeekStartDate || isWeekEndDate || dateValue.isBetween(weekStartDate.utc(true), weekEndDate.utc(true), DAY_UNIT);
  const isOutsideCurrMonth = !!selectedDate && !dateValue.isSame(selectedDate.utc(true), MONTH_UNIT);

  const dayEvents: { color: AccentColor }[] = shouldDisplayEvents
    ? (datePickerEvents.find((event: DatePickerEvent) => isSameDate(event.date, dateValue))?.events || []).slice(
        0,
        MAX_NUM_OF_EVENTS_DISPLAYED
      )
    : undefined;

  return (
    <DayContainer>
      <CustomPickersDay
        {...other}
        $forceTheme={forceTheme}
        $highlightCurrentWeek={highlightCurrentWeek}
        $isInCurrWeek={isInCurrWeek}
        $isToday={isToday}
        $isWeekEndDate={isWeekEndDate}
        $isWeekStartDate={isWeekStartDate}
        day={day}
      />
      {!!dayEvents && (
        <EventsDotsContainer>
          {dayEvents.map(({ color }, i) => (
            <StyledEventDot
              $bgColor={bgColor}
              $isFirstDot={i === 0}
              color={color}
              isFaded={isOutsideCurrMonth}
              key={`event-${i}`}
            />
          ))}
        </EventsDotsContainer>
      )}
    </DayContainer>
  );
};

export default DatePickerDay;
