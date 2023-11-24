import { DAY_UNIT } from '../../../constants/time.constants';
import { useAppSelector } from '../../../utils';
import { DisplayEvent } from '../types';

/** Returns whether or not the given event has ended */
export const useIsPastEvent = (event: DisplayEvent) => {
  const currentTime = useAppSelector((state) => state.time.currentTime);
  const isAllDay = event.decryptedContent.isAllDay;
  const endDate = event.plainContent.endDate;

  // For all-day events, we only take into consideration the end date
  // For timed events, we take into consideration both the end date and the end time
  return isAllDay ? currentTime.utc(true).isAfter(endDate, DAY_UNIT) : currentTime.isAfter(endDate);
};
