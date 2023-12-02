import dayjs from 'dayjs';
import { RefObject, useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import { StorageTypes } from 'skiff-utils';

import { ALL_DAY_SNAP_SIZE, FIVE_MIN_HEIGHT, HOUR_HEIGHT, SNAP_SIZE } from '../../../constants/calendar.constants';
import { DAYS_IN_WEEK, HOURS_IN_DAY } from '../../../constants/time.constants';
import { CalendarRef } from '../../../redux/reducers/calendarReducer';
import { DraggingData } from '../../../redux/reducers/sharedEventDraggingReducer';
import { getUserGuessedTimeZone, useLocalSetting } from '../../../utils';
import { getEventCardHeight } from '../../../utils/dragFunctionsUtils';
import { CalculatedEvent } from '../types';

import { DragType } from './DragContainer';

const MAX_COLUMN_HEIGHT = HOURS_IN_DAY * HOUR_HEIGHT;

interface MotionEventStylesArgs {
  calculatedEvent: CalculatedEvent;
  isDragging: boolean;
  dragType: DragType;
  baseHeight: number;
  maxHeight: number;
  baseTop: number;
  yOffsets: DraggingData['yOffsets'];
  xOffset: DraggingData['xOffset'];
  daySnapWidth: number;
  leftDragOffset: number;
  userStartDayOfTheWeek: number;
  allDayTopOffset?: number;
  allDaySectionRef?: CalendarRef;
  eventCardRef?: RefObject<HTMLDivElement>;
  calculateHeightOverflow: (top: number) => number;
}
export const useMotionEventStyles = (motionEventStylesArgs: MotionEventStylesArgs) => {
  const {
    calculatedEvent,
    isDragging,
    dragType,
    baseHeight,
    maxHeight,
    baseTop,
    yOffsets,
    xOffset,
    daySnapWidth,
    allDayTopOffset = 0,
    leftDragOffset,
    userStartDayOfTheWeek,
    allDaySectionRef,
    calculateHeightOverflow
  } = motionEventStylesArgs;
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const timeZone = userPreferredTimezone ?? getUserGuessedTimeZone();

  const { isFirstDisplayedEvent, isLastDisplayedEvent, isSplitDisplayEvent } = calculatedEvent.event;
  const { isAllDay } = calculatedEvent.event.decryptedContent;
  const calculateBoundedX = useCallback(
    (offset: number, isBorder: boolean) => {
      // getting the location of the event relative to the user start of the week day
      const eventDay =
        (dayjs(calculatedEvent.event.displayStartDate).tz(timeZone).day() - userStartDayOfTheWeek + DAYS_IN_WEEK) %
        DAYS_IN_WEEK;
      const rightBoundary = !isMobile ? DAYS_IN_WEEK - eventDay - 1 : 0;
      let boundedOffsetX = isBorder ? daySnapWidth * Math.floor((offset + leftDragOffset) / daySnapWidth) : offset;
      const leftBoundary = !isMobile ? -eventDay * daySnapWidth : 1;
      if (boundedOffsetX <= leftBoundary) {
        boundedOffsetX = leftBoundary;
      } else if (boundedOffsetX > rightBoundary * daySnapWidth) {
        boundedOffsetX = rightBoundary * daySnapWidth;
      }
      return boundedOffsetX;
    },
    [calculatedEvent.event.displayStartDate, daySnapWidth, leftDragOffset, userStartDayOfTheWeek, timeZone]
  );

  const calculateBoundedYForAllDayEvents = useCallback(
    (offset: number) => {
      if (!allDaySectionRef || !allDaySectionRef.current || !isAllDay) return offset;
      const allDaySectionHeight = allDaySectionRef.current.getBoundingClientRect().height;
      const maxDown = allDaySectionHeight - allDayTopOffset - baseHeight;
      if (offset < -allDayTopOffset) return -allDayTopOffset; // trying to drag above top
      if (offset > maxDown) return maxDown; // trying to drag below bottom

      return offset;
    },
    [allDaySectionRef, allDayTopOffset, baseHeight, isAllDay]
  );

  const snapSize = isAllDay ? ALL_DAY_SNAP_SIZE : SNAP_SIZE;
  const roundY = useCallback((y: number) => snapSize * Math.round(y / snapSize), [snapSize]);
  const getMotionEventStyles = useCallback(
    (isBorder: boolean) => {
      switch (true) {
        case !isDragging && !isAllDay:
          return {
            top: baseTop,
            height: baseHeight,
            x: xOffset
          };
        case !isDragging:
          return { top: allDayTopOffset || 0, height: baseHeight, x: xOffset };
        case dragType === DragType.Top:
          return {
            top: isFirstDisplayedEvent ? baseTop + yOffsets.top : baseTop,
            height: isFirstDisplayedEvent ? baseHeight - yOffsets.top : baseHeight,
            x: xOffset
          };
        case dragType === DragType.Bottom:
          return {
            top: baseTop,
            height: isLastDisplayedEvent ? baseHeight + yOffsets.bottom : baseHeight,
            x: xOffset
          };
        case dragType === DragType.All && !isSplitDisplayEvent:
          let top =
            baseTop +
            (isBorder
              ? calculateBoundedYForAllDayEvents(roundY(yOffsets.top))
              : calculateBoundedYForAllDayEvents(yOffsets.top));

          const heightOverflow = calculateHeightOverflow(top);
          let height = getEventCardHeight(baseHeight - heightOverflow);

          top = Math.max(top, 0); // Top of the card can't overflow outside of the calendar from the top
          return {
            top: Math.min(top, MAX_COLUMN_HEIGHT - height - FIVE_MIN_HEIGHT), // Prevent card to go after 11:45
            height,
            x: isBorder ? calculateBoundedX(xOffset, true) : xOffset
          };
        case dragType === DragType.All && isFirstDisplayedEvent:
          top = baseTop + (isBorder ? roundY(yOffsets.top) : yOffsets.top);
          height = baseHeight - (isBorder ? roundY(yOffsets.top) : yOffsets.top);
          height = getEventCardHeight(height);
          top = Math.max(top, 0); // Top of the card can't overflow outside of the calendar from the top
          return {
            top: Math.min(top, MAX_COLUMN_HEIGHT - height - FIVE_MIN_HEIGHT), // Prevent card to go after 11:45
            height: Math.min(maxHeight, height), // Put full event duration height as maximum height
            x: isBorder ? calculateBoundedX(xOffset, true) : xOffset
          };
        case dragType === DragType.All && isLastDisplayedEvent:
          height = getEventCardHeight(baseHeight + (isBorder ? roundY(yOffsets.bottom) : yOffsets.bottom));
          const firstHalfHeight = maxHeight - baseHeight;
          top = baseTop + (isBorder ? roundY(yOffsets.bottom) : yOffsets.bottom) - firstHalfHeight;
          top = Math.max(top, 0); // Top of the card can't overflow outside of the calendar from the top
          return {
            top: maxHeight >= height ? baseTop : top, // stick until the card is separate than the first half
            height: Math.min(maxHeight, height), // Put full event duration height as maximum height
            x: isBorder ? calculateBoundedX(xOffset, true) : xOffset
          };
        case dragType === DragType.All:
          return {
            top: baseTop,
            height: baseHeight,
            x: isBorder ? calculateBoundedX(xOffset, true) : xOffset
          };
      }
    },
    [
      isDragging,
      isAllDay,
      dragType,
      baseTop,
      baseHeight,
      xOffset,
      allDayTopOffset,
      isFirstDisplayedEvent,
      yOffsets.top,
      yOffsets.bottom,
      isLastDisplayedEvent,
      isSplitDisplayEvent,
      roundY,
      calculateBoundedX,
      calculateBoundedYForAllDayEvents
    ]
  );

  return { getMotionEventStyles, calculateBoundedX };
};
