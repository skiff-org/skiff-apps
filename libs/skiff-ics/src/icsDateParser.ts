import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { findIana } from 'windows-iana';

import { GMT_TZID_PATTERN } from './constants';
import { ExtendedDate } from './types';

/**
 * ical.js is missing timezone logic when parsing .ics files.
 *
 * This file overrides the start+end date parsing functions of icl.js,
 * it is instead adds a parsing function very similar to the origin but with timezones parsing.
 *
 * This ical bug appears in several issues and have few possible solutions suggested,
 * this one is the most lean and strait forward solution,
 * It only uses dayjs timezone parsing, while avoiding holding/getting timezones lists and handling them manually.
 */

dayjs.extend(utc);
dayjs.extend(timezone);

type Value = string | ExtendedDate | (string | ExtendedDate)[];

const text = function (t: string): string {
  t = t || '';
  return t
    .replace(/\\\,/g, ',')
    .replace(/\\\;/g, ';')
    .replace(/\\[nN]/g, '\n')
    .replace(/\\\\/g, '\\');
};

const parseValue = function (val: string) {
  if ('TRUE' === val) return true;

  if ('FALSE' === val) return false;

  const number = Number(val);
  if (!isNaN(number)) return number;

  return val;
};

const parseParams = function (p: string) {
  const out: { [key: string]: string | number | boolean } = {};
  for (let i = 0; i < p.length; i++) {
    const param = p[i];
    if (param && param.indexOf('=') > -1) {
      const segs = param.split('=');
      const key = segs[0] || '';
      out[key] = parseValue(segs.slice(1).join('='));
    }
  }
  return out;
};

const storeValParam = function (name: string) {
  return function (val: string | ExtendedDate, curr: { [key: string]: Value }) {
    const current = curr[name];
    if (Array.isArray(current)) {
      current.push(val);
      return curr;
    }

    if (current != null) {
      curr[name] = [current, val];
      return curr;
    }

    curr[name] = val;
    return curr;
  };
};

/** Check if timezone is valid IANA timezone and try converting from Windows time zone to IANA time zone if not */
const parseTZ = (inputTZID: string) => {
  // Remove surrounding quotes if found at the beginning and at the end of the string
  // (Occurs when parsing Microsoft Exchange events containing TZID with Windows standard format instead IANA)
  let parsedTZID: string | undefined = inputTZID.replace(/^"(.*)"$/, '$1');
  let utcOffset = 0;

  // Microsoft sometimes uses this timezone which is not iana timezone
  // https://www.jevents.net/discussions/datetimezone-construct-unknown-or-bad-timezone-tzone-microsoft-utc
  if (parsedTZID === 'tzone://Microsoft/Utc') {
    parsedTZID = 'UTC';
  }

  try {
    new Date().toLocaleString('en-US', { timeZone: parsedTZID });
  } catch (e) {
    // Convert to IANA time zone
    const results = findIana(parsedTZID);
    if (results && results.length > 0 && results[0]) {
      parsedTZID = results[0];
    } else {
      const errorMsg = `Invalid timezone: ${parsedTZID}`;

      // If not IANA or Windows timezone, check for GMT+0100 format
      const regResult = RegExp(GMT_TZID_PATTERN).exec(parsedTZID);
      const gmtTZID = regResult?.[0];
      if (!gmtTZID) throw new Error(errorMsg); // if not defined, the TZID is not in GMT+0100 format

      // Extract utc offset from the TZID
      const offsetString = gmtTZID.replace(/GMT/, '');
      // the offset will only be the first 3 chars, ie +01 from +0100
      utcOffset = parseInt(offsetString.slice(0, 3));
      if (isNaN(utcOffset)) throw new Error(errorMsg);
      parsedTZID = undefined;
    }
  }

  return { parsedTZID, utcOffset };
};

const addTZ = function (dt: ExtendedDate, params: string) {
  const p = parseParams(params);

  if (params && p) {
    dt.tz = p.TZID;
    if (dt.tz !== undefined) {
      // Check if time zone is in Windows format rather than IANA format and parse to IANA if necessary
      const parsedTZID = parseTZ(dt.tz as string).parsedTZID;
      dt.tz = parsedTZID;
    }
  }

  return dt;
};

export const dateParam = function (name: string) {
  return function (val: string, params: string, curr: { [key: string]: Value }) {
    let newDate: string | ExtendedDate = text(val);
    if (params && params.indexOf('VALUE=DATE') > -1 && params.indexOf('VALUE=DATE-TIME') === -1) {
      // Just Date
      // console.log(" date string="+val)
      const comps = /^(\d{4})(\d{2})(\d{2}).*$/.exec(val);
      if (comps !== null) {
        // No TZ info - assume same timezone as this computer
        newDate = new Date(parseInt(comps[1]!, 10), parseInt(comps[2]!, 10) - 1, parseInt(comps[3]!, 10));

        newDate = addTZ(newDate, params);
        newDate.dateOnly = true;

        // Store as string - worst case scenario
        return storeValParam(name)(newDate, curr);
      }
    }

    // Typical RFC date-time format
    const comps = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(val);
    if (comps !== null) {
      if (comps[7] == 'Z') {
        // GMT
        newDate = new Date(
          Date.UTC(
            parseInt(comps[1]!, 10),
            parseInt(comps[2]!, 10) - 1,
            parseInt(comps[3]!, 10),
            parseInt(comps[4]!, 10),
            parseInt(comps[5]!, 10),
            parseInt(comps[6]!, 10)
          )
        );
      } else {
        const p = parseParams(params);
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // This block is the only part changing in this patch
        if (p && p.TZID) {
          // If timezone is specified, the value corresponds to time local to the timezone.
          // So, timezone needs to be factored in before converting to UTC
          // Ref: #3 option in https://www.kanzaki.com/docs/ical/dateTime.html
          const paramTZID: string | undefined = p.TZID as string;
          const { parsedTZID, utcOffset } = parseTZ(paramTZID);

          const newDayjsWithTimezone = utcOffset ? dayjs(val).utcOffset(utcOffset, true) : dayjs.tz(val, parsedTZID);
          newDate = newDayjsWithTimezone.utc().toDate();

          ////////////////////////////////////////////////////////////////////////////////////////////////////
        } else {
          newDate = new Date(
            parseInt(comps[1]!, 10),
            parseInt(comps[2]!, 10) - 1,
            parseInt(comps[3]!, 10),
            parseInt(comps[4]!, 10),
            parseInt(comps[5]!, 10),
            parseInt(comps[6]!, 10)
          );
        }
      }

      newDate = addTZ(newDate, params);
    }

    // Store as string - worst case scenario
    return storeValParam(name)(newDate, curr);
  };
};
