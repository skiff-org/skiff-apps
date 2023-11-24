import { Dayjs } from 'dayjs';
import { ThemeMode } from 'nightwatch-ui';

import { DatePickerEvent } from '../DatePicker.types';

export interface DatePickerDayProps {
  currentDayWithTimeZone: Dayjs;
  weekStartDate: Dayjs;
  weekEndDate: Dayjs;
  shouldDisplayEvents: boolean;
  day?: Dayjs;
  selectedDate?: Dayjs;
  forceTheme?: ThemeMode;
  highlightCurrentWeek?: boolean;
  datePickerEvents?: DatePickerEvent[];
  bgColor?: string;
}
