import dayjs from 'dayjs';

import { HourFormats, TwelveHourPeriod } from '../src';
import {
  addMissingColon,
  getCustomTimeHoursAndMinutes,
  getExistingCustomTimeXM,
  getMissingCustomTimeXM,
  parseCustomTime
} from '../src/components/TimeField';

describe('timeFieldUtils', () => {
  describe('getCustomTimeHoursAndMinutes', () => {
    it('returns hours and minutes part of the time string', () => {
      let testTimeStringInput = '120';
      let actual = getCustomTimeHoursAndMinutes(testTimeStringInput);
      expect(actual).toBe('120');

      testTimeStringInput = '1200';
      actual = getCustomTimeHoursAndMinutes(testTimeStringInput);
      expect(actual).toBe('1200');

      testTimeStringInput = '12:0 AM';
      actual = getCustomTimeHoursAndMinutes(testTimeStringInput);
      expect(actual).toBe('12:0');

      testTimeStringInput = '12:00 PM';
      actual = getCustomTimeHoursAndMinutes(testTimeStringInput);
      expect(actual).toBe('12:00');
    });
    it('returns the first <= 4 integers of the hours and minutes part of the time string', () => {
      let testTimeStringInput = '120000 PM';
      let actual = getCustomTimeHoursAndMinutes(testTimeStringInput);
      expect(actual).toBe('1200');

      testTimeStringInput = '12:000 AM';
      actual = getCustomTimeHoursAndMinutes(testTimeStringInput);
      expect(actual).toBe('12:00');
    });
  });
  describe('addMissingColon', () => {
    it('returns the empty string', () => {
      const testTimeStringInput = '';
      const actual = addMissingColon(testTimeStringInput);
      expect(actual).toBe('');
    });
    it('adds a colon and a 0 to the end of the time string', () => {
      const testTimeStringInput = '1';
      const actual = addMissingColon(testTimeStringInput);
      expect(actual).toBe('1:0');
    });
    it('adds a colon and two 0s to the end of the time string', () => {
      const testTimeStringInput = '12';
      const actual = addMissingColon(testTimeStringInput);
      expect(actual).toBe('12:00');
    });
    it('adds a colon and a 0 after the first two integers', () => {
      const testTimeStringInput = '123';
      const actual = addMissingColon(testTimeStringInput);
      expect(actual).toBe('12:03');
    });
    it('adds a colon to the mid-point of the string', () => {
      const testTimeStringInput = '1230';
      const actual = addMissingColon(testTimeStringInput);
      expect(actual).toBe('12:30');
    });
  });
  describe('getExistingCustomTimeXM', () => {
    it('returns the empty string', () => {
      const testTimeStringInput = '11:00';
      const actual = getExistingCustomTimeXM(testTimeStringInput);
      expect(actual).toBe('');
    });
    it('returns the last non-integer value in the time string', () => {
      let testTimeStringInput = '11:00A';
      let actual = getExistingCustomTimeXM(testTimeStringInput);
      expect(actual).toBe('A');

      testTimeStringInput = '11:00 P';
      actual = getExistingCustomTimeXM(testTimeStringInput);
      expect(actual).toBe('P');
    });
    it('returns the last 2 non-integer values in the time string', () => {
      let testTimeStringInput = '11:00AM';
      let actual = getExistingCustomTimeXM(testTimeStringInput);
      expect(actual).toBe('AM');

      testTimeStringInput = '11:00 PM';
      actual = getExistingCustomTimeXM(testTimeStringInput);
      expect(actual).toBe('PM');
    });
  });
  describe('getMissingCustomTimeXM', () => {
    it('Completes the AM/PM', () => {
      const initialTimeString = '10:00 AM';
      const initialTimeDate = dayjs(initialTimeString, HourFormats.Long);

      const hoursAndMinutes = '11:00';

      let testTimeStringInput = 'A';
      let actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(TwelveHourPeriod.AM);

      testTimeStringInput = 'P';
      actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(TwelveHourPeriod.PM);
    });
    it('Derives the missing or invalid AM/PM from the start time', () => {
      const initialTimeXM = TwelveHourPeriod.AM;
      const initialTimeString = `10:00 ${initialTimeXM}`;
      const initialTimeDate = dayjs(initialTimeString, HourFormats.Long);

      const hoursAndMinutes = '11:00';

      // Missing XM
      let testTimeStringInput = '';
      let actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(initialTimeXM);

      // Invalid XM
      testTimeStringInput = 'XM';
      actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(initialTimeXM);
    });
    it("Switches the start time's time period, returning PM rather than AM", () => {
      const initialTimeString = '10:00 AM';
      const initialTimeDate = dayjs(initialTimeString, HourFormats.Long);

      const hoursAndMinutes = '12:00';

      let testTimeStringInput = '';
      let actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(TwelveHourPeriod.PM);

      testTimeStringInput = 'XM';
      actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(TwelveHourPeriod.PM);
    });
    it("Switches the start time's time period returning AM rather than PM", () => {
      const initialTimeString = '10:00 PM';
      const initialTimeDate = dayjs(initialTimeString, HourFormats.Long);

      const hoursAndMinutes = '12:00';

      let testTimeStringInput = '';
      let actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(TwelveHourPeriod.AM);

      testTimeStringInput = 'XM';
      actual = getMissingCustomTimeXM(testTimeStringInput, hoursAndMinutes, initialTimeDate);
      expect(actual).toBe(TwelveHourPeriod.AM);
    });
  });
  describe('parseCustomTime', () => {
    it('parses single/double digits without AM/PM in 12-hour format', () => {
      const longHourFormat = HourFormats.Long;

      const initialTimeString = '8:00 AM';
      const initialTimeDate = dayjs(initialTimeString, longHourFormat);

      let testTimeStringInput = '9';
      let actual = parseCustomTime(testTimeStringInput, longHourFormat, initialTimeDate);
      expect(actual).toBe('9:0 AM');

      testTimeStringInput = '12';
      actual = parseCustomTime(testTimeStringInput, longHourFormat, initialTimeDate);
      expect(actual).toBe('12:00 PM');
    });
    it('parses invalid time string with incomplete AM/PM in 12-hour format', () => {
      const longHourFormat = HourFormats.Long;

      const initialTimeString = '8:00 AM';
      const initialTimeDate = dayjs(initialTimeString, longHourFormat);

      // No colon, missing space and incomplete AM
      let testTimeStringInput = '123A';
      let actual = parseCustomTime(testTimeStringInput, longHourFormat, initialTimeDate);
      expect(actual).toBe('12:03 AM');

      // No colon and incomplete PM
      testTimeStringInput = '1230 P';
      actual = parseCustomTime(testTimeStringInput, longHourFormat, initialTimeDate);
      expect(actual).toBe('12:30 PM');
    });
    it('parses invalid time string with invalid AM/PM in 12-hour format', () => {
      const longHourFormat = HourFormats.Long;

      const initialTimeString = '8:00 AM';
      const initialTimeDate = dayjs(initialTimeString, longHourFormat);

      // No colon, string > 4 integers and invalid AM / PM
      const testTimeStringInput = '12000 XM';
      const actual = parseCustomTime(testTimeStringInput, longHourFormat, initialTimeDate);
      expect(actual).toBe(`12:00 ${TwelveHourPeriod.PM}`);
    });
    it('parses invalid time string in 24-hour format', () => {
      const mediumHourFormat = HourFormats.Medium;

      const initialTimeString = '8:00 AM';
      const initialTimeDate = dayjs(initialTimeString, mediumHourFormat);

      // No colon
      let testTimeStringInput = '123';
      let actual = parseCustomTime(testTimeStringInput, mediumHourFormat, initialTimeDate);
      expect(actual).toBe('12:03');

      // No colon and string > 4 integers
      testTimeStringInput = '12000';
      actual = parseCustomTime(testTimeStringInput, mediumHourFormat, initialTimeDate);
      expect(actual).toBe('12:00');
    });
  });
});
