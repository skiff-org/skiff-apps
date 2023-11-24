import { Dayjs } from 'dayjs';
import {
  dropdownOverflowsInY,
  ThemeMode,
  Typography,
  TypographyOverflow,
  TypographySize,
  TypographyWeight,
  colors
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useState, useRef, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { DAYS_IN_WEEK, isSameDate, useTheme } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { DATE_UNIT, MONTH_UNIT } from '../../../../constants/time.constants';
import { calendarReducer } from '../../../../redux/reducers/calendarReducer';
import { getEventCardKey, useAppSelector } from '../../../../utils';
import { useCreatePendingEvent } from '../../../../utils/hooks/useCreatePendingEvent';
import { useGetMaxNumDisplayedEvents } from '../../../../utils/hooks/useGetMaxNumDisplayedEvents';
import useJumpToDate from '../../../../utils/hooks/useJumpToDate';
import { isFrozen } from '../utils';
import { CALENDAR_BG_COLOR } from '../views.constants';

import AllEventsDropdown from './AllEventsDropdown';
import EventCardMonthlyView, { GhostEventCard } from './EventCardMonthlyView';
import {
  ALL_EVENTS_DROPDOWN_CONTENT_MAX_HEIGHT,
  ALL_EVENTS_DROPDOWN_FOOTER_HEIGHT,
  ALL_EVENTS_DROPDOWN_HEADER_HEIGHT,
  DAY_CELL_VERTICAL_BORDER_WIDTH
} from './MonthlyView.constants';
import { CARD_CSS, CARD_CONTAINER_CSS } from './MonthlyView.styles';
import { MonthlyDisplayEvent } from './MonthlyView.types';

const DayCellContainer = styled.div<{ $dayIndex: number; $isInCurrentMonth: boolean; $themeMode: ThemeMode }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0px;

  background: ${({ $isInCurrentMonth, $themeMode }) => {
    const { default: defaultBg, faded: fadedBg } = CALENDAR_BG_COLOR[$themeMode];
    if (isMobile) return defaultBg;
    return $isInCurrentMonth ? defaultBg : fadedBg;
  }};

  ${({ $dayIndex }) => {
    const isLastDayOfWeek = $dayIndex === DAYS_IN_WEEK - 1;
    const borderTopWidth = 1;
    const borderRightWidth = isLastDayOfWeek ? 0 : DAY_CELL_VERTICAL_BORDER_WIDTH;
    return `border-width: ${borderTopWidth}px ${borderRightWidth}px 0px 0px;`;
  }}

  border-style: solid;
  border-color: var(--border-secondary);

  // Needed to allow the card text to overflow within the card and get hidden
  min-width: 0;
`;

const DayCellHeader = styled.div`
  padding: 0px 6px;

  ${isMobile &&
  `
    display: flex;
    justify-content: center;
  `}
`;

const EventCardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledTypography = styled(Typography)<{ $isSelectedDay: boolean; $isToday: boolean }>`
  padding: 2px 4px;
  width: fit-content;
  cursor: pointer;
  border-radius: 4px;

  ${!isMobile && 'margin-left: auto;'}

  ${({ $isToday, $isSelectedDay }) => {
    const color = `rgb(${colors['--orange-500']})`;

    if ($isToday) return `background: ${color};`;
    return css`
      ${$isSelectedDay && `color: ${color};`}
      :hover {
        background: ${$isSelectedDay ? 'var(--accent-orange-secondary)' : 'var(--bg-overlay-tertiary)'};
      }
    `;
  }}
`;

const MoreEventsCardContainer = styled.div`
  ${CARD_CONTAINER_CSS}
`;

const MoreEventsCard = styled.div`
  ${CARD_CSS}
  background: var(--bg-overlay-tertiary);
`;

interface DayCellProps {
  currentDayDate: Dayjs;
  dayEvents: (MonthlyDisplayEvent | null)[];
  dayIndex: number;
  frozenEventIDs: string[];
  virtualSelectedDate?: Dayjs;
}

const getNonNullEvents = (events: (MonthlyDisplayEvent | null)[]) => events.filter(filterExists);

const DayCellComponent: React.FC<DayCellProps> = ({
  currentDayDate,
  dayEvents,
  dayIndex,
  frozenEventIDs,
  virtualSelectedDate
}: DayCellProps) => {
  // State
  const [isAllEventsDropdownOpen, setIsAllEventsDropdownOpen] = useState(false);

  // Refs
  const headerRef = useRef<HTMLDivElement>(null);
  const moreEventsCardRef = useRef<HTMLDivElement>(null);

  const headerRefBottomPos = headerRef.current?.getBoundingClientRect().bottom || 0;
  const allEventsDropdownMaxHeight =
    ALL_EVENTS_DROPDOWN_HEADER_HEIGHT + ALL_EVENTS_DROPDOWN_FOOTER_HEIGHT + ALL_EVENTS_DROPDOWN_CONTENT_MAX_HEIGHT;
  const allEventsDropdownOverflowsInY = dropdownOverflowsInY(headerRefBottomPos, allEventsDropdownMaxHeight);
  // The all events dropdown should cover the whole day cell, so we anchor it to the day cell header
  // However, if the dropdown overflows in Y in its max height, we anchor it to the more events card,
  // so that when it repositions, it would still cover the day cell
  const dropdownButtonRef = allEventsDropdownOverflowsInY ? moreEventsCardRef : headerRef;

  // Custom hooks
  const { theme } = useTheme();
  const { jumpToDate } = useJumpToDate();
  const createPendingEvent = useCreatePendingEvent(true);
  const maxNumDisplayedEvents = useGetMaxNumDisplayedEvents();

  // Redux
  const dispatch = useDispatch();
  const { currentTime, selectedViewDate } = useAppSelector((state) => state.time);
  const selectedEventID = useAppSelector((state) => state.event.selectedEventID);
  const selectedDate = virtualSelectedDate ?? selectedViewDate;

  const isInCurrentMonth = currentDayDate.isSame(selectedDate, MONTH_UNIT);
  const isSelectedDay = isSameDate(currentDayDate, selectedDate);
  const isToday = isSameDate(currentDayDate, currentTime);

  // We display a specific number of events in each cell
  const displayedDayEvents = dayEvents.slice(0, maxNumDisplayedEvents);
  const hiddenEventsLength = dayEvents.length - displayedDayEvents.length;
  // Whether current selected event is in the day's events
  const isSelectedEventInCurrDay = dayEvents.some((event) => !!event && event.parentEventID === selectedEventID);
  // Whether current selected event is displayed
  const isSelectedEventDisplayed = displayedDayEvents.some((event) => event?.parentEventID === selectedEventID);
  // Whether current selected event is hidden
  const isSelectedEventHidden = isSelectedEventInCurrDay && !isSelectedEventDisplayed;

  const moreEventsCardText = `+ ${hiddenEventsLength}${
    isMobile ? '' : ` more ${pluralize('event', hiddenEventsLength)}`
  }`;

  // Opens Week view on the current day
  const openWeekView = (e: React.MouseEvent) => {
    e.stopPropagation();
    jumpToDate(currentDayDate);
    dispatch(calendarReducer.actions.setCalendarView(CalendarView.Weekly));
  };

  // Handling clicking on a day cell
  const onDayCellClick = (e: React.MouseEvent) => {
    // On Mobile, tapping anywhere on the day cell should open the current day in Week view
    if (isMobile) {
      openWeekView(e);
      return;
    }

    // On Web, we create a new event
    // Only create a new event if no event is selected
    if (selectedEventID) return;
    e.stopPropagation();
    // Keep local time bec, otherwise, the event is created on the previous day
    void createPendingEvent(currentDayDate.utc(true));
  };

  useEffect(() => {
    if (isMobile) return;
    // On changing selected view date, close any other opened dropdown
    // To handle editing events dates
    if (!isSameDate(selectedDate, currentDayDate)) return setIsAllEventsDropdownOpen(false);
    // If selected event is hidden, open its more events dropdown
    if (isSelectedEventHidden) return setIsAllEventsDropdownOpen(true);
  }, [selectedDate, isSelectedEventHidden, currentDayDate]);

  return (
    <DayCellContainer
      $dayIndex={dayIndex}
      $isInCurrentMonth={isInCurrentMonth}
      $themeMode={theme}
      onClick={onDayCellClick}
    >
      <DayCellHeader ref={headerRef}>
        <StyledTypography
          $isSelectedDay={isSelectedDay}
          $isToday={isToday}
          color={isToday ? 'white' : !isInCurrentMonth ? 'disabled' : undefined}
          onClick={openWeekView}
          size={TypographySize.SMALL}
        >
          {currentDayDate.get(DATE_UNIT)}
        </StyledTypography>
      </DayCellHeader>
      <EventCardsContainer>
        {displayedDayEvents.map((event, index) =>
          event === null || event.isGhost ? (
            <GhostEventCard key={`ghost-${index}`} />
          ) : (
            <EventCardMonthlyView
              currentDayDate={currentDayDate}
              displayEvent={event}
              frozenEventIDs={frozenEventIDs}
              key={getEventCardKey(event)}
              virtualSelectedDate={virtualSelectedDate}
            />
          )
        )}
        {!!hiddenEventsLength && (
          <>
            <MoreEventsCardContainer ref={moreEventsCardRef}>
              <MoreEventsCard
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  jumpToDate(currentDayDate);
                  setIsAllEventsDropdownOpen(true);
                }}
              >
                <Typography
                  color='secondary'
                  overflow={TypographyOverflow.VISIBLE} // Prevents displaying ellipses
                  size={TypographySize.CAPTION}
                  weight={TypographyWeight.MEDIUM}
                >
                  {moreEventsCardText}
                </Typography>
              </MoreEventsCard>
            </MoreEventsCardContainer>
            <AllEventsDropdown
              buttonRef={dropdownButtonRef}
              currentDayDate={currentDayDate}
              dayEvents={getNonNullEvents(dayEvents)}
              frozenEventIDs={frozenEventIDs}
              setShowDropdown={setIsAllEventsDropdownOpen}
              showDropdown={isAllEventsDropdownOpen && !isMobile}
            />
          </>
        )}
      </EventCardsContainer>
    </DayCellContainer>
  );
};

const MemoizedDayCell = React.memo(DayCellComponent, (prev, next) => {
  const {
    currentDayDate: prevCurrentDayDate,
    dayEvents: prevDayEvents,
    dayIndex: prevDayIndex,
    virtualSelectedDate: prevVirtualSelectedDate
  } = prev;

  const {
    currentDayDate: nextCurrentDayDate,
    dayEvents: nextDayEvents,
    dayIndex: nextDayIndex,
    frozenEventIDs: nextFrozenEventIDs,
    virtualSelectedDate: nextVirtualSelectedDate
  } = next;

  if (isFrozen(getNonNullEvents(nextDayEvents), nextFrozenEventIDs)) return true;

  // Remove parentEventId from comparison because it is always randomly generated
  const prevDayEventsWithoutId = prevDayEvents.map((prevDayEvent) => {
    if (prevDayEvent === null) return prevDayEvent;
    const { parentEventID, ...event } = prevDayEvent;
    return event;
  });
  const nextDayEventsWithoutId = nextDayEvents.map((nextDayEvent) => {
    if (nextDayEvent === null) return nextDayEvent;
    const { parentEventID, ...event } = nextDayEvent;
    return event;
  });

  return (
    JSON.stringify(prevDayEventsWithoutId) === JSON.stringify(nextDayEventsWithoutId) &&
    isSameDate(prevCurrentDayDate, nextCurrentDayDate) &&
    prevDayIndex === nextDayIndex &&
    !!prevVirtualSelectedDate &&
    !!nextVirtualSelectedDate &&
    isSameDate(prevVirtualSelectedDate, nextVirtualSelectedDate)
  );
});

export const DayCell: React.FC<DayCellProps> = ({ ...props }) => {
  return <MemoizedDayCell {...props} />;
};

export default React.memo(DayCell);
