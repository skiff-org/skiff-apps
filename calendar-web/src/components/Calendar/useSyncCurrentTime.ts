import { useEffect } from 'react';
import { StorageTypes } from 'skiff-utils';

import { timeReducer } from '../../redux/reducers/timeReducer';
import { dayjs, getUserGuessedTimeZone, useAppDispatch, useLocalSetting } from '../../utils';
const MINUTE_IN_MILLISECONDS = 60_000;

const useSyncCurrentTime = () => {
  const dispatch = useAppDispatch();
  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const timeZone = userPreferredTimezone ?? getUserGuessedTimeZone();

  useEffect(() => {
    const currTime = dayjs().tz(timeZone);
    const currentTimeMilliseconds = currTime.millisecond() + 1000 * currTime.second();
    dispatch(timeReducer.actions.setCurrentTime(currTime));

    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      dispatch(timeReducer.actions.setCurrentTime(dayjs().tz(timeZone)));

      interval = setInterval(() => {
        dispatch(timeReducer.actions.setCurrentTime(dayjs().tz(timeZone)));
      }, MINUTE_IN_MILLISECONDS);
    }, MINUTE_IN_MILLISECONDS - currentTimeMilliseconds);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [dispatch, timeZone]);
};

export default useSyncCurrentTime;
