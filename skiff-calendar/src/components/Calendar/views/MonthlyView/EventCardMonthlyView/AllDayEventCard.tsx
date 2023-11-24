import { Dayjs } from 'dayjs';
import {
  TextDecoration,
  TypographyOverflow,
  TypographySize,
  TypographyWeight,
  ThemeMode,
  AccentColor
} from 'nightwatch-ui';
import React from 'react';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import { DAY_UNIT, MONTH_UNIT } from '../../../../../constants/time.constants';
import { useAppSelector } from '../../../../../utils';
import {
  CONFIRMED_EVENT_CARD_CSS,
  MAYBE_EVENT_CARD_CSS,
  PENDING_OR_DECLINED_EVENT_CARD_CSS,
  StyledEventCardText
} from '../../styles';
import { HOVER_EFFECT_CLASS_NAME } from '../../views.constants';
import { DAY_CELL_VERTICAL_BORDER_WIDTH } from '../MonthlyView.constants';
import { CARD_CONTAINER_CSS, CARD_CSS } from '../MonthlyView.styles';
import { BaseEventCardProps } from '../MonthlyView.types';

const CardContainer = styled.div<{
  $durationInDays: number;
  $isInAllEventsDropdown: boolean;
}>`
  ${CARD_CONTAINER_CSS}
  z-index: 2;

  ${({ $durationInDays, $isInAllEventsDropdown }) =>
    !!$durationInDays &&
    !$isInAllEventsDropdown &&
    `margin-right: calc(${-100 * $durationInDays}% + ${-DAY_CELL_VERTICAL_BORDER_WIDTH * $durationInDays}px)`}
`;

const Card = styled.div<{
  $color: AccentColor;
  $isEventConfirmed: boolean;
  $isFaded: boolean;
  $isMaybeResponse: boolean;
  $isSelected: boolean;
  $themeMode: ThemeMode;
  $showHover: boolean;
}>`
  ${CARD_CSS}

  ${({ $isEventConfirmed, $isMaybeResponse }) => {
    // Attending
    if ($isEventConfirmed) return CONFIRMED_EVENT_CARD_CSS;
    // Maybe
    if ($isMaybeResponse) return MAYBE_EVENT_CARD_CSS;
    // Pending / rejected
    return PENDING_OR_DECLINED_EVENT_CARD_CSS;
  }}
`;

interface AllDayEventCardProps extends BaseEventCardProps {
  currentDayDate: Dayjs;
  displayEndDate: Dayjs;
  displayStartDate: Dayjs;
  parentEventID: string;
}

function AllDayEventCard(
  {
    color,
    currentDayDate,
    displayEndDate,
    displayStartDate,
    forceTheme,
    actualEndDate,
    actualStartDate,
    isEventConfirmed,
    isEventRejected,
    isMaybeResponse,
    isPastEvent,
    isSelected,
    title,
    isInAllEventsDropdown = false,
    parentEventID,
    virtualSelectedDate,
    onEventClick,
    onEventRightClick
  }: AllDayEventCardProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const { theme } = useTheme();
  const selectedViewDate = useAppSelector((state) => state.time).selectedViewDate;
  const selectedDate = virtualSelectedDate ?? selectedViewDate;

  // Start and end times of actual start date
  const startOfActualStartDate = actualStartDate.utc().startOf(DAY_UNIT);
  const startOfActualEndDate = actualEndDate.utc().startOf(DAY_UNIT);
  const endOfActualEndDate = actualEndDate.utc().endOf(DAY_UNIT);

  const selectedDateInUTC = selectedDate.utc(true);

  // An event is outside curr month if its end date month precedes the curr month
  // or if its start date is after the curr month
  const isOutsideCurrMonth =
    endOfActualEndDate.isBefore(selectedDateInUTC, MONTH_UNIT) ||
    startOfActualStartDate.isAfter(selectedDateInUTC, MONTH_UNIT);

  // Event duration in days within the current week
  // Get maximum with zero to ensure no negative values
  const durationInDaysInCurrentWeek = Math.max(displayEndDate.diff(displayStartDate, DAY_UNIT), 0);

  // Actual event duration, we add 1 to account for including start and end dates
  const actualDurationInDays = startOfActualEndDate.diff(startOfActualStartDate, DAY_UNIT) + 1;
  // Current day index out of the whole duration
  const currentDayIndex = currentDayDate.diff(startOfActualStartDate, DAY_UNIT) + 1;
  const dayCountText = `(Day ${currentDayIndex} of ${actualDurationInDays})`;

  const selectedTextColor = isEventConfirmed || isMaybeResponse ? 'inverse' : 'secondary';
  const textColor = isSelected ? selectedTextColor : isEventConfirmed ? color : 'secondary';
  const textDecoration = isEventRejected ? TextDecoration.LINE_THROUGH : undefined;

  const isFaded = !isInAllEventsDropdown && !isSelected && (isOutsideCurrMonth || isPastEvent);

  const className = `event-${parentEventID}`;

  // Handles enabling / disabling the hover effect on the current event as well as all of its instances across all weeks
  const toggleHover = (isHovering: boolean) => {
    // Select all event nodes with the same class name ie. event id
    const allEvents = document.querySelectorAll(`.${className}`);
    // Loop through event nodes and toggle the hover class
    allEvents.forEach((event) => {
      if (isHovering) event.classList.add(HOVER_EFFECT_CLASS_NAME);
      else event.classList.remove(HOVER_EFFECT_CLASS_NAME);
    });
  };

  return (
    <CardContainer $durationInDays={durationInDaysInCurrentWeek} $isInAllEventsDropdown={isInAllEventsDropdown}>
      <Card
        $color={color}
        $isEventConfirmed={isEventConfirmed}
        $isFaded={isFaded}
        $isMaybeResponse={isMaybeResponse}
        $isSelected={isSelected}
        $showHover
        $themeMode={forceTheme ?? theme}
        className={className}
        onClick={onEventClick}
        onContextMenu={onEventRightClick}
        onMouseEnter={isInAllEventsDropdown ? undefined : () => toggleHover(true)}
        onMouseLeave={isInAllEventsDropdown ? undefined : () => toggleHover(false)}
        ref={ref}
      >
        <StyledEventCardText
          $isFaded={isFaded}
          color={textColor}
          forceTheme={forceTheme}
          overflow={TypographyOverflow.VISIBLE} // Prevents displaying ellipses
          size={TypographySize.CAPTION}
          textDecoration={textDecoration}
          weight={TypographyWeight.MEDIUM}
        >
          {title}
          &nbsp;{isInAllEventsDropdown && actualDurationInDays > 1 && dayCountText}
        </StyledEventCardText>
      </Card>
    </CardContainer>
  );
}

export default React.memo(React.forwardRef<HTMLDivElement, AllDayEventCardProps>(AllDayEventCard));
