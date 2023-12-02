import isNumber from 'lodash/isNumber';
import { DayOfWeek, StartDayOfTheWeek, TitleActionSection, VALID_START_DAYS_OF_WEEK } from 'skiff-front-utils';
import { useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

export const FormatStartDay = () => {
  const [startDay, setStartDay] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const updateStartDay = (value: string) => {
    setStartDay(DayOfWeek[value] as StartDayOfTheWeek);
  };

  const getStartDayOptions = () => {
    const dayNumbers = Object.values(VALID_START_DAYS_OF_WEEK).filter((value) => isNumber(value)) as number[];
    return dayNumbers.map((value) => ({
      label: DayOfWeek[value],
      value: DayOfWeek[value]
    }));
  };

  const items = getStartDayOptions();

  return (
    <TitleActionSection
      actions={[
        {
          type: 'select',
          value: DayOfWeek[startDay],
          onChange: updateStartDay,
          items
        }
      ]}
      subtitle='Choose a day to start the week on'
      title='Start week on'
    />
  );
};
