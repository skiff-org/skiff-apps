import { Dayjs } from 'dayjs';
import { AccentColor, Typography, REMOVE_SCROLLBAR_CSS, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { Suspense, memo, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useUserPreference, lazyWithPreload } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { DAY_COLUMN_CONTAINER_ID } from '../../../constants';
import { DAY_UNIT, DATE_UNIT } from '../../../constants/time.constants';
import { CalendarRef } from '../../../redux/reducers/calendarReducer';
import { DecryptedDraft } from '../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../storage/models/event/types';
import { getEventCardKey, getStartOfDateInUTC, unixDateToStartOfDateInUTC, useAppSelector } from '../../../utils';
import { useCreatePendingEvent } from '../../../utils/hooks/useCreatePendingEvent';
import { EventCardProps } from '../EventCard/EventCard';
import { isFrozen } from '../views/utils';

const EventCard = lazyWithPreload(() => import('../EventCard/EventCard'));

const paddingLeft = css`
  padding-left: 12px;
`;

const DayBlock = styled.div<{ isText?: boolean; $trueHeight: number; $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: ${(props) => (!props.$collapsed ? 'flex-start' : 'center')};
  position: relative;
  box-sizing: border-box;
  height: ${(props) => props.$trueHeight}px;
  ${(props) => props.isText && paddingLeft};
  ${!isMobile && 'border-left: 1px solid var(--border-secondary)'};
  ${REMOVE_SCROLLBAR_CSS}
`;

interface SingleAllDayEventColumnProps {
  // the date to calculate events from
  date: Dayjs;
  // is collapsed display mode
  isCollapsed: boolean;
  // the true height of the event list -> so we can scroll and see all events.
  height: number;
  // all events, including overlapping events, for the week.
  allDayEvents: (DecryptedDraft | DecryptedEvent)[] | undefined;
  // locations of each event on the all-day grid
  eventLocations: Map<string, number>;
  trueHeight: number;
  allDaySectionRef: CalendarRef;
  // expand the all day container
  expandContainer: () => void;
  // the current value of the day in the week
  value: number;
  frozenEventsIDs: string[];
}

const generateEventCardProps = (
  allDayEvent: DecryptedEvent | DecryptedDraft,
  color: AccentColor,
  isDragging?: boolean,
  top = 0,
  daySpread = 1
): EventCardProps => ({
  calculatedEvent: {
    event: {
      ...allDayEvent,
      displayStartDate: allDayEvent.plainContent.startDate,
      displayEndDate: allDayEvent.plainContent.endDate,
      isSplitDisplayEvent: false,
      isFirstDisplayedEvent: false,
      isLastDisplayedEvent: false,
      decryptedContent: {
        ...allDayEvent.decryptedContent,
        isAllDay: true
      },
      color: allDayEvent.decryptedPreferences?.color ?? color
    },
    left: 0,
    indentation: 0,
    width: daySpread
  },
  allDayTopOffset: top,
  isDragging: !!isDragging
});

const calcDaySpread = (allDayEvent: DecryptedEvent | DecryptedDraft, startOfTheWeek: Dayjs) => {
  // event that started before the start of the week should be calculated from the start of this week
  // All dates are in UTC since timezone does not affect all day events
  const allDayEventStartDate = unixDateToStartOfDateInUTC(allDayEvent.plainContent.startDate);
  const startOfWeekInUTC = getStartOfDateInUTC(startOfTheWeek);
  const startDate =
    allDayEventStartDate.valueOf() < startOfWeekInUTC.valueOf() ? startOfWeekInUTC : allDayEventStartDate;
  const endDate = unixDateToStartOfDateInUTC(allDayEvent.plainContent.endDate);
  const days = endDate.diff(startDate, DAY_UNIT) + 1;
  return days;
};

export const SingleAllDayEventColumnComponent: React.FC<SingleAllDayEventColumnProps> = ({
  date,
  isCollapsed,
  height,
  trueHeight,
  allDayEvents,
  eventLocations,
  allDaySectionRef,
  expandContainer,
  value
}: SingleAllDayEventColumnProps) => {
  const [defaultCalendarColor] = useUserPreference(StorageTypes.DEFAULT_CALENDAR_COLOR);
  const draggedEventID = useAppSelector((state) => state.eventDragging.draggedEventData.draggedEventID);
  const selectedEventID = useAppSelector((state) => state.event.selectedEventID);
  const createAllDayPendingEvent = useCreatePendingEvent(true);

  // All dates are in UTC since timezone does not affect all day events
  const utcDate = date.utc(true);
  const defaultAllDayEventStart = utcDate.startOf(DATE_UNIT);
  // start of week is calculated manually since we can't change start of a week
  const startOfWeek = utcDate.subtract(value, DAY_UNIT);

  useEffect(() => {
    void Promise.all([EventCard.preload()]);
  }, []);

  const eventStartedToday = (allDayEvent: DecryptedDraft | DecryptedEvent) => {
    const allDayEventStartDate = unixDateToStartOfDateInUTC(allDayEvent.plainContent.startDate);
    const eventStart = allDayEventStartDate < startOfWeek ? startOfWeek : allDayEventStartDate;
    const isEventStartingToday = eventStart.isSame(defaultAllDayEventStart);

    if (isEventStartingToday) return true;
    // if event doesn't start today, we should increase the cross day amount by one,
    // that will add an extra offset to the event
    return false;
  };

  // if mobile, show all day events in the day. If desktop, only show events that started today
  const allDayEventsToRender = isMobile
    ? allDayEvents
    : allDayEvents?.filter(eventStartedToday).sort((firstEvent, secondEvent) => {
        // All dates are in UTC since timezone does not affect all day events
        const firstEventEndDate = unixDateToStartOfDateInUTC(firstEvent.plainContent.endDate);
        const secondEventEndDate = unixDateToStartOfDateInUTC(secondEvent.plainContent.endDate);
        return firstEventEndDate.isAfter(secondEventEndDate) ? -1 : 1;
      });

  const hasAllDayEventsToRender = allDayEventsToRender && allDayEventsToRender.length > 0;

  const showCollapsed = hasAllDayEventsToRender && isCollapsed;
  const showOpen = hasAllDayEventsToRender && !isCollapsed;

  // If there is only one event, collapsed mode should be displayed differently
  const isSingleAllDayEventCollapsed = showCollapsed && allDayEvents?.length === 1;

  const heightToRender = isCollapsed ? height : trueHeight;
  const onClickAllDayEventColumn = (e: React.MouseEvent) => {
    // Only create a new event if we aren't already creating one
    if (selectedEventID) return;
    e.stopPropagation();
    void createAllDayPendingEvent(defaultAllDayEventStart);
  };
  // If the all day section is collapsed but there is only one all
  // day event for the day, render the event block
  if (isSingleAllDayEventCollapsed) {
    return (
      <DayBlock
        $collapsed={isCollapsed}
        $trueHeight={heightToRender}
        id={DAY_COLUMN_CONTAINER_ID}
        onClick={onClickAllDayEventColumn}
      >
        <Suspense fallback={<></>}>
          <EventCard
            {...generateEventCardProps(allDayEventsToRender[0], defaultCalendarColor)}
            allDaySectionRef={allDaySectionRef}
            key={getEventCardKey(allDayEventsToRender[0])}
          />
        </Suspense>
      </DayBlock>
    );
  }

  if (showOpen) {
    const allDayEventList = allDayEventsToRender.map((allDayEvent) => (
      <Suspense fallback={<></>} key={getEventCardKey(allDayEvent)}>
        <EventCard
          key={getEventCardKey(allDayEvent)}
          {...generateEventCardProps(
            allDayEvent,
            defaultCalendarColor,
            allDayEvent.parentEventID === draggedEventID,
            eventLocations.get(allDayEvent.parentEventID),
            calcDaySpread(allDayEvent, utcDate.startOf(DAY_UNIT))
          )}
          allDaySectionRef={allDaySectionRef}
        />
      </Suspense>
    ));

    // the height should stay under the MAX_ALL_DAY_COLUMN_HEIGHT constant if the
    // amount of events surpasses the limit - 6 events.
    return (
      <DayBlock
        $collapsed={isCollapsed}
        $trueHeight={trueHeight}
        id={DAY_COLUMN_CONTAINER_ID}
        onClick={onClickAllDayEventColumn}
      >
        {allDayEventList}
      </DayBlock>
    );
  }

  // If the all day section is collapsed and there are all day events for
  // for the day, render the number of events
  if (isCollapsed && allDayEvents && allDayEvents.length > 0) {
    const moreThanOneEvent = allDayEvents.length > 1;
    return (
      <DayBlock $collapsed={isCollapsed} $trueHeight={height} isText={true}>
        <Typography
          color='secondary'
          onClick={expandContainer}
          size={TypographySize.SMALL}
          weight={TypographyWeight.MEDIUM}
        >{`${allDayEvents.length} event${moreThanOneEvent ? 's' : ''}`}</Typography>
      </DayBlock>
    );
  }

  // No all day events to render
  return (
    <DayBlock
      $collapsed={isCollapsed}
      $trueHeight={heightToRender}
      id={DAY_COLUMN_CONTAINER_ID}
      onClick={onClickAllDayEventColumn}
    />
  );
};

export const SingleAllDayEventColumn = memo(SingleAllDayEventColumnComponent, (_prev, next) => {
  const { allDayEvents, frozenEventsIDs } = next;
  const nextAllDayEvents = allDayEvents ?? [];
  if (isFrozen(nextAllDayEvents, frozenEventsIDs)) return true;

  return false;
});
