import React, { useEffect, useMemo } from 'react';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { DAY_UNIT } from '../../../../constants/time.constants';
import { eventReducer } from '../../../../redux/reducers/eventReducer';
import { timeReducer } from '../../../../redux/reducers/timeReducer';
import { DecryptedDraft } from '../../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../../storage/models/event/types';
import { getUserGuessedTimeZone, useAppDispatch, useAppSelector, useLocalSetting } from '../../../../utils';
import { dayjsToIndex, indexToDayjs, syncViewScroll } from '../../../../utils/mobileDayViewUtils';
import ChronometricVirtualizedDisplay from '../ChronometricVirtualizedDisplay';

import WeeklyView from './WeeklyView';

const MobileDaySliderWrapper = styled.div`
  height: 100%;
`;

/**
 * Called when ChronometricVirtualizedDisplay needs to render a slide
 * @param newIndex The index to render
 * @param currentIndex The current focused index
 * @param viewRefs refs of all views
 * @returns weekview component
 */
const slideRenderer = (
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[],
  newIndex: number,
  currentIndex: number,
  viewRefs: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>,
  timeZone: string,
  disableRender: boolean
) => {
  const firstDay = indexToDayjs(newIndex, DAY_UNIT, timeZone);
  const viewIndex = currentIndex + 1 - newIndex;
  return (
    <WeeklyView
      daysToShow={1}
      disableRender={disableRender}
      firstDay={firstDay}
      timedEventsInView={timedEventsInView}
      viewIndex={viewIndex}
      viewRefs={viewRefs}
    />
  );
};

interface MobileWeeklyViewProps {
  isMiniMonthOpen: boolean;
  scrollRef: React.MutableRefObject<number>;
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
  viewRefs: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>;
}

const MobileWeeklyView = ({ isMiniMonthOpen, scrollRef, timedEventsInView, viewRefs }: MobileWeeklyViewProps) => {
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const timeZone = userPreferredTimezone ?? getUserGuessedTimeZone();
  const { selectedViewDate } = useAppSelector((state) => state.time);
  const dispatch = useAppDispatch();

  const removeSelectedEvent = () => {
    dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));
  };

  const dateIndex = useMemo(() => dayjsToIndex(selectedViewDate, DAY_UNIT), [selectedViewDate]);

  // Update scrollTop when changing date
  useEffect(() => {
    if (scrollRef.current) {
      // Initial scrollRef values is set in Calendar.tsx
      syncViewScroll(viewRefs, scrollRef.current);
    }
  }, [dateIndex]);

  return (
    <MobileDaySliderWrapper onTouchStart={removeSelectedEvent}>
      <ChronometricVirtualizedDisplay
        disableTransition={isMiniMonthOpen}
        index={dateIndex}
        itemWidth={window.innerWidth}
        onIndexChange={(newIndex) => {
          scrollRef.current = viewRefs.current[1]?.current?.scrollTop || 0;
          dispatch(timeReducer.actions.setSelectedViewDate(indexToDayjs(newIndex, DAY_UNIT, timeZone)));
        }}
        onSwipeStart={() => syncViewScroll(viewRefs)}
        slideRenderer={(newIndex, disableRender) =>
          slideRenderer(timedEventsInView, newIndex, dateIndex, viewRefs, timeZone, disableRender)
        }
      />
    </MobileDaySliderWrapper>
  );
};

export default MobileWeeklyView;
