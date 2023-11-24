import { Icon } from 'nightwatch-ui';
import { Setting } from 'skiff-front-utils';
import { SettingType, SettingValue, SETTINGS_LABELS } from 'skiff-front-utils';

import { ChangeTimeZone } from './ChangeTimeZone';
import { DateHourFormat } from './DateHourFormat';
import { FormatCalendarView } from './FormatCalendarView';
import { FormatStartDay } from './FormatStartDay';

export const useFormatSettings: () => Setting[] = () => {
  return [
    {
      type: SettingType.Custom,
      value: SettingValue.TimeZone,
      component: <ChangeTimeZone />,
      label: SETTINGS_LABELS[SettingValue.TimeZone],
      icon: Icon.Globe,
      color: 'green'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.CalendarView,
      component: <FormatCalendarView />,
      label: SETTINGS_LABELS[SettingValue.CalendarView],
      icon: Icon.Flag,
      color: 'blue'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.StartDayOfTheWeek,
      component: <FormatStartDay />,
      label: SETTINGS_LABELS[SettingValue.StartDayOfTheWeek],
      icon: Icon.Calendar,
      color: 'pink'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.DateHourFormat,
      component: <DateHourFormat />,
      label: SETTINGS_LABELS[SettingValue.DateHourFormat],
      icon: Icon.Clock,
      color: 'yellow'
    }
  ];
};
