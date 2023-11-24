import { Dayjs } from 'dayjs';
import { IconButton, Icon, Size } from 'nightwatch-ui';
import React, { FC } from 'react';
import { MobileView, isMobile } from 'react-device-detect';
import { BrowserDesktopView } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import styled from 'styled-components';

import { CalendarDataTest, WEB_HEADER_HEIGHT } from '../../constants/calendar.constants';
import { DAYS_IN_WEEK } from '../../constants/time.constants';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';
import { useAppDispatch } from '../../utils/hooks/useAppDispatch';
import { useCurrentCalendarView } from '../../utils/hooks/useCalendarView';
import { useCreatePendingEvent } from '../../utils/hooks/useCreatePendingEvent';

import { MonthlyView, MobileMonthlyView } from './views/MonthlyView';
import { MobileWeeklyView, WeeklyView } from './views/WeeklyView';

const CalendarBodyContainer = styled.div<{ $fullHeight: boolean }>`
  flex: 1;
  ${(props) => props.$fullHeight && `height: calc(100% - ${WEB_HEADER_HEIGHT}px)`};
`;

const StyledMobileView = styled(MobileView)`
  height: 100%;
`;

const StyledBrowserDesktopView = styled(BrowserDesktopView)`
  height: 100%;
`;

const StyledIconButton = styled(IconButton)`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 12;
  width: 54px;
  height: 54px;
  border-radius: 100px;
  box-shadow: var(--shadow-l3);
`;

interface CalendarBodyProps {
  allDayEventsInView: DecryptedDraft[][];
  isMiniMonthOpen: boolean;
  localStartDay: number;
  mobileScrollTopRef: React.MutableRefObject<number>;
  timedEventsInView: (DecryptedEvent | DecryptedDraft)[];
  weekStartDate: Dayjs;
  viewRefs: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>;
}

export const CalendarBody: FC<CalendarBodyProps> = ({
  allDayEventsInView,
  isMiniMonthOpen,
  localStartDay,
  mobileScrollTopRef,
  timedEventsInView,
  weekStartDate,
  viewRefs
}) => {
  const dispatch = useAppDispatch();
  const { currCalendarView } = useCurrentCalendarView();

  const shouldCreateAllDayEvent = currCalendarView === CalendarView.Monthly;
  const createPendingEvent = useCreatePendingEvent(shouldCreateAllDayEvent);

  const openEventInfoDrawer = () => {
    dispatch(mobileDrawerReducer.actions.openDrawer(DrawerTypes.EventInfo));
  };

  const onCreateNewEventClick = async () => {
    await createPendingEvent();
    openEventInfoDrawer();
  };

  const renderMobileView = () => {
    switch (currCalendarView) {
      case CalendarView.Monthly:
        return <MobileMonthlyView allDayEventsInView={allDayEventsInView} timedEventsInView={timedEventsInView} />;
      case CalendarView.Weekly:
      default:
        return (
          <MobileWeeklyView
            isMiniMonthOpen={isMiniMonthOpen}
            scrollRef={mobileScrollTopRef}
            timedEventsInView={timedEventsInView}
            viewRefs={viewRefs}
          />
        );
    }
  };

  const renderDesktopView = () => {
    switch (currCalendarView) {
      case CalendarView.Monthly:
        return <MonthlyView allDayEventsInView={allDayEventsInView} timedEventsInView={timedEventsInView} />;
      case CalendarView.Weekly:
      default:
        return (
          <WeeklyView
            daysToShow={DAYS_IN_WEEK}
            firstDay={weekStartDate}
            firstDayShift={localStartDay}
            timedEventsInView={timedEventsInView}
          />
        );
    }
  };

  return (
    <CalendarBodyContainer $fullHeight={currCalendarView === CalendarView.Monthly && !isMobile}>
      <StyledMobileView>
        {renderMobileView()}
        <StyledIconButton
          dataTest={CalendarDataTest.newEventButton}
          icon={Icon.Plus}
          onClick={(e) => {
            e.stopPropagation();
            void onCreateNewEventClick();
          }}
          size={Size.LARGE}
        />
      </StyledMobileView>
      <StyledBrowserDesktopView>{renderDesktopView()}</StyledBrowserDesktopView>
    </CalendarBodyContainer>
  );
};
