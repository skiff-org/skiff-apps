import dayjs from 'dayjs';
import { getInitialDateObject } from './hourPickerUtils';

describe('hour picker', () => {
  it('getInitialDateObject hour set to 01:30 should be 1:30 AM', () => {
    const initialDateObject = getInitialDateObject(true, dayjs('01-01-2022 01:30'), 'h:mm A');
    expect(initialDateObject.hour).toBe('1');
    expect(initialDateObject.minute).toBe('30');
    expect(initialDateObject.timeDivider).toBe('AM');
  });

  it('getInitialDateObject hour set to 12:30 should be 12:30 PM', () => {
    const initialDateObject = getInitialDateObject(true, dayjs('01-01-2022 12:30'), 'h:mm A');
    expect(initialDateObject.hour).toBe('12');
    expect(initialDateObject.minute).toBe('30');
    expect(initialDateObject.timeDivider).toBe('PM');
  });
});
