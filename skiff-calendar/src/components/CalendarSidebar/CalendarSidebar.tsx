import { Icon, MouseEvents, useOnClickOutside, useOnEscapePress, OPTION_MENU_CLASSNAME } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ActionSidebarItemProps, SettingsSection, Sidebar, SidebarSectionProps } from 'skiff-front-utils';
import { DatePicker, TabPage } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import styled from 'styled-components';

import { SIDEBAR_WIDTH } from '../../constants';
import {
  NEW_EVENT_BTN_CLASSNAME,
  SIDEBAR_CLICK_OUTSIDE_EXCLUDED_CLASSES,
  SIDEBAR_ID,
  ESCAPE_SELECTOR,
  CalendarDataTest,
  NEW_EVENT_BTN_LABEL
} from '../../constants/calendar.constants';
import { modalReducer } from '../../redux/reducers/modalReducer';
import { CalendarModal, CalendarModalType } from '../../redux/reducers/modalTypes';
import { useAppSelector } from '../../utils';
import { useCurrentCalendarView } from '../../utils/hooks/useCalendarView';
import { useCreatePendingEvent } from '../../utils/hooks/useCreatePendingEvent';
import useJumpToDate from '../../utils/hooks/useJumpToDate';
import { useSelectedEventID, useSelectedEvent } from '../../utils/hooks/useSelectedEvent';
import { useOpenSettings } from '../CalendarSettings/useOpenCloseSettings';
import { EventInfo } from '../EventInfo';

import AppSwitcher from './AppSwitcher';

const StyledDatePicker = styled(DatePicker)`
  padding: 0 6px 20px 6px;
`;

export const CalendarSidebar: React.FC = () => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch();
  const setOpenModal = (modal: CalendarModal) => dispatch(modalReducer.actions.setOpenModal(modal));

  const { jumpToDate } = useJumpToDate();
  const { saveDraftAndCloseEventInfo } = useSelectedEvent();
  const selectedEventID = useSelectedEventID();
  const openSettings = useOpenSettings();
  const { currCalendarView } = useCurrentCalendarView();

  // Whether event info is being updated after the user tabbed out of a field
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const shouldCreateAllDayEvent = currCalendarView === CalendarView.Monthly;
  const createPendingEvent = useCreatePendingEvent(shouldCreateAllDayEvent);
  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);

  const primaryActions: ActionSidebarItemProps[] = [
    {
      label: NEW_EVENT_BTN_LABEL,
      icon: Icon.Plus,
      onClick: () => void createPendingEvent(),
      primaryAction: true,
      className: NEW_EVENT_BTN_CLASSNAME,
      dataTest: CalendarDataTest.newEventButton
    },
    {
      label: 'Settings',
      icon: Icon.Settings,
      onClick: () => {
        openSettings({ indices: { tab: TabPage.Appearance, section: SettingsSection.SkiffCalendar } });
      }
    },
    {
      label: 'Send feedback',
      icon: Icon.Comment,
      onClick: () => {
        setOpenModal({
          type: CalendarModalType.Feedback
        });
      }
    }
  ];

  const eventInfo: SidebarSectionProps[] = [
    {
      id: 'event-info-section',
      isCustom: true,
      content: <EventInfo setIsUpdatingEvent={setIsUpdatingEvent} />
    }
  ];

  // If the user clicks out of the sidepanel, reset the selected event ID,
  // which closes the EventInfo component in the sidebar
  useOnClickOutside(
    sidebarRef,
    () => {
      // Do not close event info or open the InviteUpdateModal if the event is being updated
      // Happens if the user is submitting new event info after tabbing out of a field
      if (isUpdatingEvent) {
        setIsUpdatingEvent(false);
        return;
      }
      void saveDraftAndCloseEventInfo();
    },
    SIDEBAR_CLICK_OUTSIDE_EXCLUDED_CLASSES,
    { web: MouseEvents.CLICK },
    undefined,
    undefined,
    10
  );

  useOnEscapePress(sidebarRef, ESCAPE_SELECTOR, () => {
    void saveDraftAndCloseEventInfo();
  });

  const shouldRenderEventInfo = !!selectedEventID;
  // We give sidebar option menu class name to correctly handle outside clicks if more events dropdown is open
  const className = currCalendarView === CalendarView.Monthly ? OPTION_MENU_CLASSNAME : undefined;

  return (
    <Sidebar
      AppSwitcher={<AppSwitcher />}
      Footer={
        !shouldRenderEventInfo && (
          <StyledDatePicker highlightCurrentWeek onSelectDate={jumpToDate} selectedDate={selectedViewDate} />
        )
      }
      className={className}
      id={SIDEBAR_ID}
      // Clicking on the sidebar does not trigger an outside click
      // so the isUpdatingEvent state should be reset to false
      onClick={() => setIsUpdatingEvent(false)}
      primaryActions={shouldRenderEventInfo ? [] : primaryActions}
      ref={sidebarRef}
      sections={eventInfo}
      width={SIDEBAR_WIDTH}
    />
  );
};
