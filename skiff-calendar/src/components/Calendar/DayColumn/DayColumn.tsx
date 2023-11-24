import { Dayjs } from 'dayjs';
import range from 'lodash/range';
import { colors, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import React, { FC, memo, RefObject, useCallback, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useTheme } from 'skiff-front-utils';
import { hourFormatParser, useUserPreference } from 'skiff-front-utils';
import { HourFormats } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { DAY_COLUMN_CONTAINER_ID } from '../../../constants';
import { HOUR_HEIGHT, MARK_HOURS_MARGIN_RIGHT } from '../../../constants/calendar.constants';
import { FIRST_HOUR_IN_DAY, FIVE_MIN, HOURS_IN_DAY } from '../../../constants/time.constants';
import { getEventCardKey, dateToFormatString, getHourTop, useAppSelector, useLocalSetting } from '../../../utils';
import { EventCard } from '../EventCard';
import { DisplayEvent } from '../types';
import { isFrozen } from '../views/utils';
import { CALENDAR_BG_COLOR } from '../views/views.constants';

import { calculateEvents } from './utils';

const CURRENT_TIME_WIDTH = 66;

const HourCellContainer = styled.div<{ $bgColor: string }>`
  border-bottom: 1px solid var(--border-secondary);
  position: relative;
  box-sizing: border-box;
  height: ${HOUR_HEIGHT}px;
  background: ${({ $bgColor }) => $bgColor};
`;

interface HourCellProps {
  bgColor: string;
}

const HourCell: FC<HourCellProps> = ({ bgColor }: HourCellProps) => {
  return <HourCellContainer $bgColor={bgColor} />;
};

const DayColumnContainer = styled.div`
  border-left: 1px solid var(--border-secondary);
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
`;

const currTimeMarkerStyles = css`
  background-color: var(--border-active);
  border: 0.4px solid rgb(${colors['--white']});
  box-shadow: var(--shadow-l1);
`;

const TodayTimeMarker = styled.div`
  position: absolute;
  width: 100%;
  height: 2px;
  top: -1.4px;
  ${currTimeMarkerStyles}
`;

const NotTodayTimeMarker = styled.div<{ isDark: boolean }>`
  position: absolute;
  width: 100%;
  top: -0.4px;
  background-color: rgba(${(props) => colors[props.isDark ? '--white' : '--black']}, 0.36);
  border: 0.4px solid transparent;
`;

const TodayLeftTimeMarker = styled.div`
  position: absolute;
  width: 2px;
  height: 8px;
  border-radius: 5px;

  transform: translateY(-50%);
  ${currTimeMarkerStyles}
`;

const CurrentTimeMarker = styled.div<{ $currentTime: Dayjs }>`
  position: absolute;
  top: ${(props) => getHourTop(props.$currentTime)}px;
  height: 1px;
  width: calc(100% - 1px);
  z-index: 7;
  ${!isMobile ? `scroll-margin: ${-2 * HOUR_HEIGHT}px` : ''}
`;

const TodayTimeMarkerSpacer = styled.div`
  position: absolute;
  left: 1px;
  top: -1px;
  height: 2px;
  width: 2px;
  background-color: var(--border-active);
`;

const EventsColumnContainer = styled.div`
  position: absolute;
  height: 100%;
  width: calc(100% - 12px);
  top: 0;
  left: 0;
`;

const CurrentTimeContainer = styled.div<{ $currentTime: Dayjs; $isTheFirstFiveMinsInADay: boolean }>`
  position: absolute;
  top: ${(props) => (props.$isTheFirstFiveMinsInADay ? Math.ceil(props.$currentTime.minute() / 2) * -2 : '-8')}px;
  width: ${CURRENT_TIME_WIDTH}px;
  justify-content: flex-end;
  display: flex;
  background: var(--bg-l2-solid);
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  left: ${-CURRENT_TIME_WIDTH - MARK_HOURS_MARGIN_RIGHT}px;
`;

interface DayColumnProps {
  isToday: boolean;
  isWeekend?: boolean;
  events: DisplayEvent[];
  isScaleMarkColumn: boolean;
  shouldScrollToCurrentTime: boolean;
  frozenEventsIDs: string[];
}

interface DayColumnComponentProps extends DayColumnProps {
  columnRef?: RefObject<HTMLDivElement>;
}

const DayColumnComponent: FC<DayColumnComponentProps> = ({
  isWeekend,
  isToday,
  events,
  isScaleMarkColumn,
  shouldScrollToCurrentTime,
  columnRef
}) => {
  // Redux
  const currentTime = useAppSelector((state) => state.time.currentTime);
  const firstFiveMinsInCurrentDay = currentTime.hour(FIRST_HOUR_IN_DAY).minute(FIVE_MIN);
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  const { theme } = useTheme();

  const format: HourFormats = userHourFormat ? hourFormatParser(userHourFormat) : HourFormats.Long;

  const { draggedEventID, isDraggedFirstDisplayedEvent, isDraggedLastDisplayedEvent } = useAppSelector(
    (state) => state.eventDragging.draggedEventData
  );
  const currentEvents = calculateEvents(events);

  // Local settings
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);

  const currentTimeRef = useRef<HTMLDivElement>(null);

  const scrollToCurrentTime = useCallback(() => {
    // Scroll to current time on desktop
    // On mobile we scroll to current time a different way, because it breaks the swipe animation (https://linear.app/skiff/issue/PROD-2141/day-swiping-is-jittery-and-sometimes-stops-on-middle-of-days)
    // see syncViewScroll in MobileDayView
    if (currentTimeRef.current && !isMobile) {
      currentTimeRef.current?.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'auto'
      });
    }
  }, []);

  useEffect(() => {
    if (shouldScrollToCurrentTime) scrollToCurrentTime();
  }, [scrollToCurrentTime, shouldScrollToCurrentTime]);

  const { default: defaultBg, faded: fadedBg } = CALENDAR_BG_COLOR[theme];
  const bgColor = isWeekend ? fadedBg : defaultBg;
  const currentTimeString = dateToFormatString(
    userPreferredTimezone ? currentTime.tz(userPreferredTimezone) : currentTime,
    format
  );

  return (
    <>
      {range(HOURS_IN_DAY).map((value) => (
        <HourCell bgColor={bgColor} key={value} />
      ))}
      <CurrentTimeMarker $currentTime={currentTime} ref={currentTimeRef}>
        {isScaleMarkColumn && (
          <CurrentTimeContainer
            $currentTime={currentTime}
            $isTheFirstFiveMinsInADay={currentTime < firstFiveMinsInCurrentDay}
          >
            <Typography color='secondary' mono size={TypographySize.SMALL}>
              {currentTimeString}
            </Typography>
          </CurrentTimeContainer>
        )}
        {isToday && (
          <>
            <TodayTimeMarker />
            <TodayLeftTimeMarker />
            <TodayTimeMarkerSpacer />
          </>
        )}
        {!isToday && <NotTodayTimeMarker isDark={theme === ThemeMode.DARK} />}
      </CurrentTimeMarker>
      <EventsColumnContainer>
        {currentEvents &&
          currentEvents.map((calculatedEvent) => (
            <EventCard
              bgColor={bgColor}
              calculatedEvent={calculatedEvent}
              columnRef={columnRef}
              isDragging={
                draggedEventID === calculatedEvent.event.parentEventID &&
                // Check if it is the correct dragged displayed event
                (!calculatedEvent.event.isSplitDisplayEvent ||
                  (isDraggedFirstDisplayedEvent === calculatedEvent.event.isFirstDisplayedEvent &&
                    isDraggedLastDisplayedEvent === calculatedEvent.event.isLastDisplayedEvent))
              }
              key={getEventCardKey(calculatedEvent.event)}
              userTimezone={userPreferredTimezone}
            />
          ))}
      </EventsColumnContainer>
    </>
  );
};

