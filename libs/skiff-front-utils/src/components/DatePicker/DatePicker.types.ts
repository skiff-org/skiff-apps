import { PickerOnChangeFn } from '@mui/x-date-pickers/internals/hooks/useViews';
import { Dayjs } from 'dayjs';
import { AccentColor, ThemeMode } from 'nightwatch-ui';

export type DatePickerEvent = { date: Dayjs; events: { color: AccentColor }[] };

export interface DatePickerProps {
  onSelectDate: PickerOnChangeFn<Date> & PickerOnChangeFn<unknown>;
  bgColor?: string;
  className?: string;
  datePickerEvents?: DatePickerEvent[];
  forceTheme?: ThemeMode;
  highlightCurrentWeek?: boolean;
  minDate?: Date;
  selectedDate?: Dayjs;
  showHeader?: boolean;
}
