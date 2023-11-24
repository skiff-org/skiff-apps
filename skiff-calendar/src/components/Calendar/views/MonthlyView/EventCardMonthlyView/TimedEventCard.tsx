import { Dayjs } from 'dayjs';
import {
  AccentColor,
  ACCENT_COLOR_VALUES,
  Typography,
  TypographySize,
  TypographyWeight,
  TextDecoration,
  TypographyOverflow,
  getThemedColor,
  ThemeMode,
  colors
} from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import {
  DayFormats,
  EventDot,
  EventDotType,
  hourFormatParser,
  HourFormatValue,
  HourFormats,
  MONTH_UNIT,
  useUserPreference
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { DAY_UNIT } from '../../../../../constants/time.constants';
import { dateToFormatString, useAppSelector, useLocalSetting } from '../../../../../utils';
import { EVENT_CARD_TEXT_CSS, StyledEventCardText } from '../../styles';
import { EXPANDED_EVENT_CARD_HEIGHT } from '../MonthlyView.constants';
import { CARD_CONTAINER_CSS, CARD_CSS } from '../MonthlyView.styles';
import { BaseEventCardProps } from '../MonthlyView.types';

const CardContainer = styled.div`
  ${CARD_CONTAINER_CSS}
`;

const Card = styled.div<{
  $isInAllEventsDropdown: boolean;
  $isSelected: boolean;
  $color: AccentColor;
  $forceTheme?: ThemeMode;
}>`
  ${CARD_CSS}
  padding-left: 0;

  ${({ $forceTheme, $color, $isSelected, $isInAllEventsDropdown }) => {
    if ($isSelected) {
      return `
        background: ${
          $isInAllEventsDropdown ? `rgb(${colors[`--${$color}-400`]}, 0.08)` : ACCENT_COLOR_VALUES[$color][0]
        };
      `;
    }
    return `
        &:hover {
          background: ${getThemedColor('var(--bg-overlay-tertiary)', $forceTheme)};
        }
      `;
  }}

  ${({ $isInAllEventsDropdown }) =>
    $isInAllEventsDropdown &&
    `
      border-radius: 4px;
      height: ${EXPANDED_EVENT_CARD_HEIGHT}px; // Override default height
      padding: 4px 2px 2px; // Override default padding
    `};
`;

const StyledEventDot = styled(EventDot)`
  min-width: ${isMobile ? 12 : 14}px;
  ${!isMobile && 'margin-right: 4px;'}
`;

const StartTime = styled(Typography)<{ $isFaded: boolean }>`
  min-width: unset;
  ${EVENT_CARD_TEXT_CSS}
`;

/** Returns formatted time for timed event card */
const getFormattedTime = (
  actualStartDate: Dayjs,
  actualEndDate: Dayjs,
  isInAllEventsDropdown: boolean,
  userHourFormat?: HourFormatValue
): string => {
  // User hour format used to display time
  const displayFormat = userHourFormat ? hourFormatParser(userHourFormat) : HourFormats.Long;
  const formattedStartTime = dateToFormatString(actualStartDate, displayFormat);

  // In more events dropdown we show formatted start time and end time
  if (isInAllEventsDropdown) {
    const formattedEndTime = dateToFormatString(actualEndDate, displayFormat);
    const isSplitDay = !actualStartDate.isSame(actualEndDate, DAY_UNIT);

    // Show the day if it's a split event
    if (isSplitDay) {
      const actualStartDay = dateToFormatString(actualStartDate, DayFormats.ShortName);
      const actualEndDay = dateToFormatString(actualEndDate, DayFormats.ShortName);
      return `${actualStartDay},\u00A0${formattedStartTime}\u00A0-\u00A0${actualEndDay},\u00A0${formattedEndTime}`;
    } else {
      return `${formattedStartTime}\u00A0-\u00A0${formattedEndTime}`;
    }
  }

  // In monthly view we only display formatted start time
  // And omit minutes if we're on the 12-hour format and time starts on the hour
  if (userHourFormat === HourFormatValue.Twelve && actualStartDate.minute() === 0) {
    const displayFormatWithoutMinutes = displayFormat.replace(':mm', '') as HourFormats;
    return dateToFormatString(actualStartDate, displayFormatWithoutMinutes);
  }

  return formattedStartTime;
};

function TimedEventCard(
  {
    color,
    actualStartDate,
    actualEndDate,
    forceTheme,
    isEventConfirmed,
    isEventRejected,
    isSelected,
    isMaybeResponse,
    isPastEvent,
    title,
    isInAllEventsDropdown = false,
    virtualSelectedDate,
    onEventClick,
    onEventRightClick
  }: BaseEventCardProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  const [userTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);

  const selectedViewDate = useAppSelector((state) => state.time).selectedViewDate;
  const selectedDate = virtualSelectedDate ?? selectedViewDate;

  // Get displayed dates in the user's timezone
  const actualStartDateWithTimezone = actualStartDate.tz(userTimezone);
  const actualEndDateWithTimezone = actualEndDate.tz(userTimezone);

  // An event is outside curr month if its end date month precedes the curr month
  // or if its start date is after the curr month
  const isOutsideCurrMonth =
    actualEndDateWithTimezone.isBefore(selectedDate, MONTH_UNIT) ||
    actualStartDateWithTimezone.isAfter(selectedDate, MONTH_UNIT);

  const selectedTextColor = isInAllEventsDropdown ? 'primary' : 'inverse';
  const textColor = isSelected ? selectedTextColor : isEventConfirmed ? 'primary' : 'secondary';
  const textSize = TypographySize.CAPTION;
  const textDecoration = isEventRejected ? TextDecoration.LINE_THROUGH : undefined;

  // We display the formatted time on timed event cards
  const formattedTime = getFormattedTime(
    actualStartDateWithTimezone,
    actualEndDateWithTimezone,
    isInAllEventsDropdown,
    userHourFormat
  );

  const isFaded = !isInAllEventsDropdown && !isSelected && (isOutsideCurrMonth || isPastEvent);

  const getDotType = () => {
    if (isEventConfirmed) return EventDotType.FILLED;
    if (isMaybeResponse) return EventDotType.EMPTY_WITH_DOT;
    if (isEventRejected) return EventDotType.EMPTY_WITH_CROSS;
    return EventDotType.EMPTY;
  };

  return (
    <CardContainer>
      <Card
        $color={color}
        $forceTheme={forceTheme}
        $isInAllEventsDropdown={isInAllEventsDropdown}
        $isSelected={isSelected}
        onClick={onEventClick}
        onContextMenu={onEventRightClick}
        ref={ref}
      >
        <StyledEventDot
          color={color}
          forceTheme={forceTheme}
          isFaded={isFaded}
          isInAllEventsDropdown={isInAllEventsDropdown}
          isSelected={isSelected}
          type={getDotType()}
        />
        {!isInAllEventsDropdown && !isMobile && (
          <StartTime
            $isFaded={isFaded}
            color={textColor}
            forceTheme={forceTheme}
            overflow={TypographyOverflow.VISIBLE}
            size={textSize}
            textDecoration={textDecoration}
            weight={TypographyWeight.MEDIUM}
          >
            {formattedTime}
          </StartTime>
        )}
        <div>
          <StyledEventCardText
            $isFaded={isFaded}
            color={textColor}
            forceTheme={forceTheme}
            overflow={TypographyOverflow.VISIBLE}
            size={textSize}
            textDecoration={textDecoration}
          >
            {!isInAllEventsDropdown ? '\u00A0' : ''}
            {title}
          </StyledEventCardText>
          {isInAllEventsDropdown && (
            <StyledEventCardText
              $isFaded={isFaded}
              color='disabled'
              forceTheme={forceTheme}
              mono
              size={textSize}
              textDecoration={textDecoration}
            >
              {formattedTime}
            </StyledEventCardText>
          )}
        </div>
      </Card>
    </CardContainer>
  );
}

export default React.memo(React.forwardRef<HTMLDivElement, BaseEventCardProps>(TimedEventCard));
