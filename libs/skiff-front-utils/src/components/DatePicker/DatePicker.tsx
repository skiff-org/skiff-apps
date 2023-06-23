import { CalendarPicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickerOnChangeFn } from '@mui/x-date-pickers/internals/hooks/useViews';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import locale from 'date-fns/locale/en-US';
import dayjs, { Dayjs } from 'dayjs';
import { colors, getThemedColor, Icon, Icons, Size, ThemeMode, themeNames } from '@skiff-org/skiff-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { DayOfWeek } from '../../constants';
import { StartDayOfTheWeek } from '../../constants';
import { isSameDate } from '../../utils';

interface DatePickerProps {
  onSelectDate: PickerOnChangeFn<Date> & PickerOnChangeFn<unknown>;
  selectedDate?: Dayjs;
  showHeader?: boolean;
  userStartOfTheWeek?: StartDayOfTheWeek;
  highlightCurrentWeek?: boolean;
  forceTheme?: ThemeMode;
  minDate?: Date;
  todaysDate: Dayjs;
}
interface CustomPickerDayProps extends PickersDayProps<Dayjs> {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
  isToday: boolean;
}

export const MOBILE_HEIGHT_WIDTH = 30;

const StyledCalendarPicker = styled(CalendarPicker)<{ $forceTheme: ThemeMode; $showHeader: boolean }>`
  &.MuiCalendarPicker-root {
    width: ${isMobile ? '100%' : '240px'};
    height: ${isMobile ? undefined : '285px'};
    padding: ${(props) => (props.$showHeader ? '8px 4px' : '0px 0px 8px')};
    box-sizing: border-box;

    .MuiPickersCalendarHeader-root {
      display: ${(props) => (props.$showHeader ? 'flex' : 'none')};
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding-left: 14px;
      padding-right: 8px;
    }

    .MuiPickersCalendarHeader-labelContainer {
      color: ${(props) => themeNames[props.$forceTheme]['--text-primary']};
      font-weight: 560;
      font-size: 17px;
      line-height: 24px;
      cursor: auto;
    }

    .MuiPickersArrowSwitcher-spacer {
      width: 0px;
    }

    .MuiPickersArrowSwitcher-root {
      button {
        margin: 0;
        width: 30px;
        height: 30px;
        border-radius: 8px;

        &:hover {
          background: ${(props) => themeNames[props.$forceTheme]['--cta-secondary-hover']};
        }
      }
    }

    .MuiDayPicker-weekDayLabel {
      color: ${(props) => themeNames[props.$forceTheme]['--text-disabled']};
      font-size: 13px;
      line-height: 16px;
      font-weight: 380;
      height: ${isMobile ? MOBILE_HEIGHT_WIDTH : 32}px;
      width: ${isMobile ? 44 : 32}px;
      margin: 0;
      justify-self: center;
    }
    .MuiDayPicker-header {
      display: ${isMobile ? 'grid' : 'flex'};
      grid-template-columns: repeat(7, 1fr);
    }

    .MuiDayPicker-slideTransition {
      min-height: unset;

      .MuiDayPicker-weekContainer {
        margin: 2px 0px;
        display: ${isMobile ? 'grid' : 'flex'};
        grid-template-columns: repeat(7, 1fr);
      }

      .MuiPickersDay-dayWithMargin {
        background: none;
        font-weight: 380;
        font-size: 13px;
        line-height: 16px;
        transition: none;
        height: ${isMobile ? MOBILE_HEIGHT_WIDTH : 32}px;
        width: ${isMobile ? 44 : 32}px;
        margin: 0;
        justify-self: center;

        &:hover {
          background: ${(props) => themeNames[props.$forceTheme]['--cta-secondary-hover']};
        }
      }
      .Mui-disabled {
        color: ${(props) => getThemedColor('var(--text-primary)', props.$forceTheme)};
      }

      .MuiPickersDay-dayOutsideMonth {
        color: ${(props) => themeNames[props.$forceTheme]['--text-disabled']};
      }

      .MuiPickersDay-today {
        border: none;
      }

      .Mui-selected {
        font-weight: 560;
        ${(props) =>
          css`
            background: ${isMobile ? undefined : themeNames[props.$forceTheme]['--text-always-white']};
            color: ${themeNames[props.$forceTheme]['--text-always-white']};
          `}
        z-index: 1;
        &::before {
          position: absolute;
          content: '';
          background: rgb(${colors['--orange-500']}) !important;
          width: ${isMobile ? `${MOBILE_HEIGHT_WIDTH}px` : '100%'};
          height: ${isMobile ? `${MOBILE_HEIGHT_WIDTH}px` : '100%'};
          z-index: -1;
          border-radius: 8px;
        }
      }
    }
  }
`;