const MemoizedDayColumn = memo(DayColumnComponent, (prev, next) => {
  const {
    events: nextEvents,
    frozenEventsIDs: nextFrozenEventsIDs,
    isToday: nextIsToday,
    isWeekend: nextIsWeekend,
    isScaleMarkColumn: nextIsScaleMarkColumn
  } = next;

  const { isToday: prevIsToday, isWeekend: prevIsWeekend, isScaleMarkColumn: prevIsScaleMarkColumn } = prev;

  if (isFrozen(nextEvents, nextFrozenEventsIDs)) return true;

  // Remove parentEventId from comparison because it is always randomly generated
  const prevEventsWithoutId = prev.events.map(({ parentEventID: removedID, ...event }) => event);
  const nextEventsWithoutId = nextEvents.map(({ parentEventID: removedID, ...event }) => event);

  return (
    prevIsToday === nextIsToday &&
    prevIsWeekend === nextIsWeekend &&
    JSON.stringify(prevEventsWithoutId) === JSON.stringify(nextEventsWithoutId) &&
    prevIsScaleMarkColumn === nextIsScaleMarkColumn
  );
});

interface DayColumnContainerProps extends DayColumnProps {
  disableRender: boolean;
}

export const DayColumn: FC<DayColumnContainerProps> = ({ disableRender, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <DayColumnContainer id={DAY_COLUMN_CONTAINER_ID} ref={ref}>
      {disableRender ? null : <MemoizedDayColumn columnRef={ref} {...props} />}
    </DayColumnContainer>
  );
};
