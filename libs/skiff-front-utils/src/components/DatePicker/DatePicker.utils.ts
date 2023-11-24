import { EVENT_DOT_CONTAINER_HEIGHT } from '../EventDot/EventDot.constants';

import {
  DAY_PICKER_SIZE,
  HEADER_MARGIN_BOTTOM,
  MAX_NUM_OF_WEEK_ROWS,
  WEEK_ROW_VERTICAL_MARGIN
} from './DatePicker.constants';

export const getDatePickerHeight = (shouldDisplayEvents: boolean, showHeader: boolean) => {
  // Date picker header height
  const headerHeight = showHeader ? DAY_PICKER_SIZE + HEADER_MARGIN_BOTTOM : 0;
  // Week day label height
  const weekDayLabelHeight = DAY_PICKER_SIZE + (shouldDisplayEvents ? 0 : WEEK_ROW_VERTICAL_MARGIN);
  // Date picker week rows height without week day label
  const datePickerRowsHeight =
    (DAY_PICKER_SIZE + (shouldDisplayEvents ? EVENT_DOT_CONTAINER_HEIGHT : WEEK_ROW_VERTICAL_MARGIN)) *
    MAX_NUM_OF_WEEK_ROWS;

  return weekDayLabelHeight + datePickerRowsHeight + headerHeight;
};
