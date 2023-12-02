import { Dayjs } from 'dayjs';
import { Icon, Size } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { hourFormatParser, useUserPreference } from 'skiff-front-utils';
import { HourFormats } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { TimeDateFieldContainer } from '../styles';
import { CalendarDateFieldType } from '../types';

import MobileTimeInputField from './MobileTimeInputField';
import TimeInputField from './TimeInputField';

const TIME_FIELD_ID = 'timeField';
const INPUT_FIELD_SIZE = isMobile ? Size.MEDIUM : Size.SMALL;

const TimeFieldContainer = styled.div`
  ${TimeDateFieldContainer}
`;
interface TimeFieldProps {
  type: CalendarDateFieldType;
  onSelectTime: (time: Dayjs | string) => void;
  setSelectedField: Dispatch<SetStateAction<CalendarDateFieldType>>;
  date?: Dayjs;
  error?: boolean;
  initialTime?: Dayjs;
  isReadOnly?: boolean;
  isMultiDay?: boolean;
  setIsUpdatingEvent?: Dispatch<SetStateAction<boolean>>;
}

const TimeField: React.FC<TimeFieldProps> = ({
  type,
  onSelectTime,
  setSelectedField,
  date,
  error,
  initialTime,
  isReadOnly = false,
  isMultiDay,
  setIsUpdatingEvent
}: TimeFieldProps) => {
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);

  // Whether or not the time picker dropdown / drawer is open
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const isEndTime = !!initialTime;
  // The start icon is only rendered on the start time field
  const renderIcon = !isEndTime;
  const startIcon = renderIcon ? Icon.Clock : undefined;

  const selectedHourFormat: HourFormats = userHourFormat ? hourFormatParser(userHourFormat) : HourFormats.Long;

  // div wrapper is to prevent layout shift when this component is used
  // in a container with a gap value set
  return (
    <TimeFieldContainer>
      {isMobile ? (
        <MobileTimeInputField
          date={date}
          drawerTitle={isEndTime ? 'End time' : 'Start time'}
          error={error}
          id={TIME_FIELD_ID}
          inputFieldSize={INPUT_FIELD_SIZE}
          isReadOnly={isReadOnly}
          isTimePickerOpen={isTimePickerOpen}
          onSelectTime={onSelectTime}
          selectedHourFormat={selectedHourFormat}
          setIsTimePickerOpen={setIsTimePickerOpen}
          setSelectedField={setSelectedField}
          startIcon={startIcon}
          type={type}
        />
      ) : (
        <TimeInputField
          date={date}
          error={error}
          id={TIME_FIELD_ID}
          initialTime={initialTime}
          inputFieldSize={INPUT_FIELD_SIZE}
          isMultiDay={isMultiDay}
          isReadOnly={isReadOnly}
          isTimePickerOpen={isTimePickerOpen}
          onSelectTime={onSelectTime}
          selectedHourFormat={selectedHourFormat}
          setIsTimePickerOpen={setIsTimePickerOpen}
          setIsUpdatingEvent={setIsUpdatingEvent}
          setSelectedField={setSelectedField}
          startIcon={startIcon}
          type={type}
        />
      )}
    </TimeFieldContainer>
  );
};

export default TimeField;
