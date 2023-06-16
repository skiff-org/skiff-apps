import { Dayjs } from 'dayjs';

export type TimeFormat = 'h' | 'H' | 'h A' | 'h:mm A' | 'H:mm' | 'HH:mm';

export const getInitialDateObject = (withTimeDivider: boolean, initialHour?: Dayjs | null, timeFormat?: TimeFormat) => {
  const initialDateObject = { hour: '00', minute: '00', timeDivider: withTimeDivider ? 'AM' : '' };
  if (initialHour && timeFormat) {
    const formatted = initialHour.format(timeFormat);
    const hour = formatted.split(':')[0];
    // If the hour set is not 00,
    // remove the first 0 and take the number of hour.
    initialDateObject.hour = hour.startsWith('0') && hour !== '00' ? hour[1] : hour;
    initialDateObject.minute = formatted.split(':')[1].split(' ')[0];
    if (withTimeDivider) {
      initialDateObject.timeDivider = formatted.split(' ')[1];
    }
  }
  return initialDateObject;
};
