import React, { FC, RefObject, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  FeedbackModal,
  BrowserDesktopView,
  useTheme,
  QrCodeModal,
  lazyWithPreload,
  useUserPreference
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { CALENDAR_CONTAINER_BG_COLOR, MARK_HOURS_WIDTH } from '../../constants/calendar.constants';
import { DAYS_IN_WEEK } from '../../constants/time.constants';
import { calendarReducer, CalendarRef } from '../../redux/reducers/calendarReducer';
import { modalReducer } from '../../redux/reducers/modalReducer';
import { CalendarModalType } from '../../redux/reducers/modalTypes';
import store from '../../redux/store/reduxStore';
import { useSync } from '../../storage/useSync';
import {
  getHourTopMobile,
  getUserGuessedTimeZone,
  getWeekStartAndEndDates,
  useAppSelector,
  useLocalSetting
} from '../../utils';
import { sendFeedback } from '../../utils/feedbackUtils';
import { useCalendarMaintenance } from '../../utils/hooks/CalendarMaintenance/useCalendarMaintenance';
import { useFetchEvents } from '../../utils/hooks/useFetchEvents';
import useICSEmailSender from '../../utils/hooks/useICSEmailSender';
import { CalendarLogoutModal } from '../modals';
import DiscardEventChangesModal from '../modals/DiscardEventChangesModal';

import { CalendarBody } from './CalendarBody';
import { useBindSelectedTimeToUrl } from './useBindSelectedTimeToUrl';
import { useFetchEventsAroundCurrentTime } from './useFetchEventsAroundCurrentTime';
import useSyncCurrentTime from './useSyncCurrentTime';
import WebHeader from './WebHeader';

const SaveDraftModal = lazyWithPreload(() => import('../modals/SaveDraftModal'));
const MobileHeader = lazyWithPreload(() => import('./MobileHeader'));

const CalendarContainer = styled.div`
  height: 100%;
  --scale-mark-width: ${MARK_HOURS_WIDTH}px;

  position: relative;

  overflow-y: ${isMobile ? 'hidden' : 'auto'};
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  background-color: ${CALENDAR_CONTAINER_BG_COLOR};

  ${isMobile
    ? `
    display: flex;
    flex-direction: column;
    height: 100vh;
  `
    : ''}
`;

const StickyHeaderContainer = styled.div`
  position: sticky;
  top: 0px;
  left: 0px;
  z-index: 99;
`;

const Calendar: FC = () => {
  // State
  const [isMiniMonthOpen, setIsMiniMonthOpen] = useState(false);

  // Refs
  const calendarRef: CalendarRef = useRef(null);
  const viewRefs = useRef<(RefObject<HTMLDivElement> | null)[]>([null, null, null]);
  const mobileScrollTopRef = useRef<number>(getHourTopMobile(store.getState().time.currentTime)); // Initial scroll top should be current hour

  // Custom hooks
  const { theme } = useTheme();
  const [localStartDay] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const { timedEventsInView, allDayEventsInView } = useFetchEvents();

  // Redux
  const dispatch = useDispatch();
  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);
  const openModal = useAppSelector((state) => state.modal.openModal);

  const timeZone = userPreferredTimezone ?? getUserGuessedTimeZone();
  const { weekStartDate } = useMemo(
    () => getWeekStartAndEndDates(selectedViewDate, localStartDay, timeZone),
    [selectedViewDate, localStartDay, timeZone]
  );

  useEffect(() => {
    dispatch(calendarReducer.actions.setCalendarRef(calendarRef));
  }, [dispatch]);

  useEffect(() => {
    void Promise.all([SaveDraftModal.preload(), MobileHeader.preload()]);
  }, []);

  useSync();
  useICSEmailSender();
  useSyncCurrentTime();
  useCalendarMaintenance();
  useFetchEventsAroundCurrentTime();
  useBindSelectedTimeToUrl();

  const closeOpenModal = () => {
    dispatch(modalReducer.actions.setOpenModal(undefined));
  };

  const renderCurrentModal = () => {
    switch (openModal?.type) {
      case CalendarModalType.QrCode:
        return (
          <QrCodeModal
            buttonProps={openModal.buttonProps}
            description={openModal.description}
            link={openModal.link}
            onClose={closeOpenModal}
            open
            theme={theme}
            title={openModal.title}
          />
        );
      case CalendarModalType.Feedback:
        return <FeedbackModal onClose={closeOpenModal} open sendFeedback={sendFeedback} />;
      case CalendarModalType.Logout:
        return <CalendarLogoutModal isOpen />;
      case CalendarModalType.SaveDraft:
        return (
          <Suspense fallback={<></>}>
            <SaveDraftModal isOpen />
          </Suspense>
        );
      case CalendarModalType.DiscardEventChanges:
        return <DiscardEventChangesModal isOpen onClose={closeOpenModal} />;
      default:
        return null;
    }
  };

  return (
    <CalendarContainer ref={calendarRef}>
      <StickyHeaderContainer>
        <BrowserDesktopView>
          <WebHeader allDayEventsInView={allDayEventsInView} daysToShow={DAYS_IN_WEEK} firstDay={weekStartDate} />
        </BrowserDesktopView>
        <MobileView>
          <Suspense fallback={<></>}>
            <MobileHeader
              allDayEventsInView={allDayEventsInView}
              daysToShow={1}
              firstDay={weekStartDate}
              isMiniMonthOpen={isMiniMonthOpen}
              scrollRef={mobileScrollTopRef}
              setIsMiniMonthOpen={setIsMiniMonthOpen}
              timedEventsInView={timedEventsInView}
              viewRefs={viewRefs}
            />
          </Suspense>
        </MobileView>
      </StickyHeaderContainer>
      <CalendarBody
        allDayEventsInView={allDayEventsInView}
        isMiniMonthOpen={isMiniMonthOpen}
        localStartDay={localStartDay}
        mobileScrollTopRef={mobileScrollTopRef}
        timedEventsInView={timedEventsInView}
        viewRefs={viewRefs}
        weekStartDate={weekStartDate}
      />
      {renderCurrentModal()}
    </CalendarContainer>
  );
};

export default Calendar;
