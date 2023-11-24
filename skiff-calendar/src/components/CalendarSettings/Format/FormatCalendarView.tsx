import { isMobile } from 'react-device-detect';
import { TitleActionSection } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';

import { MOBILE_CALENDAR_VIEW_LABEL } from '../../../constants/calendar.constants';
import { useDefaultCalendarView } from '../../../utils/hooks/useCalendarView';

/** Updates the user-preferred default calendar view */
export const FormatCalendarView = () => {
  const { defaultCalendarView, setDefaultCalendarView } = useDefaultCalendarView();

  const calendarViewOptions = [CalendarView.Weekly, CalendarView.Monthly].map((value) => ({
    label: upperCaseFirstLetter(isMobile ? MOBILE_CALENDAR_VIEW_LABEL[value] : (value as string)),
    value
  }));

  const onChangeCalendarView = (value: string) => {
    setDefaultCalendarView(value as CalendarView);
  };

  return (
    <TitleActionSection
      actions={[
        {
          type: 'select',
          value: defaultCalendarView,
          onChange: onChangeCalendarView,
          items: calendarViewOptions
        }
      ]}
      subtitle='Choose your default calendar view'
      title='Calendar view'
    />
  );
};
