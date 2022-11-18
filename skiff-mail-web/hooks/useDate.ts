import dayjs from 'dayjs';

import useLocalSetting from './useLocalSetting';

export const useLocalHourFormat = () => {
  const [hourFormat] = useLocalSetting('hourFormat');
  return hourFormat === '12' ? 'h:mm A' : 'HH:mm';
};

export function useDate() {
  const [dateFormat] = useLocalSetting('dateFormat');
  const hourFormat = useLocalHourFormat();

  const getMonthAndDay = (date: Date) => {
    if (dateFormat === 'DD/MM/YYYY') {
      return dayjs(date).format('D MMM');
    } else {
      return dayjs(date).format('MMM D');
    }
  };

  const getTime = (date: Date) => dayjs(date).format(hourFormat);

  const getTimeAndDate = (date: Date) => `${dayjs(date).format(dateFormat)} at ${dayjs(date).format(hourFormat)}`;

  return { getMonthAndDay, getTime, getTimeAndDate };
}
