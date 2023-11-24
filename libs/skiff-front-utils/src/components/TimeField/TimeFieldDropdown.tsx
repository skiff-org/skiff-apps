import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import range from 'lodash/range';
import { Dropdown, DropdownItem, themeNames } from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { DAY_UNIT, FIFTEEN_MIN, HOURS_IN_DAY, HourFormats, MINUTES_IN_HOUR, MINUTE_UNIT } from '../../constants';
import { useLocalSetting } from '../../hooks';
import BrowserDesktopView from '../BrowserDesktopView';

import { TIME_PICKER_DROPDOWN_CLASSNAME } from './TimeField.constants';
import { dateToFormatString } from './TimeField.utils';

// dayjs plugin to calculate durations between two dates
dayjs.extend(duration);

const MAX_DROPDOWN_HEIGHT = 196;

const Duration = styled.span`
  margin-left: 8px;
  color: ${themeNames.dark['--text-disabled']};
`;

interface TimeFieldDropdownProps {
  isOpen: boolean;
  inputRef: React.RefObject<HTMLInputElement | HTMLDivElement>;
  selectedHourFormat: HourFormats;
  onSubmitTime: (time: Dayjs | string | undefined) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customTimeInput?: string;
  date?: Dayjs;
  initialTime?: Dayjs;
  isMultiDay?: boolean;
  gapFromAnchor?: number;
}

const TimeFieldDropdown: React.FC<TimeFieldDropdownProps> = ({
  isOpen,
  inputRef,
  selectedHourFormat,
  onSubmitTime,
  setIsOpen,
  customTimeInput,
  date,
  initialTime,
  isMultiDay,
  gapFromAnchor
}: TimeFieldDropdownProps) => {
  const [userTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);

  // Displayed times in the time dropdown after filtering
  const [filteredTimeList, setFilteredTimeList] = useState<Dayjs[]>([]);

  const isEndTime = !!initialTime;

  const getTimeList = useCallback(() => {
    if (!date) return [];
    const interval = FIFTEEN_MIN;
    // TODO @ororsatti revert changes after dayjs PR #2144 is merged
    const startTime =
      // dayjs will calculate the startOf of a date based on the original date (w/o the timezone offset)
      initialTime?.local().add(interval, MINUTE_UNIT).tz(userTimezone) ?? date.local().startOf(DAY_UNIT);
    const totalTime = HOURS_IN_DAY * MINUTES_IN_HOUR;
    const numIntervals = totalTime / interval;
    return range(numIntervals).map((index) =>
      startTime
        .local()
        .add(index * interval, MINUTE_UNIT)
        .tz(userTimezone)
    );
  }, [date, initialTime, userTimezone]);

  const renderTimeLabel = (time: Dayjs): React.ReactNode => {
    const formattedTime = dateToFormatString(time, selectedHourFormat);
    const intervalDuration = dayjs.duration(time.diff(initialTime));

    const numHours = intervalDuration.format('H');
    const numMins = intervalDuration.format('m');
    const hourDuration = numHours !== '0' ? `${numHours}h` : '';
    const minDuration = numMins !== '0' ? `${numMins}m` : '';

    const displayedDuration =
      !hourDuration && !minDuration ? '24h' : `${hourDuration}${hourDuration && ' '}${minDuration}`;

    return isEndTime ? (
      <>
        <span>{formattedTime}</span>
        {!isMultiDay && <Duration>{displayedDuration}</Duration>}
      </>
    ) : (
      formattedTime
    );
  };

  // Filter times dropdown list when custom time changes
  useEffect(() => {
    // Avoid calculating the time list on every render
    // by calculating it only if the dropdown is displayed
    if (!isOpen) return;

    const timeList = getTimeList();
    // If no custom time is entered, show all items
    const newTimeList = !!customTimeInput
      ? timeList.filter((time) => dateToFormatString(time, selectedHourFormat).includes(customTimeInput))
      : timeList;
    setFilteredTimeList(newTimeList);
  }, [getTimeList, customTimeInput, selectedHourFormat, userTimezone, isOpen]);

  return (
    <BrowserDesktopView>
      <Dropdown
        buttonRef={inputRef}
        className={TIME_PICKER_DROPDOWN_CLASSNAME}
        gapFromAnchor={gapFromAnchor}
        maxHeight={MAX_DROPDOWN_HEIGHT}
        portal
        setShowDropdown={setIsOpen}
        showDropdown={isOpen && !!filteredTimeList.length}
        width={210}
      >
        {filteredTimeList.map((time) => {
          const isActive = time.isSame(date);
          const formattedTime = dateToFormatString(time, selectedHourFormat);
          return (
            <DropdownItem
              active={isActive}
              key={formattedTime}
              label={renderTimeLabel(time)}
              onClick={() => onSubmitTime(time)}
              scrollIntoView={isActive}
              value={formattedTime}
            />
          );
        })}
      </Dropdown>
    </BrowserDesktopView>
  );
};

export default TimeFieldDropdown;
