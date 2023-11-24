import { Divider } from 'nightwatch-ui';
import { useTimedRerender, TitleActionSection } from 'skiff-front-utils';
import { AllUserPreferences } from 'skiff-front-utils';
import { useUserPreference } from 'skiff-front-utils';
import { DateInputFormats, HourFormatValue } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

export const DateHourFormat = () => {
  const [dateFormat, setDateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);
  const [hourFormat, setHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  useTimedRerender(60 * 1000); // rerender every minute to keep date preview up-to-date
  const updateHour = (value) => {
    setHourFormat(value as AllUserPreferences[StorageTypes.HOUR_FORMAT]);
  };
  const updateDate = (value) => {
    setDateFormat(value as AllUserPreferences[StorageTypes.DATE_FORMAT]);
  };

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
                label: '12 hour format',
                value: HourFormatValue.Twelve
              },
              {
                label: '24 hour format',
                value: HourFormatValue.TwentyFour
              }
            ]
          }
        ]}
        subtitle='How to display time'
        title='Time format'
      />
      <Divider color='tertiary' />
      <TitleActionSection
        actions={[
          {
            onChange: updateDate,
            value: dateFormat,
            type: 'select',
            items: [
              {
                label: 'MM/DD/YYYY',
                value: DateInputFormats.MonthDayYear
              },
              {
                label: 'DD/MM/YYYY',
                value: DateInputFormats.DayMonthYear
              },
              {
                label: 'YYYY-MM-DD',
                value: DateInputFormats.YearMonthDay
              }
            ]
          }
        ]}
        subtitle='How to display dates'
        title='Date format'
      />
    </>
  );
};