const StyledCustomPickersDay = styled(PickersDay)<
  CustomPickerDayProps & { $highlightCurrentWeek: boolean; $forceTheme: ThemeMode }
>`
  &.MuiPickersDay-root {
    color: ${(props) => getThemedColor('var(--text-primary)', props.$forceTheme)};
    border-radius: 8px;
    background: transparent;
    font-weight: 380;
    font-size: 13px;
    line-height: 16px;
    height: 32px;
    width: 32px;
    &:hover {
      background: ${(props) => getThemedColor('var(--cta-secondary-hover)', props.$forceTheme)};
    }

    ${(props) =>
      props.dayIsBetween && props.$highlightCurrentWeek
        ? `border-radius: 0px;
          background: ${themeNames[props.$forceTheme]['--bg-cell-hover']} !important`
        : ''};

    ${(props) =>
      props.isFirstDay && props.$highlightCurrentWeek
        ? `border-top-left-radius: 8px;
          border-bottom-left-radius: 8px`
        : ''};

    ${(props) =>
      props.isLastDay && props.$highlightCurrentWeek
        ? `border-top-right-radius: 8px;
          border-bottom-right-radius: 8px`
        : ''};

    ${(props) => (props.isToday ? `color: rgb(${colors['--orange-500']});` : '')};
  }
`;

const DatePicker: React.FC<DatePickerProps> = ({
  onSelectDate,
  selectedDate,
  showHeader = true,
  userStartOfTheWeek = DayOfWeek.Sunday,
  highlightCurrentWeek = false,
  forceTheme = ThemeMode.LIGHT,
  minDate,
  todaysDate
}: DatePickerProps) => {
  const calendarLeftArrow = () => {
    return <Icons color='secondary' forceTheme={forceTheme} icon={Icon.Backward} size={Size.SMALL} />;
  };
  const calendarRightArrow = () => {
    return <Icons color='secondary' forceTheme={forceTheme} icon={Icon.Forward} size={Size.SMALL} />;
  };

  const renderWeekDays = (date: Date | any, _: any, pickersDayProps: PickersDayProps<Date> | any) => {
    const dateValue = dayjs(date);
    const weekStartDate = todaysDate.startOf('week').add(userStartOfTheWeek, 'day');
    const weekEndDate = todaysDate.endOf('week').add(userStartOfTheWeek, 'day');

    const dayIsBetween =
      dateValue.month() == todaysDate.month() &&
      dateValue.date() >= weekStartDate.date() &&
      dateValue.date() <= weekEndDate.date();
    const isFirstDay = isSameDate(weekStartDate, dateValue);
    const isLastDay = isSameDate(weekEndDate, dateValue);
    const isToday = isSameDate(todaysDate, dateValue);

    return (
      <StyledCustomPickersDay
        {...pickersDayProps}
        $forceTheme={forceTheme}
        $highlightCurrentWeek={highlightCurrentWeek}
        dayIsBetween={dayIsBetween}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isToday={isToday}
      />
    );
  };

  // Updating a copy of locale rather than modifying it directly to prevent bugs
  let currLocale = locale;
  if (locale && locale.options) {
    currLocale = { ...locale, options: { ...locale.options, weekStartsOn: userStartOfTheWeek } };
  }

  return (
    <LocalizationProvider adapterLocale={currLocale} dateAdapter={AdapterDateFns}>
      <StyledCalendarPicker
        $forceTheme={forceTheme}
        $showHeader={showHeader}
        components={{
          LeftArrowIcon: calendarLeftArrow,
          RightArrowIcon: calendarRightArrow
        }}
        date={selectedDate ? new Date(selectedDate.year(), selectedDate.month(), selectedDate.date()) : null}
        focusedView={null}
        minDate={minDate}
        onChange={onSelectDate}
        reduceAnimations
        renderDay={renderWeekDays}
        showDaysOutsideCurrentMonth
        views={['day']}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;
