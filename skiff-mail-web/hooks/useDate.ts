import dayjs from 'dayjs';
import { useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

export const useLocalHourFormat = () => {
  const [hourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  return hourFormat === '12' ? 'h:mm A' : 'HH:mm';
};

export function useDate() {
  const [dateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);
  const hourFormat = useLocalHourFormat();

  const getMonthAndDay = (date: Date) => {
    const isThisYear = dayjs(date).year() === dayjs().year();
    if (dateFormat === 'DD/MM/YYYY') {
      return dayjs(date).format(`${isThisYear ? 'D MMM' : 'DD/MM/YY'}`);
    } else {
      return dayjs(date).format(`${isThisYear ? 'MMM D' : 'MM/DD/YY'}`);
    }
  };

  const getTime = (date: Date) => dayjs(date).format(hourFormat);

  const getTimeAndDate = (date: Date) => `${dayjs(date).format(dateFormat)} at ${dayjs(date).format(hourFormat)}`;

  return { getMonthAndDay, getTime, getTimeAndDate };
}
