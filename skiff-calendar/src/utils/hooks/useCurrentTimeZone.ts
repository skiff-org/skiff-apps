import { getTimeZones } from '@vvo/tzdb';
import { useEffect, useState } from 'react';
import { StorageTypes } from 'skiff-utils';

import { useLocalSetting } from './useLocalSetting';

export const useCurrentTimeZone = () => {
  const [timeZone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const [label, setLabel] = useState('');

  useEffect(() => {
    const currentTimeZoneLabel = getTimeZones().find(({ name }) => name === timeZone);
    if (currentTimeZoneLabel) {
      setLabel(currentTimeZoneLabel.abbreviation);
    }
  }, [timeZone]);

  return { label };
};
