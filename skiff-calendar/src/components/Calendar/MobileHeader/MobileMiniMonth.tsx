import range from 'lodash/range';
import { IconText, Size, TypographyWeight } from 'nightwatch-ui';
import React, { useCallback } from 'react';
import { DAY_UNIT, DatePicker, DatePickerEvent, getDatePickerHeight, useUserPreference } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import {
  CALENDAR_CONTAINER_BG_COLOR,
  MOBILE_WEEK_VIEW_HEADER_VERTICAL_PADDING
} from '../../../constants/calendar.constants';
import { DAYS_IN_MONTH } from '../../../constants/time.constants';
import { DecryptedDraft } from '../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../storage/models/event/types';
import { useAppSelector } from '../../../utils';
import { useCurrentCalendarView } from '../../../utils/hooks/useCalendarView';
import { useGetDayEvents } from '../../../utils/hooks/useGetDayEvents';
import { useGetDayIndexInView } from '../../../utils/hooks/useGetDayIndexInView';
import { useGetMonthViewStartAndEndDates } from '../../../utils/hooks/useGetMonthViewStartAndEndDates';
import { useGetVirtualSelectedDate } from '../../../utils/hooks/useGetVirtualSelectedDate';
import useJumpToDate from '../../../utils/hooks/useJumpToDate';
import ChronometricVirtualizedDisplay from '../views/ChronometricVirtualizedDisplay';
import { getSortedAllDayEvents, getSortedTimedEvents } from '../views/MonthlyView/MonthlyView.utils';

export const SHOW_DATE_PICKER_HEADER = false;
export const VIEW_FULL_MONTH_BUTTON_HEIGHT = 30;

const ViewFullMonthButton = styled.div`
  display: flex;
  justify-content: center;
  height: ${VIEW_FULL_MONTH_BUTTON_HEIGHT}px;
  padding: ${MOBILE_WEEK_VIEW_HEADER_VERTICAL_PADDING}px 0;
`;

const DatePickerContainer = styled.div`
  height: ${getDatePickerHeight(true, SHOW_DATE_PICKER_HEADER)}px;
`;

interface MobileMiniMonthProps {
  allDayEventsInView: DecryptedDraft[][];
  monthIndex: number;
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
  collapse: () => void;
}

const MobileMiniMonth: React.FC<MobileMiniMonthProps> = ({
  allDayEventsInView,
  monthIndex,
  timedEventsInView,
  collapse
}) => {
  const [defaultCalendarColor] = useUserPreference(StorageTypes.DEFAULT_CALENDAR_COLOR);

  const { jumpToDate } = useJumpToDate();
  const { setCurrCalendarView } = useCurrentCalendarView();

  const getDayIndexInView = useGetDayIndexInView();
  const getDayEvents = useGetDayEvents(timedEventsInView);
  const getMonthViewStartAndEndDates = useGetMonthViewStartAndEndDates();
  const getVirtualSelectedDate = useGetVirtualSelectedDate();

  const actualSelectedDate = useAppSelector((state) => state.time.selectedViewDate);

  const slideRenderer = useCallback(
    (virtualIndex: number, disableRender: boolean) => {
      if (disableRender) return;
      // Since month rendering is dependent on the selected view date
      // and since the selected view date is not updated until we are done swiping,
      // we get virtual selected dates for the previous and next months which are then passed to the date picker
      // in order to correctly render them when swiping starts
      const virtualSelectedDate = getVirtualSelectedDate(virtualIndex);
      const selectedDate = virtualSelectedDate ?? actualSelectedDate;

      // Displayed start date for the current month slide
      const monthStartDate = getMonthViewStartAndEndDates(selectedDate).monthStartDate;

      const datePickerEvents: DatePickerEvent[] = range(DAYS_IN_MONTH).map((dayIndex) => {
        const currentDayDate = monthStartDate.add(dayIndex, DAY_UNIT);

        // Get all-day events for curr day
        const currDayAllDayEventsIndex = getDayIndexInView(currentDayDate);
        const currDayAllDayEvents = allDayEventsInView[currDayAllDayEventsIndex] ?? [];
        // Sort all-day events by duration then by title
        const sortedCurrDayAllDayEvents = getSortedAllDayEvents(currDayAllDayEvents);
        // Parse to date picker events
        const parsedAllDayEvents: DatePickerEvent['events'] =
          sortedCurrDayAllDayEvents.map((event) => ({
            color: event.decryptedPreferences?.color ?? defaultCalendarColor
          })) ?? [];

        // Get timed events for curr day
        const currDayTimedEvents = getDayEvents(currentDayDate).filter((event) => event.isFirstDisplayedEvent);
        // Sort timed events by start time then by title
        const sortedCurrDayTimedEvents = getSortedTimedEvents(currDayTimedEvents);
        // Parse to date picker events
        const parsedTimedEvents: DatePickerEvent['events'] = sortedCurrDayTimedEvents.map((event) => ({
          color: event.color
        }));
        return {
          date: currentDayDate,
          events: [...parsedAllDayEvents, ...parsedTimedEvents]
        };
      });

      return (
        <DatePicker
          bgColor={CALENDAR_CONTAINER_BG_COLOR}
          datePickerEvents={datePickerEvents}
          onSelectDate={(newSelectedDate) => {
            jumpToDate(newSelectedDate);
            collapse();
          }}
          selectedDate={selectedDate}
          showHeader={SHOW_DATE_PICKER_HEADER}
        />
      );
    },
    [
      actualSelectedDate,
      allDayEventsInView,
      collapse,
      defaultCalendarColor,
      getDayEvents,
      getDayIndexInView,
      getMonthViewStartAndEndDates,
      getVirtualSelectedDate,
      jumpToDate
    ]
  );

  return (
    <div>
      <DatePickerContainer>
        <ChronometricVirtualizedDisplay
          index={monthIndex}
          itemWidth={window.innerWidth}
          onIndexChange={(newIndex) => {
            // Swiping left / right updates the selected day to first day in the next / previous month
            jumpToDate(getVirtualSelectedDate(newIndex));
          }}
          slideRenderer={slideRenderer}
        />
      </DatePickerContainer>
      <ViewFullMonthButton>
        <IconText
          color='secondary'
          label='View full month'
          onClick={() => {
            setCurrCalendarView(CalendarView.Monthly);
            collapse();
          }}
          size={Size.SMALL}
          weight={TypographyWeight.REGULAR}
        />
      </ViewFullMonthButton>
    </div>
  );
};

export default MobileMiniMonth;
