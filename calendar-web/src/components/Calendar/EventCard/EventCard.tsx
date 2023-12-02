import { motion, useAnimation, useMotionValue } from 'framer-motion';
import isEqual from 'lodash/isEqual';
import {
  AccentColor,
  CorrectedColorSelect,
  Icon,
  Icons,
  Portal,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { FC, RefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  DateTimeFormats,
  hourFormatParser,
  HourFormats,
  isTouchEvent,
  sendRNWebviewMsg,
  useCurrentUserEmailAliases,
  useTheme,
  useToast,
  useUserPreference
} from 'skiff-front-utils';
import { AttendeeStatus, EventUpdateType } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { useRequiredCurrentCalendarID } from '../../../apollo/currentCalendarMetadata';
import { EventDiffState, useSelectedEventState } from '../../../apollo/selectedEvent';
import { DAY_COLUMN_CONTAINER_ID, INDENTATION_SIZE } from '../../../constants';
import {
  ALL_DAY_EVENT_HEIGHT,
  CARD_CONTENT_MARGIN,
  HOUR_HEIGHT,
  MARK_HOURS_WIDTH,
  SNAP_SIZE,
  UNTITLED_EVENT
} from '../../../constants/calendar.constants';
import { FIVE_MIN_HEIGHT } from '../../../constants/calendar.constants';
import {
  DAY_UNIT,
  FIFTEEN_MIN,
  FIFTY_FIVE_MIN,
  FIRST_HOUR_IN_DAY,
  FIVE_MIN,
  FORTY_FIVE_MIN,
  FORTY_MIN,
  HOURS_IN_DAY,
  LAST_HOUR_IN_DAY,
  MINUTES_IN_HOUR,
  MINUTE_UNIT,
  SECONDS_IN_MIN
} from '../../../constants/time.constants';
import { CalendarRef } from '../../../redux/reducers/calendarReducer';
import {
  DraggingData,
  initialEventDraggingData,
  sharedEventDraggingReducer
} from '../../../redux/reducers/sharedEventDraggingReducer';
import { DecryptedDraftModel } from '../../../storage/models/draft/DecryptedDraftModel';
import { getDraftByID, saveDraft } from '../../../storage/models/draft/modelUtils';
import { saveDraftToEvent } from '../../../storage/models/draft/utils';
import { getEventByID } from '../../../storage/models/event/modelUtils';
import { UpdateEventArgs } from '../../../storage/models/event/types';
import { getAllDayEventCardWidth } from '../../../styles';
import {
  abbreviateHourFormat,
  canUserEditEvent,
  dateToFormatString,
  dayjs,
  finishEditDraftWithSaveDraftModal,
  getAttendeeFromCalendarID,
  getHourTop,
  hasStartTimeChanged,
  shouldShowSaveDraftModal,
  getTimeHeight,
  useAppSelector,
  handleVirtualizedRecurrenceAndSelectEvent
} from '../../../utils';
import {
  calculateNewEndStartWithOffsets,
  calculateNewStartTimeWithOffsets,
  getEventCardHeight,
  roundY
} from '../../../utils/dragFunctionsUtils';
import { useScrollToSelectedEvent } from '../../../utils/hooks/useScrollToSelectedEvent';
import { useSelectedEvent, useSelectedEventID } from '../../../utils/hooks/useSelectedEvent';
import { isRecurringEvent, isRecurringParent } from '../../../utils/recurringUtils';
import { markEventAsNeedToSendContentMail } from '../../../utils/sync/icsUtils';
import { EventInfoEmitter, EventInfoEmitterEvents } from '../../EventInfo';
import { EventOptions } from '../EventOptions';
import { OptionsDropdownTargetInfo } from '../EventOptions/EventOptionsDropdown';
import { CalculatedEvent } from '../types';
import { useEventClick } from '../useEventClick';
import {
  CONFIRMED_EVENT_CARD_CSS,
  MAYBE_EVENT_CARD_CSS,
  PENDING_OR_DECLINED_EVENT_CARD_CSS,
  StyledEventCardText
} from '../views/styles';
import { useIsPastEvent } from '../views/useIsPastEvent';
import { CALENDAR_BG_COLOR } from '../views/views.constants';

import DragContainer, { DragType } from './DragContainer';
import { useMotionEventStyles } from './useMotionEventStyles';

const InvalidEventIcon = styled.div`
  display: inline-block !important;
  margin-right: 3px;
  width: 16px;
  height: 0px;
  position: relative;
`;

const MAX_COLUMN_HEIGHT = HOURS_IN_DAY * HOUR_HEIGHT;
const SCROLL_SPEED = SNAP_SIZE * 2;
const SCROLL_INTERVAL = 25;

/**
 * we need to make the icon absolute because they are inside text elements (to handle long text overlap)
 * so we put them in 0 height (see `InvalidEventIcon`) container and place them in the middle of the row manually
 */
const FloatingWarningIcon = styled.div`
  position: absolute;
  top: -13px;
  left: 0px;
`;

const EventContainer = styled.div<{
  $bgColor: string;
  $color: AccentColor;
  $indentation: number;
  $isDragged: boolean;
  $isFaded: boolean;
  $left: number;
  $themeMode: ThemeMode;
  $width: number;
  $isGhost?: boolean;
  // If the event is <= 30 min
  $isCompact?: boolean;
  $isDarkMode?: boolean;
  $isDraggingToCreate?: boolean;
  $isSelected?: boolean;
  $isPendingOrDeclined?: boolean;
  $isMaybe?: boolean;
  $isAllDay?: boolean;
  $isLastDayInAllDayEvent: boolean;
}>`
  position: absolute;

  ${({ $isAllDay, $isDragged, $isLastDayInAllDayEvent, $left, $width, $indentation }) => {
    const allDayWidth = getAllDayEventCardWidth($width, $isLastDayInAllDayEvent);
    if ($isDragged) {
      const draggedWidth = $isAllDay ? allDayWidth : `100%`;
      return `
        left: 0px;
        width: ${draggedWidth};
      `;
    }
    const nonDraggedWidth = $isAllDay
      ? allDayWidth
      : `calc((100% - ${$indentation * INDENTATION_SIZE}px) * ${$width});`;
    return `
      left: calc(100% * ${$left});
      width: ${nonDraggedWidth};
      margin-left: ${$indentation * INDENTATION_SIZE}px;
    `;
  }}

  // Dark mode does not render linear gradient colors
  border: ${({ $isDarkMode, $isDraggingToCreate }) =>
    !$isDraggingToCreate ? `1px solid ${$isDarkMode ? 'rgb(31, 31, 31)' : 'var(--bg-l3-solid)'}` : `none`};

  box-sizing: border-box;
  border-radius: 4px;

  padding: ${(props) => (props.$isCompact ? '0 0 0 8px' : '8px 0 8px 8px')};

  transition: 0.1s padding-top;
  z-index: 5;
  overflow: hidden;

  ${(props) =>
    (props.$isCompact || props.$isAllDay) &&
    `
      display: flex;
      align-items: center;
    `}

  ${({ $isGhost, $isDragged }) => ($isGhost ? `opacity: 0.6;` : `z-index: ${$isDragged ? 10 : 6};`)}

  ${({ $isSelected }) => $isSelected && `z-index: 7;`}

  ${({ $isMaybe, $isPendingOrDeclined }) => {
    if ($isMaybe) return MAYBE_EVENT_CARD_CSS;
    if ($isPendingOrDeclined) return PENDING_OR_DECLINED_EVENT_CARD_CSS;
    return CONFIRMED_EVENT_CARD_CSS;
  }}

  &:hover {
    cursor: pointer;
  }
`;

const CardText = styled.div<{ $isNotAttending: boolean }>`
  ${({ $isNotAttending }) => $isNotAttending && `text-decoration: line-through;`};
`;

const MotionEvent = motion(EventContainer);

const EventBorder = styled.div<{ $event: CalculatedEvent }>`
  border: 1px solid ${(props) => CorrectedColorSelect[`var(--accent-${props.$event.event.color}-primary)`]};
  border-radius: 4px;
  z-index: 7;
  position: absolute;
  width: ${(props) =>
    props.$event.event.decryptedContent.isAllDay ? `calc(100% * ${props.$event.width} - 12px);` : `100%`};
  transition: 0s all;
`;

const MotionEventBorder = motion(EventBorder);

const DragContainerContainer = styled.div<{ isCompact?: boolean }>`
  height: ${(props) => (props.isCompact ? String(FIFTEEN_MIN) + 'px' : '100%')};
  width: calc(100% - ${CARD_CONTENT_MARGIN}px);
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 6;
`;

const dateStyles = css<{ $isSelected: boolean }>`
  font-weight: 300;
  color: ${({ $isSelected }) => ($isSelected ? 'var(--text-inverse)' : 'var(--text-disabled)')};
`;

const InlineDate = styled.span<{ $isSelected: boolean }>`
  ${dateStyles}
  ::before {
    content: ' ';
    word-spacing: 1px;
  }
`;

const getSplitFormat = (format: HourFormats) => {
  const isFullFormat = format.includes('H');
  // prepend day
  const extendDayFormat = `ddd, ${format}` as DateTimeFormats;
  // append AM/PM if not part of format already
  const extendDayMeridianFormat = (
    !extendDayFormat.includes('A') && !isFullFormat ? `${extendDayFormat} A` : extendDayFormat
  ) as DateTimeFormats;
  return extendDayMeridianFormat;
};

const getEventFormattedDate = (isSplit: boolean, date: number, format: HourFormats, timezone?: string) =>
  isSplit
    ? dateToFormatString(timezone ? dayjs(date).tz(timezone) : dayjs(date), getSplitFormat(format))
    : dateToFormatString(timezone ? dayjs(date).tz(timezone) : dayjs(date), format);

interface MotionEventStyles {
  top: number;
  height: number;
  x: number;
}
export interface EventCardProps {
  calculatedEvent: CalculatedEvent;
  userTimezone?: string;
  isDragging: boolean;
  allDayTopOffset?: number;
  allDaySectionRef?: CalendarRef;
  bgColor?: string;
  columnRef?: RefObject<HTMLDivElement>;
}

export const EventCardComponent: FC<EventCardProps> = ({
  calculatedEvent,
  isDragging,
  userTimezone,
  allDayTopOffset,
  allDaySectionRef,
  bgColor: bgColorProp,
  columnRef
}) => {
  const {
    parentEventID,
    // Display values are used for multi-day events
    displayStartDate,
    displayEndDate,
    isSplitDisplayEvent,
    isLastDisplayedEvent,
    isFirstDisplayedEvent
  } = calculatedEvent.event;
  const { endDate: calcEndDate, startDate: calcStartDate } = calculatedEvent.event.plainContent;
  const { title, isAllDay, attendees } = calculatedEvent.event.decryptedContent;

  const [holdDragDates, setHoldDragDates] = useState<null | { start: number; end: number }>(null);

  useEffect(() => {
    setHoldDragDates(null);
  }, [calcEndDate, calcStartDate]);

  // Redux
  const dispatch = useDispatch();
  const { dragType, yOffsets, xOffset } = useAppSelector((state) =>
    isDragging ? state.eventDragging.draggingData : initialEventDraggingData
  );

  const { draggedEventID, isDraggedFirstDisplayedEvent, isDraggedLastDisplayedEvent } = useAppSelector(
    (state) => state.eventDragging.draggedEventData
  );

  const calendarRef = useAppSelector((state) => state.calendar.calendarRef);
  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);

  // Refs
  const eventCardRef = useRef<HTMLDivElement>(null);
  const previousCalculatedDates = useRef({ startDate: calcStartDate, endDate: calcEndDate, oldTimezone: userTimezone }); // Used to determine when to calculate event card position again
  const scrollInterval = useRef<NodeJS.Timeout | undefined>(); // to hold the reference to the scroll interval

  // Custom Hooks
  const animationControls = useAnimation();
  const { enqueueToast } = useToast();
  const { theme } = useTheme();
  const calendarID = useRequiredCurrentCalendarID();
  const { setSelectedEventID, clearSelectedEvent } = useSelectedEvent();
  const selectedEventID = useSelectedEventID();

  const scrollToSelectedEvent = useScrollToSelectedEvent();
  const onSelectEvent = useEventClick(calculatedEvent.event, isDragging);

  const { diffMap } = useSelectedEventState();
  const eventIsNew = diffMap?.diffState === EventDiffState.New;

  const isPastEvent = useIsPastEvent(calculatedEvent.event);

  // Memoized values
  const calcEventStartDate = useMemo(() => dayjs(displayStartDate).tz(userTimezone), [displayStartDate, userTimezone]);
  const calcEventEndDate = useMemo(() => dayjs(displayEndDate).tz(userTimezone), [displayEndDate, userTimezone]);

  // State
  const [displayedCalcStartDate, setDisplayedCalcStartDate] = useState(calcStartDate); // Value set in useEffect below as well
  const [displayedCalcEndDate, setDisplayedCalcEndDate] = useState(calcEndDate); // Value set in useEffect below as well
  const [leftDragOffset, setLeftDragOffset] = useState(0);
  const [scrolledOffset, setScrolledOffset] = useState(0); // scrolled offset so far
  const { emailAliases: aliases } = useCurrentUserEmailAliases();

  const isOtherDisplayedEventDragging =
    isSplitDisplayEvent &&
    draggedEventID === calculatedEvent.event.parentEventID &&
    (isDraggedFirstDisplayedEvent !== isFirstDisplayedEvent || isDraggedLastDisplayedEvent !== isLastDisplayedEvent);

  const daySnapWidth = ((calendarRef?.current?.getBoundingClientRect().width || 0) - MARK_HOURS_WIDTH) / 7;
  const isDarkMode = theme === ThemeMode.DARK;
  const currentUserAttendee = getAttendeeFromCalendarID(calendarID, attendees);
  // The event has other attendees if there is at least one non-deleted attendee that is not the current user
  const hasOtherAttendees = attendees.some((attendee) => !attendee.deleted && attendee !== currentUserAttendee);
  const canEdit = !!currentUserAttendee && canUserEditEvent(currentUserAttendee);

  // Don't allow drag for non-selected events that need to prompt the user to send update emails
  const canDrag = canEdit && (selectedEventID === parentEventID || !shouldShowSaveDraftModal(calendarID));

  const baseTop = isAllDay ? allDayTopOffset || 0 : getHourTop(calcEventStartDate);

  const eventDuration = getHourTop(calcEventEndDate) - getHourTop(calcEventStartDate);

  // we indicate that an event being DTC when the start and end date are the same
  const isDraggingZeroTimedEvent = calcStartDate === calcEndDate && !isAllDay && isDragging;
  const isDraggingToCreateEvent = isDraggingZeroTimedEvent && eventIsNew;

  // Min height for event
  let baseHeight = eventDuration > FIFTEEN_MIN ? eventDuration : FIFTEEN_MIN;

  // if the event is being dragged to create, we want the min-height to be 0 so while DTC the event is invisible in the
  // user crosses its initial point of creation.
  baseHeight = isDraggingZeroTimedEvent ? 0 : baseHeight;

  // all day events should have a fixed height regardless of their actual height
  baseHeight = (!isAllDay ? baseHeight : ALL_DAY_EVENT_HEIGHT) - 1;

  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  const [userStartDayOfTheWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const selectedHourFormat = userHourFormat ? hourFormatParser(userHourFormat) : HourFormats.Long;
  // More event options -- ie delete, copy event
  const [optionsDropdownTarget, setOptionsDropdownTarget] = useState<OptionsDropdownTargetInfo>({
    x: 0,
    y: 0,
    isOpen: false
  });
  /**
   * Update displayed dates if:
   *   1. There are no more offsets (item was dropped, use new event values)
   *   2. Item is being dragged and offsets exist (use calculated times with offsets)
   */
  useEffect(() => {
    if (!yOffsets && !xOffset) {
      setDisplayedCalcStartDate(calcStartDate);
      setDisplayedCalcEndDate(calcEndDate);
      return;
    }
    if (!isDragging && !isMobile) return;
    const startDate = calculateNewStartTimeWithOffsets(
      calcStartDate,
      { top: roundY(yOffsets.top), bottom: roundY(yOffsets.bottom) },
      xOffset,
      daySnapWidth
    );
    const endDate = calculateNewEndStartWithOffsets(
      calcEndDate,
      { top: roundY(yOffsets.top), bottom: roundY(yOffsets.bottom) },
      xOffset,
      daySnapWidth
    );
    setDisplayedCalcStartDate(startDate);
    setDisplayedCalcEndDate(endDate);
    // Using this so we don't get include daySnapWidth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yOffsets, xOffset, calcStartDate, calcEndDate, isDragging]);

  const updateDragState = useCallback(
    (newDragType: DragType, newOffsets: { xOffset?: DraggingData['xOffset']; yOffsets?: DraggingData['yOffsets'] }) => {
      const shouldUpdateHorizontal = newOffsets.xOffset && xOffset !== newOffsets.xOffset;
      const shouldUpdateVertical =
        (newOffsets.yOffsets &&
          (yOffsets.top !== newOffsets.yOffsets.top || yOffsets.bottom !== newOffsets.yOffsets.bottom)) ||
        newDragType !== DragType.All;
      if (!shouldUpdateHorizontal && !shouldUpdateVertical && newDragType === dragType) return;
      dispatch(
        sharedEventDraggingReducer.actions.updateEventDragState({
          dragType: newDragType,
          xOffset: newOffsets.xOffset,
          yOffsets: newOffsets.yOffsets
        })
      );
    },
    [xOffset, yOffsets.top, yOffsets.bottom, dragType, dispatch]
  );

  const triggerFeedback = () => {
    sendRNWebviewMsg('triggerHapticFeedback', { hapticType: 'selection' });
    void animationControls.start(
      isMobile
        ? {
            scale: [1, 1.05, 1],
            transition: {
              duration: 0.25,
              type: 'spring'
            }
          }
        : {}
    );
  };

  /**
   * Calculates the height overflow by
   * 1. checking if the top is negative, if it is then that is the overflow
   * 2. getting the bottom boundary of the card
   * and subtracting from it the maximum column height.
   * Note: If the output is negative, then there is no overflow.
   */
  const calculateHeightOverflow = useCallback(
    (top: number) => {
      if (top < 0) {
        return Math.abs(top);
      }
      const eventBottomBoundary = top + baseHeight;
      const heightOverflow = eventBottomBoundary - MAX_COLUMN_HEIGHT;
      return Math.max(heightOverflow, 0);
    },
    [baseHeight]
  );

  const { getMotionEventStyles, calculateBoundedX } = useMotionEventStyles({
    calculatedEvent,
    isDragging,
    dragType,
    baseHeight,
    baseTop,
    maxHeight: getTimeHeight(calcEndDate - calcStartDate),
    yOffsets,
    xOffset,
    daySnapWidth,
    leftDragOffset,
    userStartDayOfTheWeek,
    allDayTopOffset,
    allDaySectionRef,
    calculateHeightOverflow
  });

  const updateEventOnDragEnd = async (updates: UpdateEventArgs) => {
    // get the event from the DB
    const event = await getEventByID(parentEventID);
    // get the draft for the event from the DB, if exists
    let draft = await getDraftByID(parentEventID);

    // if no draft and no event - throw error, impossible situation
    if (!event && !draft) {
      console.error('Unable to drag event: No event in DB');
      enqueueToast({ title: 'Could not update event', body: 'Try saving the event again.' });
      return;
    }

    // create draft if needed
    if (!draft && event) {
      draft = DecryptedDraftModel.fromDecryptedEvent(event);
    }

    if (!draft) {
      console.error('Unable to drag event: couldnt create draft');
      enqueueToast({ title: 'Could not update event', body: 'Try saving the event again.' });
      return;
    }

    // reset attendees status if needed
    if (hasStartTimeChanged(draft, updates)) {
      // This checks that the non draft instance of the event is not a recurring event
      if (!event || !isRecurringEvent(event)) {
        if (isRecurringParent(draft) && updates.plainContent?.startDate)
          draft.plainContent.recurrenceRule = new RecurrenceRule({
            ...draft.plainContent.recurrenceRule,
            startDate: updates.plainContent.startDate
          });
      }
      draft.resetAttendeesRsvpStatus();
    }

    // update the draft with the drag updates
    draft.updateWithPartialDetails(updates, [EventUpdateType.Content]);

    // save the draft with the drag changes
    await saveDraft(draft);

    // reset drag state
    updateDragState(DragType.None, { xOffset, yOffsets });
    dragY.set(0);
    dragX.set(0);

    // when on mobile automatically update the attendees on changes because the event info is not opened
    if (isMobile) {
      void markEventAsNeedToSendContentMail(selectedEventID);
      await saveDraftToEvent(draft.parentEventID);
      if (hasOtherAttendees) enqueueToast({ title: 'Update sent', body: 'Guests have been updated.' });
      return;
    }

    // update the event info times
    EventInfoEmitter.emit(EventInfoEmitterEvents.UpdateFromDB);
  };

  const [motionEventStyles, setMotionEventStyles] = useState<MotionEventStyles | undefined>(
    getMotionEventStyles(false)
  );

  const updateMotionEventStyles = (newMotionStyles: MotionEventStyles | undefined) => {
    setMotionEventStyles((motionStyles) => {
      if (isEqual(motionStyles, newMotionStyles)) {
        return motionStyles;
      }
      return newMotionStyles;
    });
  };

  const [borderMotionEventStyles, setBorderMotionEventStyles] = useState<MotionEventStyles | undefined>(
    getMotionEventStyles(true)
  );

  const updateBorderMotionEventStyles = (newMotionStyles: MotionEventStyles | undefined) => {
    setBorderMotionEventStyles((motionStyles) => {
      if (isEqual(motionStyles, newMotionStyles)) {
        return motionStyles;
      }
      return newMotionStyles;
    });
  };

  const onDragEnd = (e: DragEvent) => {
    dispatch(
      sharedEventDraggingReducer.actions.setDraggedEvent({
        eventID: null
      })
    );

    setScrolledOffset(0);

    if (dragType === DragType.None) return;
    setLeftDragOffset(0);
    updateMotionEventStyles(getMotionEventStyles(true));
    e.stopPropagation();
    const startDate = calculateNewStartTimeWithOffsets(
      calcStartDate,
      { top: roundY(yOffsets.top), bottom: roundY(yOffsets.bottom) },
      calculateBoundedX(xOffset, true),
      daySnapWidth
    );
    const endDate = calculateNewEndStartWithOffsets(
      calcEndDate,
      { top: roundY(yOffsets.top), bottom: roundY(yOffsets.bottom) },
      calculateBoundedX(xOffset, true),
      daySnapWidth
    );

    switch (dragType) {
      case DragType.Bottom:
        if (endDate === calcEndDate) return;
        setHoldDragDates({
          start: calcStartDate,
          end: endDate
        });
        void updateEventOnDragEnd({ plainContent: { endDate } });
        break;
      case DragType.Top:
        if (startDate === calcStartDate) return;
        setHoldDragDates({
          start: startDate,
          end: calcEndDate
        });
        void updateEventOnDragEnd({ plainContent: { startDate } });
        break;
      case DragType.All:
        if (startDate === calcStartDate && endDate === calcEndDate) return;
        setHoldDragDates({
          start: startDate,
          end: endDate
        });
        void updateEventOnDragEnd({ plainContent: { startDate, endDate } });
        break;
    }

    if (isMobile) {
      clearSelectedEvent();
    }
  };
  /**
   * Select current event card
   * and creates a draft for recurrence if needed
   */
  const setSelectedEventAndHandleVirtualizedRecurrence = useCallback(async () => {
    await handleVirtualizedRecurrenceAndSelectEvent(calculatedEvent.event, setSelectedEventID);
  }, [calculatedEvent.event, setSelectedEventID]);

  const onDragStart = async (currDragType: DragType) => {
    // if the dragged event is not the selected event - save the selected event
    if (selectedEventID && selectedEventID !== parentEventID) {
      const saved = await finishEditDraftWithSaveDraftModal(selectedEventID, calendarID);
      if (!saved) return;
    }

    triggerFeedback();
    void (async () => {
      await setSelectedEventAndHandleVirtualizedRecurrence();
      dispatch(
        sharedEventDraggingReducer.actions.setDraggedEvent({
          eventID: calculatedEvent.event.parentEventID,
          initialDragType: currDragType,
          isFirst: calculatedEvent.event.isFirstDisplayedEvent,
          isLast: calculatedEvent.event.isLastDisplayedEvent
        })
      );
      setSelectedEventID(calculatedEvent.event.parentEventID, isSplitDisplayEvent && isLastDisplayedEvent);
      updateDragState(currDragType, { xOffset, yOffsets });
    })();
  };

  const onLongTouch = (e: MouseEvent | TouchEvent) => {
    const columnContainer = (e.target as HTMLDivElement).closest(`#${DAY_COLUMN_CONTAINER_ID}`);
    if (columnContainer) {
      setLeftDragOffset(
        (isTouchEvent(e) ? e.touches[0].clientX : e.clientX) - columnContainer.getBoundingClientRect().left
      );
    }
    triggerFeedback();
  };

  /**
   * Scrolls the event card whenever it is close to the vertical borders
   * Also moves the card using the offset so that it would stay on the cursor while scrolling
   */
  const getOffsetWithScroll = useCallback(
    (offset: number) => {
      // Factor in the already scrolled offset
      offset += scrolledOffset;

      const newCardTop = baseTop + offset;

      // get event card height below the calendar if exists
      const heightOverflow = calculateHeightOverflow(newCardTop);
      // get card height without the overflow
      const height = getEventCardHeight(baseHeight - heightOverflow);
      // Prevent the card to go further than 11:45pm while scrolling
      offset = Math.min(offset, MAX_COLUMN_HEIGHT - baseTop - height - FIVE_MIN_HEIGHT);

      // Prevent the card to go before 00:15 while scrolling
      offset = Math.max(offset, SNAP_SIZE - baseTop - getTimeHeight(calcEndDate - calcStartDate));
      return offset;
    },
    [scrolledOffset, baseTop, baseHeight, calcEndDate, calcStartDate, calculateHeightOverflow]
  );

  useEffect(() => {
    // if dragging started
    if (isDragging) {
      // start an interval to check if scrolling is needed
      scrollInterval.current = setInterval(() => {
        const calendarBoundaries = calendarRef?.current?.getBoundingClientRect();
        const cardBoundaries = eventCardRef.current?.getBoundingClientRect();

        if (cardBoundaries && calendarRef?.current && calendarBoundaries?.height) {
          // Checks if the calendar is scrolled all the way to bottom
          const isDoneScrollingDown =
            Math.abs(
              calendarRef.current.scrollTop + calendarRef.current.clientHeight - calendarRef.current.scrollHeight
            ) < 1;

          const isDoneScrollingUp = calendarRef.current.scrollTop > 0;

          // Check whether we should scroll up or down
          const shouldScrollDown = cardBoundaries.bottom > calendarBoundaries.bottom && !isDoneScrollingDown;
          const shouldScrollUp = cardBoundaries.top - MINUTES_IN_HOUR < calendarBoundaries.top && isDoneScrollingUp;

          // scroll and update offset
          if (shouldScrollDown) {
            calendarRef.current.scrollTop += SCROLL_SPEED; // scroll
            setScrolledOffset((s) => s + SCROLL_SPEED);
            dragY.set(dragY.get() + SCROLL_SPEED); // move card to cursor
          } else if (shouldScrollUp) {
            calendarRef.current.scrollTop -= SCROLL_SPEED; // scroll
            setScrolledOffset((s) => s - SCROLL_SPEED);
            dragY.set(dragY.get() - SCROLL_SPEED); // move card to cursor
          }
        }
      }, SCROLL_INTERVAL);
    } else {
      // if dragging stopped, clear the interval
      clearInterval(scrollInterval.current);
      scrollInterval.current = undefined;
    }

    // cleanup function
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
        scrollInterval.current = undefined;
      }
    };
  }, [isDragging, scrolledOffset, setScrolledOffset, calendarRef, eventCardRef, dragY]);

  useEffect(() => {
    const unregisterY = dragY.onChange((offset) => {
      if (dragType === DragType.None) return;

      const roundedY = roundY(offset);

      offset = getOffsetWithScroll(offset); // add scrolling offset

      switch (dragType) {
        case DragType.All:
          updateDragState(dragType, { yOffsets: { top: offset, bottom: offset } });
          break;
        case DragType.Top:
          updateDragState(dragType, {
            yOffsets: {
              top: baseHeight - roundedY <= SNAP_SIZE ? baseHeight - SNAP_SIZE + 1 : roundedY,
              bottom: 0
            }
          });
          break;
        case DragType.Bottom:
          updateDragState(dragType, {
            yOffsets: {
              top: 0,
              bottom: baseHeight + roundedY <= SNAP_SIZE ? -baseHeight + SNAP_SIZE - 1 : roundedY
            }
          });
          break;
      }
    });

    return () => {
      unregisterY();
    };
  }, [baseHeight, dragType, dragY, updateDragState]);

  useEffect(() => {
    const unregisterX = dragX.onChange((offset) => {
      updateDragState(DragType.All, { xOffset: calculateBoundedX(offset, false) });
    });

    return () => {
      unregisterX();
    };
  }, [calculateBoundedX, dragX, updateDragState]);

  // If offsets change, update styles accordingly. Used when dragging AND when event is updated elsewhere (e.g. sidebar or timezone in settings)
  useEffect(() => {
    if (
      isDragging ||
      previousCalculatedDates.current.startDate !== calcStartDate ||
      previousCalculatedDates.current.endDate !== calcEndDate ||
      previousCalculatedDates.current.oldTimezone !== userTimezone
    ) {
      updateMotionEventStyles(getMotionEventStyles(false));
      updateBorderMotionEventStyles(getMotionEventStyles(true));
      previousCalculatedDates.current.startDate = calcStartDate;
      previousCalculatedDates.current.endDate = calcEndDate;
    }
  }, [getMotionEventStyles, isDragging, calcStartDate, calcEndDate, userTimezone]);

  useEffect(() => {
    if (isAllDay) {
      updateMotionEventStyles(getMotionEventStyles(false));
      updateBorderMotionEventStyles(getMotionEventStyles(true));
    }
  }, [allDayTopOffset, isAllDay, getMotionEventStyles]);

  const startWithDragHold = holdDragDates ? holdDragDates.start : displayedCalcStartDate;
  let endWithDragHold = holdDragDates ? holdDragDates.end : displayedCalcEndDate;
  if (isDraggingToCreateEvent && startWithDragHold === endWithDragHold) {
    // Show a 15 minute event if the start and end drag are the same
    endWithDragHold += dayjs.duration(SNAP_SIZE, MINUTE_UNIT).asMilliseconds();
  }

  // It is here not in DayColumn so that it would scroll on event creation
  useEffect(() => scrollToSelectedEvent(), [scrollToSelectedEvent]);

  const getMultiDayStyles = (lastSplitEventBoundary: number, firstSplitEventBoundary: number) => {
    // Check if the rendered card is < boundary and part of a multi-day
    return (
      isSplitDisplayEvent &&
      // End of multi-day event
      ((isLastDisplayedEvent &&
        calcEventEndDate.hour() === FIRST_HOUR_IN_DAY &&
        calcEventEndDate.minute() <= lastSplitEventBoundary) ||
        // Beginning of multi-day event
        (isFirstDisplayedEvent &&
          calcEventStartDate.hour() === LAST_HOUR_IN_DAY &&
          calcEventStartDate.minute() >= firstSplitEventBoundary))
    );
  };

  const isInlinedMultiDay = getMultiDayStyles(FORTY_FIVE_MIN, FIFTEEN_MIN);
  const isCompactMultiDay = getMultiDayStyles(FIFTY_FIVE_MIN, FIVE_MIN);

  const durationInSecs = (endWithDragHold - startWithDragHold) / 1000;
  const origDurationInSecs = (displayEndDate - displayStartDate) / 1000;

  const inlineAndCompactThreshold = FORTY_MIN;

  const isInlineDateFromDuration = (seconds: number) => {
    return seconds < SECONDS_IN_MIN * inlineAndCompactThreshold || isAllDay || isInlinedMultiDay;
  };

  const isInlineDate = isInlineDateFromDuration(durationInSecs);
  const isOrigInlineDate = isInlineDateFromDuration(origDurationInSecs);

  const isCompactFromDuration = (seconds: number) => {
    return seconds <= SECONDS_IN_MIN * inlineAndCompactThreshold || isCompactMultiDay;
  };

  const isCompact = isCompactFromDuration(durationInSecs);
  const isOrigCompact = isCompactFromDuration(origDurationInSecs);
  const isLastDayInAllDayEvent = calcEventEndDate.isSame(selectedViewDate, DAY_UNIT);

  // Original dates displayed in Ghost event
  const formattedOriginalStartDate = getEventFormattedDate(
    isSplitDisplayEvent,
    calcStartDate,
    abbreviateHourFormat(calcStartDate, selectedHourFormat, userTimezone, calcEndDate, userHourFormat),
    userTimezone
  );
  const formattedOriginalEndDate = getEventFormattedDate(
    isSplitDisplayEvent,
    calcEndDate,
    abbreviateHourFormat(calcEndDate, selectedHourFormat, undefined, undefined, userHourFormat),
    userTimezone
  );
  const formattedOriginalDate = `${formattedOriginalStartDate} - ${formattedOriginalEndDate}`;

  // Current dates, displayed as event is dragged
  const formattedStartDate = getEventFormattedDate(
    isSplitDisplayEvent,
    startWithDragHold,
    abbreviateHourFormat(startWithDragHold, selectedHourFormat, userTimezone, endWithDragHold, userHourFormat),
    userTimezone
  );
  const formattedEndDate = getEventFormattedDate(
    isSplitDisplayEvent,
    endWithDragHold,
    abbreviateHourFormat(endWithDragHold, selectedHourFormat, userTimezone, undefined, userHourFormat),
    userTimezone
  );
  const formattedDate = `${formattedStartDate} - ${formattedEndDate}`;

  const isSelected = selectedEventID === parentEventID || isDragging;
  const isDeclinedResponse = !!currentUserAttendee && currentUserAttendee.attendeeStatus === AttendeeStatus.No;
  // Events you decline are styled like a pending event
  const isPendingOrDeclinedResponse =
    (currentUserAttendee && currentUserAttendee.attendeeStatus === AttendeeStatus.Pending) || isDeclinedResponse;
  const isMaybeResponse = currentUserAttendee && currentUserAttendee.attendeeStatus === AttendeeStatus.Maybe;

  const isFaded = isPastEvent && !isSelected;
  const eventTextColor = isSelected && !isPendingOrDeclinedResponse ? 'inverse' : calculatedEvent.event.color;

  const getDateText = useMemo(() => {
    const DateText = (isOriginal: boolean) => {
      if (isAllDay) return;
      isOriginal = isOriginal && !isDraggingToCreateEvent;
      // Use original dates for ghost date as event is dragged
      const formattedDateToDisplay = isOriginal ? formattedOriginalDate : formattedDate;
      const useInlineDate = isOriginal ? isOrigInlineDate : isInlineDate;
      return useInlineDate ? (
        <InlineDate $isSelected={isSelected && !isPendingOrDeclinedResponse}>{formattedDateToDisplay}</InlineDate>
      ) : (
        <Typography color={eventTextColor} mono size={TypographySize.SMALL} wrap>
          {formattedDateToDisplay}
        </Typography>
      );
    };
    return DateText;
    // disabled because it flickers when dragging on create if we include isDraggingToCreateEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eventTextColor,
    formattedDate,
    formattedOriginalDate,
    isAllDay,
    isInlineDate,
    isOrigInlineDate,
    isPendingOrDeclinedResponse,
    isSelected
  ]);

  // will be true if the user's attendee have an invalid alias
  const invalidAlias = currentUserAttendee && !(aliases || []).includes(currentUserAttendee.email);

  // Need div within Typography to prevent ellipsis
  const renderCardContent = useMemo(() => {
    const CardContent = (useOriginal: boolean) => {
      const currDurationInSecs = useOriginal ? origDurationInSecs : durationInSecs;
      const isHourOrLonger = currDurationInSecs >= MINUTES_IN_HOUR * SECONDS_IN_MIN;
      return (
        <StyledEventCardText
          $isFaded={isFaded}
          color={eventTextColor}
          selectable={false}
          size={TypographySize.SMALL}
          weight={TypographyWeight.MEDIUM}
          wrap={isHourOrLonger && !isAllDay}
        >
          <CardText $isNotAttending={isDeclinedResponse}>
            {invalidAlias && (
              <InvalidEventIcon>
                <FloatingWarningIcon>
                  <Icons color={eventTextColor} icon={Icon.Warning} size={Size.MEDIUM} />
                </FloatingWarningIcon>
              </InvalidEventIcon>
            )}
            {title.length ? title : UNTITLED_EVENT}
            {getDateText(useOriginal)}
          </CardText>
        </StyledEventCardText>
      );
    };
    return CardContent;
  }, [
    eventTextColor,
    getDateText,
    invalidAlias,
    isAllDay,
    isDeclinedResponse,
    isFaded,
    title,
    durationInSecs,
    origDurationInSecs
  ]);

  if (!currentUserAttendee || startWithDragHold > endWithDragHold) return null;

  const onRightClick = (e: React.MouseEvent) => {
    setOptionsDropdownTarget({
      x: e.clientX,
      y: e.clientY,
      isOpen: true
    });
  };

  const bgColor = bgColorProp ?? CALENDAR_BG_COLOR[theme].default;
  const shouldDragContainerBeFullHeight = isCompact || isInlineDate;

  return (
    <>
      {dragType === DragType.All && <MotionEventBorder $event={calculatedEvent} style={borderMotionEventStyles} />}
      {(isDragging || isOtherDisplayedEventDragging) && !isDraggingToCreateEvent && !eventIsNew && (
        <MotionEvent
          $bgColor={bgColor}
          $color={calculatedEvent.event.color}
          $indentation={calculatedEvent.indentation}
          $isAllDay={isAllDay}
          $isCompact={isOrigCompact}
          $isDarkMode={isDarkMode}
          $isDragged={false}
          $isDraggingToCreate={isDraggingToCreateEvent}
          $isFaded={isFaded}
          $isGhost
          $isLastDayInAllDayEvent={isLastDayInAllDayEvent}
          $left={calculatedEvent.left}
          $themeMode={theme}
          $width={calculatedEvent.width}
          className='ghost-event-card'
          style={{
            top: baseTop,
            height: baseHeight
          }}
        >
          {renderCardContent(true)}
        </MotionEvent>
      )}
      {!isOtherDisplayedEventDragging && (
        <MotionEvent
          $bgColor={bgColor}
          $color={calculatedEvent.event.color}
          $indentation={calculatedEvent.indentation}
          $isAllDay={isAllDay}
          $isCompact={!isMobile && !isDragging ? isOrigCompact : isCompact}
          $isDarkMode={isDarkMode}
          $isDragged={isDragging}
          $isDraggingToCreate={isDraggingToCreateEvent}
          $isFaded={isFaded}
          $isLastDayInAllDayEvent={isLastDayInAllDayEvent}
          $isMaybe={isMaybeResponse}
          $isPendingOrDeclined={isPendingOrDeclinedResponse}
          $isSelected={isSelected}
          $left={calculatedEvent.left}
          $themeMode={theme}
          $width={calculatedEvent.width}
          animate={animationControls}
          className='event-card'
          id={`${parentEventID}${isSplitDisplayEvent && isLastDisplayedEvent ? '_last' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            void onSelectEvent();
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isMobile) return;
            void onSelectEvent();
            onRightClick(e);
          }}
          onMouseDown={(e) => {
            // on DTC feature we don't want to propagate the event to the the weekly view
            // if user is trying to DTC over an event
            e.stopPropagation();
            e.preventDefault();
          }}
          ref={eventCardRef}
          style={motionEventStyles}
        >
          <DragContainerContainer isCompact={isCompact && !isAllDay}>
            {isFirstDisplayedEvent && !isMobile && !isAllDay && (
              <DragContainer
                canDrag={canDrag}
                constraintsRef={columnRef}
                currentDragType={dragType}
                dragY={dragY}
                duration={durationInSecs}
                eventCardRef={eventCardRef}
                onDragEnd={onDragEnd}
                onDragStart={(props) => void onDragStart(props)}
                onLongTouch={onLongTouch}
                shouldDragContainerBeFullHeight={shouldDragContainerBeFullHeight}
                type={DragType.Top}
              />
            )}
            <DragContainer
              canDrag={canDrag}
              constraintsRef={columnRef}
              currentDragType={dragType}
              dragX={dragX}
              dragY={dragY}
              duration={durationInSecs}
              eventCardRef={eventCardRef}
              onDragEnd={onDragEnd}
              onDragStart={(props) => void onDragStart(props)}
              onLongTouch={onLongTouch}
              shouldDragContainerBeFullHeight={shouldDragContainerBeFullHeight}
              type={DragType.All}
            />
            {isLastDisplayedEvent && !isMobile && !isAllDay && (
              <DragContainer
                canDrag={canEdit}
                constraintsRef={columnRef}
                currentDragType={dragType}
                dragY={dragY}
                duration={durationInSecs}
                eventCardRef={eventCardRef}
                onDragEnd={onDragEnd}
                onDragStart={(props) => void onDragStart(props)}
                onLongTouch={onLongTouch}
                shouldDragContainerBeFullHeight={isCompact}
                type={DragType.Bottom}
              />
            )}
          </DragContainerContainer>
          {renderCardContent(!isMobile && !isDragging)}
        </MotionEvent>
      )}
      <Portal>
        <EventOptions
          canEdit={canEdit}
          dropdownAnchor={{ x: optionsDropdownTarget.x, y: optionsDropdownTarget.y }}
          dropdownBtnRef={eventCardRef}
          eventID={parentEventID}
          isOpen={optionsDropdownTarget.isOpen}
          onClose={() => {
            setOptionsDropdownTarget((target) => ({ ...target, isOpen: false }));
          }}
        />
      </Portal>
    </>
  );
};

export const EventCard = memo(EventCardComponent, (prev, next) => {
  const {
    calculatedEvent: nextCalculatedEvent,
    userTimezone: nextUserTimezone,
    isDragging: nextIsDragging,
    allDayTopOffset: nextAllDayTopOffset,
    allDaySectionRef: nextAllDaySectionRef,
    columnRef: nextColumnRef,
    bgColor: nextBgColor
  } = next;

  const {
    calculatedEvent: prevCalculatedEvent,
    userTimezone: prevUserTimezone,
    isDragging: prevIsDragging,
    allDayTopOffset: prevAllDayTopOffset,
    allDaySectionRef: prevAllDaySectionRef,
    columnRef: prevColumnRef,
    bgColor: prevBgColor
  } = prev;

  // Remove parentEventId from comparison because it is always randomly generated
  const nextEvent = { ...nextCalculatedEvent, event: { ...nextCalculatedEvent.event, parentEventID: undefined } };
  const prevEvent = { ...prevCalculatedEvent, event: { ...prevCalculatedEvent.event, parentEventID: undefined } };

  return (
    prevUserTimezone === nextUserTimezone &&
    prevIsDragging === nextIsDragging &&
    prevAllDayTopOffset === nextAllDayTopOffset &&
    prevAllDaySectionRef === nextAllDaySectionRef &&
    prevColumnRef === nextColumnRef &&
    JSON.stringify(nextEvent) === JSON.stringify(prevEvent) &&
    prevBgColor === nextBgColor
  );
});

export default EventCard;
