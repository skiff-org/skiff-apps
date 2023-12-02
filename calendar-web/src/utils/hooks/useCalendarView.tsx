import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useUserPreference } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { calendarReducer } from '../../redux/reducers/calendarReducer';

import { useAppSelector } from './useAppSelector';

/** Returns the default calendar view specified in settings */
export const useDefaultCalendarView = () => {
  // Desktop default calendar view preference
  const [desktopDefaultCalendarView, setDesktopDefaultCalendarView, desktopDefaultCalendarViewLoading] =
    useUserPreference(StorageTypes.DEFAULT_CALENDAR_VIEW);

  // Mobile default calendar view preference
  const [mobileDefaultCalendarView, setMobileDefaultCalendarView, mobileDefaultCalendarViewLoading] = useUserPreference(
    StorageTypes.DEFAULT_CALENDAR_VIEW_MOBILE
  );

  const defaultCalendarView = isMobile ? mobileDefaultCalendarView : desktopDefaultCalendarView;
  const setDefaultCalendarView = isMobile ? setMobileDefaultCalendarView : setDesktopDefaultCalendarView;
  const defaultCalendarViewLoading = isMobile ? mobileDefaultCalendarViewLoading : desktopDefaultCalendarViewLoading;

  return { defaultCalendarView, setDefaultCalendarView, defaultCalendarViewLoading };
};

/** Returns the current displayed calendar view */
export const useCurrentCalendarView = () => {
  const { defaultCalendarView } = useDefaultCalendarView();

  const dispatch = useDispatch();
  const calendarView = useAppSelector((state) => state.calendar.calendarView);

  return {
    currCalendarView: calendarView ?? defaultCalendarView,
    setCurrCalendarView: (view: CalendarView) => dispatch(calendarReducer.actions.setCalendarView(view))
  };
};
