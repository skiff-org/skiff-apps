import { Dayjs } from 'dayjs';
import { Icon, IconText, Icons, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { FC, useMemo } from 'react';
import { DateFormats, useUserPreference } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { CALENDAR_CONTAINER_BG_COLOR, MOBILE_TOP_BAR_Y_PADDING } from '../../../constants/calendar.constants';
import { MONTH_UNIT, WEEK_UNIT } from '../../../constants/time.constants';
import { DecryptedDraft } from '../../../storage/models/draft/types';
import { DecryptedEvent } from '../../../storage/models/event/types';
import { dateToFormatString, useAppSelector } from '../../../utils';
import { useCurrentCalendarView } from '../../../utils/hooks/useCalendarView';
import { dayjsToIndex, indexToDayjs, syncViewScroll } from '../../../utils/mobileDayViewUtils';
import { AllDayEvents } from '../AllDayEvents';

import MobileHeaderActions from './MobileHeaderActions';
import MobileMiniMonth from './MobileMiniMonth';
import WeekHeader from './WeekHeader';

const Wrapper = styled.div`
  background: ${CALENDAR_CONTAINER_BG_COLOR};
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${MOBILE_TOP_BAR_Y_PADDING}px 16px 16px;
`;

const DateContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const CalendarHeader = styled.div<{ $view: CalendarView }>`
  ${({ $view }) => $view === CalendarView.Weekly && 'border-bottom: 1px solid var(--border-secondary);'}
`;

interface MobileHeaderProps {
  allDayEventsInView: DecryptedDraft[][];
  daysToShow: number;
  firstDay: Dayjs;
  isMiniMonthOpen: boolean;
  scrollRef: React.MutableRefObject<number>;
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
  viewRefs: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>;
  setIsMiniMonthOpen: Dispatch<SetStateAction<boolean>>;
}

const MobileHeader: FC<MobileHeaderProps> = ({
  allDayEventsInView,
  daysToShow,
  firstDay,
  isMiniMonthOpen,
  scrollRef,
  timedEventsInView,
  viewRefs,
  setIsMiniMonthOpen
}) => {
  const { currCalendarView } = useCurrentCalendarView();
  const [userStartOfTheWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);

  const { selectedViewDate } = useAppSelector((state) => state.time);

  // Memoized values
  const monthIndex = useMemo(() => dayjsToIndex(selectedViewDate, MONTH_UNIT), [selectedViewDate]);
  const weekIndex = useMemo(
    () => dayjsToIndex(selectedViewDate, WEEK_UNIT, userStartOfTheWeek),
    [userStartOfTheWeek, selectedViewDate]
  );

  const firstDayOfSelectedMonth = indexToDayjs(monthIndex, MONTH_UNIT);
  // Hide mini month toggle in Weekly view
  const hideMiniMonth = currCalendarView !== CalendarView.Weekly;

  // Update scrollTop when changing month/week
  useEffect(() => {
    if (scrollRef.current) {
      // Initial scrollRef values is set in Calendar.tsx
      syncViewScroll(viewRefs, scrollRef.current);
    }
  }, [monthIndex, weekIndex, viewRefs, scrollRef]);

  const getDateHeadingLabel = () => (
    <DateContainer>
      <Typography size={TypographySize.H3} weight={TypographyWeight.BOLD}>
        {dateToFormatString(firstDayOfSelectedMonth, DateFormats.FullMonth)}
      </Typography>
      <Typography color='disabled' size={TypographySize.H3}>
        {dateToFormatString(firstDayOfSelectedMonth, DateFormats.FullYear)}
      </Typography>
    </DateContainer>
  );

  return (
    <Wrapper>
      <TopBar>
        <IconText
          disableHover
          endIcon={
            hideMiniMonth ? undefined : (
              <Icons color='secondary' icon={isMiniMonthOpen ? Icon.ChevronUp : Icon.ChevronDown} size={20} />
            )
          }
          label={getDateHeadingLabel()}
          noPadding
          onClick={hideMiniMonth ? undefined : () => setIsMiniMonthOpen(!isMiniMonthOpen)}
        />
        <MobileHeaderActions setIsMiniMonthOpen={setIsMiniMonthOpen} />
      </TopBar>
      <CalendarHeader $view={currCalendarView}>
        {!isMiniMonthOpen && (
          <WeekHeader monthIndex={monthIndex} scrollRef={scrollRef} viewRefs={viewRefs} weekIndex={weekIndex} />
        )}
        {isMiniMonthOpen && (
          <MobileMiniMonth
            allDayEventsInView={allDayEventsInView}
            collapse={() => setIsMiniMonthOpen(false)}
            monthIndex={monthIndex}
            timedEventsInView={timedEventsInView}
          />
        )}
      </CalendarHeader>
      {currCalendarView === CalendarView.Weekly && (
        <AllDayEvents allDayEventsInView={allDayEventsInView} daysToShow={daysToShow} firstDay={firstDay} />
      )}
    </Wrapper>
  );
};

export default MobileHeader;
