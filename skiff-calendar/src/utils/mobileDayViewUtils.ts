import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { StartDayOfTheWeek } from 'skiff-front-utils';

import { TimeUnit } from '../components/Calendar/types';
import { DATE_UNIT, DAY_UNIT } from '../constants/time.constants';

dayjs.extend(utc);

export const RELATIVE_DATE = '01/01/2000';

export const dayjsToIndex = (date: Dayjs, timeUnit: TimeUnit, userStartOfTheWeek?: StartDayOfTheWeek) => {
  // Relative Date is adjusted to match user's start of week
  // Sun Jan 02 2000 if user's start of week is Sunday
  // Mon Jan 03 2000 if user's start of week is Monday
  // Sat Jan 08 2000 if user's start of week is Saturday
  // compare dates both in UTC
  const dateWithTz = date.utc(true).startOf(DATE_UNIT); // set hour, min, sec all to 0
  const userRelativeDate = dayjs(RELATIVE_DATE).add(
    userStartOfTheWeek !== undefined ? userStartOfTheWeek + 1 : 0,
    DAY_UNIT
  );
  const userRelativeDateWithTz = dayjs(userRelativeDate).utc(true); // keep hour, min, sec as 0

  return dateWithTz.diff(userRelativeDateWithTz, timeUnit);
};

export const indexToDayjs = (
  index: number,
  timeUnit: TimeUnit,
  timeZone?: string,
  userStartOfTheWeek?: StartDayOfTheWeek
) => {
  const userRelativeDate = dayjs(RELATIVE_DATE).add(
    userStartOfTheWeek !== undefined ? userStartOfTheWeek + 1 : 0,
    DAY_UNIT
  );

  const userRelativeDateWithTz = dayjs(userRelativeDate).utc(true); // keep hour, min, sec as 0

  if (timeZone) {
    return userRelativeDateWithTz.add(index, timeUnit).tz(timeZone, true);
  }
  return userRelativeDateWithTz.add(index, timeUnit);
};

// Scroll all views to center view
export const syncViewScroll = (
  viewRefs: React.MutableRefObject<(React.RefObject<HTMLDivElement> | null)[]>,
  scrollTop?: number
) => {
  // Scroll All To Center
  const slideBefore = viewRefs.current[0]?.current;
  const centerSlide = viewRefs.current[1]?.current;
  const slideAfter = viewRefs.current[2]?.current;

  if (slideBefore && centerSlide && slideAfter) {
    slideBefore.scrollTop = scrollTop || centerSlide.scrollTop;
    centerSlide.scrollTop = scrollTop || centerSlide.scrollTop;
    slideAfter.scrollTop = scrollTop || centerSlide.scrollTop;
  }
};
