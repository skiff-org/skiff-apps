import dayjs, { Dayjs } from 'dayjs';
import { Portal, ThemeMode } from 'nightwatch-ui';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { isSameDate } from 'skiff-front-utils';
import { AttendeeStatus } from 'skiff-graphql';

import { useRequiredCurrentCalendarID } from '../../../../../apollo/currentCalendarMetadata';
import { UNTITLED_EVENT } from '../../../../../constants/calendar.constants';
import { canUserEditEvent, getAttendeeFromCalendarID } from '../../../../../utils';
import { useSelectedEventID } from '../../../../../utils/hooks/useSelectedEvent';
import { EventOptions } from '../../../EventOptions/EventOptions';
import { OptionsDropdownTargetInfo } from '../../../EventOptions/EventOptionsDropdown';
import { useEventClick } from '../../../useEventClick';
import { useIsPastEvent } from '../../useIsPastEvent';
import { isFrozen } from '../../utils';
import { BaseEventCardProps, MonthlyDisplayEvent } from '../MonthlyView.types';

import AllDayEventCard from './AllDayEventCard';
import TimedEventCard from './TimedEventCard';

interface EventCardProps {
  currentDayDate: Dayjs;
  displayEvent: MonthlyDisplayEvent;
  frozenEventIDs: string[];
  isInAllEventsDropdown?: boolean;
  virtualSelectedDate?: Dayjs;
}

const EventCardComponent: React.FC<EventCardProps> = ({
  currentDayDate,
  displayEvent,
  isInAllEventsDropdown = false,
  virtualSelectedDate
}: EventCardProps) => {
  // State
  const [optionsDropdownTarget, setOptionsDropdownTarget] = useState<OptionsDropdownTargetInfo>({
    x: 0,
    y: 0,
    isOpen: false
  });

  // Refs
  const eventCardRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const calendarID = useRequiredCurrentCalendarID();
  const selectedEventID = useSelectedEventID();
  const selectEvent = useEventClick(displayEvent);
  const isPastEvent = useIsPastEvent(displayEvent);

  const { endDate: actualEndDate, startDate: actualStartDate } = displayEvent.plainContent;
  const { attendees, isAllDay, title } = displayEvent.decryptedContent;
  const { color: eventColor, displayStartDate, displayEndDate, parentEventID } = displayEvent;

  // Memoized values
  const actualStartDateMemoized = useMemo(() => dayjs(actualStartDate), [actualStartDate]);
  const actualEndDateMemoized = useMemo(() => dayjs(actualEndDate), [actualEndDate]);
  const displayStartDateMemoized = useMemo(() => dayjs(displayStartDate), [displayStartDate]);
  const displayEndDateMemoized = useMemo(() => dayjs(displayEndDate), [displayEndDate]);

  // Gets the current user as an attendee
  const currUserAttendee = getAttendeeFromCalendarID(calendarID, attendees);
  // Current user's attendee status
  const currUserAttendeeStatus = currUserAttendee?.attendeeStatus;
  // The user is attending the event
  const isEventConfirmed = currUserAttendeeStatus === AttendeeStatus.Yes;
  // The user rejected the event
  const isEventRejected = currUserAttendeeStatus === AttendeeStatus.No;
  // The user responded with "maybe"
  const isMaybeResponse = currUserAttendeeStatus === AttendeeStatus.Maybe;
  // If current user can edit event
  const canEditEvent = !!currUserAttendee && canUserEditEvent(currUserAttendee);
  // Is this event selected
  const isSelectedEvent = selectedEventID === parentEventID;

  // Handles clicking on an event
  const onEventClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    void selectEvent();
  };

  // Handles right clicking on an event
  const onEventRightClick = (e: React.MouseEvent) => {
    onEventClick(e);
    // Open more event options dropdown
    setOptionsDropdownTarget({
      x: e.clientX,
      y: e.clientY,
      isOpen: true
    });
  };

  useEffect(() => {
    // Scroll to selected event
    // We disable scrolling in mobile
    if (isSelectedEvent && eventCardRef.current && !isMobile) {
      eventCardRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    // isSelectedEvent isn't added as a dependency because we only want to scroll to selected event on opening the dropdown
  }, [isInAllEventsDropdown]);

  // Shared props between all-day events and timed events
  const baseEventCardProps: BaseEventCardProps = {
    color: eventColor,
    actualEndDate: actualEndDateMemoized,
    actualStartDate: actualStartDateMemoized,
    forceTheme: isInAllEventsDropdown ? ThemeMode.DARK : undefined,
    isEventConfirmed,
    isEventRejected,
    isSelected: isSelectedEvent,
    isInAllEventsDropdown,
    isMaybeResponse,
    isPastEvent,
    onEventClick,
    onEventRightClick,
    title: title.length ? title : UNTITLED_EVENT,
    virtualSelectedDate
  };

  return (
    <>
      {isAllDay && (
        <AllDayEventCard
          currentDayDate={currentDayDate}
          displayEndDate={displayEndDateMemoized}
          displayStartDate={displayStartDateMemoized}
          parentEventID={parentEventID}
          ref={eventCardRef}
          {...baseEventCardProps}
        />
      )}
      {!isAllDay && <TimedEventCard ref={eventCardRef} {...baseEventCardProps} />}
      {!isInAllEventsDropdown && (
        <Portal>
          <EventOptions
            canEdit={canEditEvent}
            dropdownAnchor={{ x: optionsDropdownTarget.x, y: optionsDropdownTarget.y }}
            dropdownBtnRef={eventCardRef}
            eventID={parentEventID}
            isOpen={optionsDropdownTarget.isOpen}
            onClose={() => {
              setOptionsDropdownTarget((target) => ({ ...target, isOpen: false }));
            }}
          />
        </Portal>
      )}
    </>
  );
};

const MemoizedEventCard = React.memo(EventCardComponent, (prev, next) => {
  const {
    currentDayDate: prevCurrentDayDate,
    displayEvent: prevDisplayEvent,
    isInAllEventsDropdown: prevIsInAllEventsDropdown,
    virtualSelectedDate: prevVirtualSelectedDate
  } = prev;

  const {
    currentDayDate: nextCurrentDayDate,
    displayEvent: nextDisplayEvent,
    frozenEventIDs: nextFrozenEventsIDs,
    isInAllEventsDropdown: nextIsInAllEventsDropdown,
    virtualSelectedDate: nextVirtualSelectedDate
  } = next;

  if (isFrozen([nextDisplayEvent], nextFrozenEventsIDs)) return true;

  const { parentEventID: prevParentEventID, ...newPrevDisplayEvent } = prevDisplayEvent;
  const { parentEventID: nextParentEventID, ...newNextDisplayEvent } = nextDisplayEvent;

  return (
    isSameDate(prevCurrentDayDate, nextCurrentDayDate) &&
    JSON.stringify(newPrevDisplayEvent) === JSON.stringify(newNextDisplayEvent) &&
    prevIsInAllEventsDropdown === nextIsInAllEventsDropdown &&
    !!prevVirtualSelectedDate &&
    !!nextVirtualSelectedDate &&
    isSameDate(prevVirtualSelectedDate, nextVirtualSelectedDate)
  );
});

export const EventCardMonthlyView: React.FC<EventCardProps> = ({ ...props }) => {
  return <MemoizedEventCard {...props} />;
};

export default EventCardMonthlyView;
