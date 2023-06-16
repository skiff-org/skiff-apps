import dayjs, { Dayjs, PluginFunc } from 'dayjs';

/*
 * Renders a date in a "Jan. 31, 2023" style format
 */
export const renderDate = (date: Date) => {
  return dayjs(date).format('MMM. D, YYYY');
};

/*
 * Returns a boolean that indicates if 2 dates are equal or not
 */
export const isSameDate = (firstDate: Dayjs, secondDate: Dayjs) => {
  return (
    firstDate.year() === secondDate.year() &&
    firstDate.month() === secondDate.month() &&
    firstDate.date() === secondDate.date()
  );
};

import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import IsSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';

import { MINUTE_UNIT, MS_UNIT } from '../constants/time.constants';

dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(IsSameOrBefore);
dayjs.extend(isBetween);

/**
 * There is bug in dayjs when modifying dayjs instance on timezone GTM+00:00 it corrupts the dayjs instance
 * (see https://github.com/iamkun/dayjs/issues/2126)
 *
 * this fix is copied from a pr that fixes this bug (https://github.com/iamkun/dayjs/pull/2118)
 */
const tempTimezonePluginFix: PluginFunc = (_options, dayjsClass, dayjsFactory) => {
  dayjsClass.prototype.tz = function (tzone?: string | undefined, keepLocalTime?: boolean | undefined) {
    const oldOffset = this.utcOffset();
    const date = this.toDate();
    const target = date.toLocaleString('en-US', { timeZone: tzone });
    const diff = Math.round((date.getTime() - new Date(target).getTime()) / 1000 / 60);

    const offset = -date.getTimezoneOffset() - diff;
    if (offset === 0) {
      return this.utc(keepLocalTime);
    }

    let ins: Dayjs & { $x?: { timezone?: string } } = (
      dayjsFactory(target) as Dayjs & { $set: (unit: string, value: number) => Dayjs }
    )
      .$set(MS_UNIT, (this as Dayjs & { $ms: number }).$ms)
      .utcOffset(offset, true);

    if (keepLocalTime) {
      const newOffset = ins.utcOffset();
      ins = ins.add(oldOffset - newOffset, MINUTE_UNIT);
    }

    (ins as Dayjs & { $x: { $timezone?: string } }).$x.$timezone = tzone;
    return ins;
  };
};

// TODO: remove this and bump to the new version when it's merged - https://linear.app/skiff/issue/PROD-2112/remove-dayjs-patch-and-bump-version
dayjs.extend(tempTimezonePluginFix);

export { dayjs };

export const getUserGuessedTimeZone = () => dayjs.tz.guess();
