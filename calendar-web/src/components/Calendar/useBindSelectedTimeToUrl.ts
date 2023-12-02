import { useEffect } from 'react';
import { useHistory } from 'react-router';
import { CALENDAR_PATH } from 'skiff-front-utils';

import { useAppSelector } from '../../utils';

export const useBindSelectedTimeToUrl = () => {
  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);
  const history = useHistory();

  useEffect(() => {
    const currentYear = selectedViewDate.year();
    const currentMonth = selectedViewDate.month() + 1;
    const currentDay = selectedViewDate.date();
    history.push({ ...history.location, pathname: `/${CALENDAR_PATH}/${currentYear}/${currentMonth}/${currentDay}` });
  }, [history, selectedViewDate]);
};
