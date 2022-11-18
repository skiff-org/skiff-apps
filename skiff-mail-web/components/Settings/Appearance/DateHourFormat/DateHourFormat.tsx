import { Divider } from 'nightwatch-ui';
import React from 'react';
import { TitleActionSection, useTimedRerender } from 'skiff-front-utils';

import useLocalSetting, { LocalSettings } from '../../../../hooks/useLocalSetting';

/**
 * Component to select date and hour format
 */
function DateHourFormat() {
  const [dateFormat, setDateFormat] = useLocalSetting('dateFormat');
  const [hourFormat, setHourFormat] = useLocalSetting('hourFormat');
  useTimedRerender(60 * 1000); // rerender every minute to keep date preview up-to-date
  const updateHour = (value) => setHourFormat(value as LocalSettings['hourFormat']) as void;
  const updateDate = (value) => setDateFormat(value as LocalSettings['dateFormat']) as void;

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onChange: updateHour,
            value: hourFormat,
            type: 'select',
            items: [
              {
                label: '12 hours',
                value: '12'
              },
              {
                label: '24 hours',
                value: '24'
              }
            ]
          }
        ]}
        subtitle='How to display time.'
        title='Time format'
      />
      <Divider />
      <TitleActionSection
        actions={[
          {
            onChange: updateDate,
            value: dateFormat,
            type: 'select',
            items: [
              {
                label: 'MM/DD/YYYY',
                value: 'MM/DD/YYYY'
              },
              {
                label: 'DD/MM/YYYY',
                value: 'DD/MM/YYYY'
              },
              {
                label: 'YYYY-MM-DD',
                value: 'YYYY-MM-DD'
              }
            ]
          }
        ]}
        subtitle='How to display dates.'
        title='Date format'
      />
    </>
  );
}

export default DateHourFormat;
