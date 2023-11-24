import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import locale from 'date-fns/locale/en-US';
import { Dayjs } from 'dayjs';
import { getThemedColor, Icon, Icons, Size, TEXT_COLOR_VALUES, ThemeMode } from 'nightwatch-ui';
import { TYPOGRAPHY_MEDIUM_CSS } from 'nightwatch-ui';
import React, { useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { StorageTypes } from '../../../../skiff-utils/src';
import { DAY_UNIT } from '../../constants';
import { useUserPreference } from '../../hooks';
import { dayjs, getUserGuessedTimeZone, getWeekStartAndEndDates } from '../../utils';

import { HEADER_MARGIN_BOTTOM, WEEK_ROW_VERTICAL_MARGIN } from './DatePicker.constants';
import { DAY_PICKER_LABEL_CSS, DAY_PICKER_BUTTON_CSS } from './DatePicker.styles';
import { DatePickerProps } from './DatePicker.types';
import { getDatePickerHeight } from './DatePicker.utils';
import DatePickerDay from './DatePickerDay';
import { DatePickerDayProps } from './DatePickerDay/DatePickerDay.types';

const FIXED_NUMBER_OF_WEEKS = 6;

const StyledDateCalendar = styled(DateCalendar)<{
  $shouldDisplayEvents: boolean;
  $showHeader: boolean;
  $forceTheme?: ThemeMode;
}>`
  &.MuiDateCalendar-root {
    width: ${isMobile ? '100%' : '238px'};
    height: ${({ $shouldDisplayEvents, $showHeader }) => getDatePickerHeight($shouldDisplayEvents, $showHeader)}px;

    .MuiPickersCalendarHeader-root {
      display: ${(props) => (props.$showHeader ? 'flex' : 'none')};
      justify-content: space-between;
      align-items: center;
      margin: 0 0 ${HEADER_MARGIN_BOTTOM}px 0;
      padding: 0 2px 0 12px;
    }

    .MuiPickersCalendarHeader-label {
      font-family: 'Skiff Sans Display';
      color: ${(props) => getThemedColor(TEXT_COLOR_VALUES.primary, props.$forceTheme)};
      cursor: auto;
      ${TYPOGRAPHY_MEDIUM_CSS}
    }

    .MuiPickersArrowSwitcher-spacer {
      width: 0px;
    }

    .MuiPickersArrowSwitcher-root {
      gap: 2px;

      button {
        margin: 0;
        ${DAY_PICKER_BUTTON_CSS};

        &:hover {
          background: ${(props) => getThemedColor('var(--cta-secondary-hover)', props.$forceTheme)};
        }
      }
    }

    .MuiDayCalendar-weekDayLabel {
      color: ${(props) => getThemedColor(TEXT_COLOR_VALUES.disabled, props.$forceTheme)};
      ${DAY_PICKER_LABEL_CSS}
    }

    .MuiDayCalendar-header {
      display: ${isMobile ? 'grid' : 'flex'};
      grid-template-columns: repeat(7, 1fr);
    }

    .MuiDayCalendar-slideTransition {
      min-height: unset;

      .MuiDayCalendar-weekContainer {
        margin: ${({ $shouldDisplayEvents }) => ($shouldDisplayEvents ? 0 : WEEK_ROW_VERTICAL_MARGIN)}px 0px;
        display: ${isMobile ? 'grid' : 'flex'};
        grid-template-columns: repeat(7, 1fr);
      }

      .MuiPickersDay-dayWithMargin {
        background: none;
        transition: none;
      }

      .Mui-disabled {
        color: ${(props) => getThemedColor(TEXT_COLOR_VALUES.disabled, props.$forceTheme)} !important;
      }

      .MuiPickersDay-dayOutsideMonth {
        color: ${(props) => getThemedColor(TEXT_COLOR_VALUES.tertiary, props.$forceTheme)};
      }
    }
  }
`;

const dayjsToDate = (date: Dayjs) => new Date(date.year(), date.month(), date.date());

const DatePicker: React.FC<DatePickerProps> = ({
  onSelectDate,
  bgColor,
  className,
  datePickerEvents,
  forceTheme,
  highlightCurrentWeek = false,
  minDate,
  selectedDate,
  showHeader = true
}: DatePickerProps) => {
  const [selectedDateValue, setSelectedDateValue] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setSelectedDateValue(dayjsToDate(selectedDate));
    }
  }, [selectedDate]);

  const [localStartDay] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const [userTimeZone] = useUserPreference(StorageTypes.TIME_ZONE);
  const [userStartOfTheWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const currTimeZone = useMemo(() => userTimeZone ?? getUserGuessedTimeZone(), [userTimeZone]);
  const currentDayWithTimeZone = useMemo(() => dayjs().tz(currTimeZone), [currTimeZone]);
  const { weekStartDate, weekEndDate } = useMemo(
    (): { weekStartDate: Dayjs; weekEndDate: Dayjs } =>
      getWeekStartAndEndDates(currentDayWithTimeZone, localStartDay, currTimeZone),
    [currTimeZone, currentDayWithTimeZone, localStartDay]
  );
  // Updating a copy of locale rather than modifying it directly to prevent bugs
  const currLocale = useMemo(() => {
    if (locale && locale.options) {
      return { ...locale, options: { ...locale.options, weekStartsOn: userStartOfTheWeek } };
    }
    return locale;
  }, [userStartOfTheWeek]);

  const shouldDisplayEvents = !!datePickerEvents;

  const datePickerDayProps: DatePickerDayProps = {
    selectedDate: selectedDate,
    forceTheme: forceTheme,
    highlightCurrentWeek: highlightCurrentWeek,
    currentDayWithTimeZone: currentDayWithTimeZone,
    weekStartDate: weekStartDate,
    weekEndDate: weekEndDate,
    shouldDisplayEvents: shouldDisplayEvents,
    datePickerEvents: datePickerEvents,
    bgColor: bgColor
  };

  const leftArrowIconProps: { icon: Icon } = {
    icon: Icon.Backward
  };

  const rightArrowIconProps: { icon: Icon } = {
    icon: Icon.Forward
  };

  const CustomIcon = ({ icon }: { icon: Icon }) => (
    <Icons color='secondary' forceTheme={forceTheme} icon={icon} size={Size.SMALL} />
  );

  return (
    <LocalizationProvider adapterLocale={currLocale} dateAdapter={AdapterDateFns}>
      <StyledDateCalendar
        $forceTheme={forceTheme}
        $shouldDisplayEvents={shouldDisplayEvents}
        $showHeader={showHeader}
        className={className}
        fixedWeekNumber={FIXED_NUMBER_OF_WEEKS}
        focusedView={null}
        minDate={minDate}
        onChange={onSelectDate}
        reduceAnimations
        showDaysOutsideCurrentMonth
        slotProps={{
          day: datePickerDayProps,
          leftArrowIcon: leftArrowIconProps,
          rightArrowIcon: rightArrowIconProps
        }}
        slots={{
          day: DatePickerDay,
          leftArrowIcon: CustomIcon,
          rightArrowIcon: CustomIcon
        }}
        value={selectedDateValue}
        views={[DAY_UNIT]}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;
