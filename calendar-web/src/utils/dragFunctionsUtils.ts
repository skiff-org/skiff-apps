import { SNAP_SIZE } from '../constants/calendar.constants';
import { HOUR_UNIT, DAY_UNIT } from '../constants/time.constants';
import { DraggingData } from '../redux/reducers/sharedEventDraggingReducer';

import { dayjs, getHourFromTop } from './dateTimeUtils';

export const calculateNewStartTimeWithOffsets = (
  newStartTime: number,
  yOffsets: DraggingData['yOffsets'],
  xOffset: DraggingData['xOffset'],
  daySnapWidth: number
) =>
  dayjs(newStartTime)
    .add(getHourFromTop(yOffsets.top), HOUR_UNIT)
    .add(Math.round(xOffset / daySnapWidth), DAY_UNIT)
    .valueOf();

export const calculateNewEndStartWithOffsets = (
  newEndTime: number,
  yOffsets: DraggingData['yOffsets'],
  xOffset: DraggingData['xOffset'],
  daySnapWidth: number
) =>
  dayjs(newEndTime)
    .add(getHourFromTop(yOffsets.bottom), HOUR_UNIT)
    .add(Math.round(xOffset / daySnapWidth), DAY_UNIT)
    .valueOf();

export const roundY = (y: number) => SNAP_SIZE * Math.round(y / SNAP_SIZE);

export const getEventCardHeight = (height: number) => Math.max(height, SNAP_SIZE);
