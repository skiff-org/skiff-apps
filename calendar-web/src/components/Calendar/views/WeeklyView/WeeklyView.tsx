import { Dayjs } from 'dayjs';
import { useFlags } from 'launchdarkly-react-client-sdk';
import range from 'lodash/range';
import React, { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { getEnvironment, lazyWithPreload } from 'skiff-front-utils';
import { isSameDate } from 'skiff-front-utils';
import styled from 'styled-components';

import { DATE_UNIT, DAY_UNIT } from '../../../../constants/time.constants';
import { DecryptedDraft } from '../../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../../storage/models/event/types';
import { useAppSelector } from '../../../../utils';
import useDragToCreate from '../../../../utils/hooks/useDragToCreate';
import { useGetDayEvents } from '../../../../utils/hooks/useGetDayEvents';
import { DayColumn } from '../../DayColumn';
import ScaleMark from '../../ScaleMark';

const CalendarDebugger = lazyWithPreload(() => import('../../CalendarDebugger'));

const environment = getEnvironment(new URL(window.location.origin));

const WeeklyViewContainer = styled.div<{ $daysToShow: number }>`
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: var(--scale-mark-width) repeat(${({ $daysToShow }) => $daysToShow}, 1fr);
  position: relative;
  user-select: none;

  overflow-x: hidden;
  padding-bottom: constant(safe-area-inset-bottom); /* compatible with IOS < 11.2*/
  padding-bottom: env(safe-area-inset-bottom); /* compatible with IOS > = 11.2*/
`;

interface WeeklyViewProps {
  daysToShow: number;
  firstDay: Dayjs;
  firstDayShift?: number;
  viewRefs?: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>; // refs of all views other than center - only used on mobile
  viewIndex?: number; // index of current view in viewRefs
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
  disableRender?: boolean;
}

const WeeklyView: FC<WeeklyViewProps> = ({
  timedEventsInView,
  daysToShow,
  firstDay,
  viewIndex,
  viewRefs,
  disableRender = false
}) => {
  const featureFlags = useFlags();
  const debuggerFF = featureFlags.calendarDebugger as boolean;
  const showDebugger = !isMobile && (['local'].includes(environment) || debuggerFF);

  const { currentTime, selectedViewDate } = useAppSelector((state) => state.time);
  const frozenEventsIDs = useAppSelector((state) => state.event.frozenEventsIDs);

  const getDayEvents = useGetDayEvents(timedEventsInView);

  const props = useMemo(() => {
    return { firstDay, daysToShow };
  }, [firstDay, daysToShow]);

  useEffect(() => {
    void Promise.all([CalendarDebugger.preload()]);
  }, []);

  const { onMouseDown, onMouseMove, onMouseUpOrLeave } = useDragToCreate(props);
  const [scrollToCurrentTime, setScrollToCurrentTime] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile || !containerRef.current || !viewRefs?.current || viewIndex === undefined) return;
    // Update refs
    viewRefs.current[viewIndex] = containerRef;
  }, [viewIndex]);

  useEffect(() => {
    setScrollToCurrentTime(false);
  }, []);

  const getIsToday = useCallback(
    (value: number) => {
      if (isMobile) {
        return isSameDate(selectedViewDate, currentTime);
      }

      return isSameDate(firstDay.add(value, DAY_UNIT), currentTime);
    },
    [currentTime, firstDay, selectedViewDate]
  );

  const dayColumns = useMemo(() => {
    return range(daysToShow).map((value) => {
      const dayDate = firstDay.endOf(DATE_UNIT).add(value, DAY_UNIT);
      return {
        eventsForDay: getDayEvents(dayDate),
        isToday: getIsToday(value),
        isWeekend: [0, 6].includes(dayDate.day()),
        isScaleMarkColumn: value == 0,
        key: dayDate.toString()
      };
    });
  }, [daysToShow, firstDay, getDayEvents, getIsToday]);

  return (
    <>
      <WeeklyViewContainer
        $daysToShow={daysToShow}
        onMouseDown={onMouseDown}
        /* since leaving the weeklyView element will not
      register any more mouse moves we use mouseleave to finish the DTC action */
        onMouseLeave={onMouseUpOrLeave}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        ref={containerRef}
      >
        <ScaleMark />
        {dayColumns.map(({ eventsForDay, isToday, isWeekend, isScaleMarkColumn, key }) => (
          <DayColumn
            disableRender={disableRender}
            events={eventsForDay}
            frozenEventsIDs={frozenEventsIDs}
            isScaleMarkColumn={isScaleMarkColumn}
            isToday={isToday}
            isWeekend={isWeekend}
            key={key}
            shouldScrollToCurrentTime={scrollToCurrentTime}
          />
        ))}
      </WeeklyViewContainer>
      {showDebugger && (
        <Suspense fallback={<></>}>
          <CalendarDebugger />
        </Suspense>
      )}
    </>
  );
};

export default WeeklyView;
