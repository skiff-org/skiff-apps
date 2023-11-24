import { Dayjs } from 'dayjs';
import { Icon, Size } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { HourFormats } from '../../constants';
import { useUserPreference } from '../../hooks';

import MobileTimeInputField from './MobileTimeInputField';
import { TimeDateFieldContainer } from './styles';
import { hourFormatParser } from './TimeField.utils';
import TimeInputField from './TimeInputField';
import { CalendarDateFieldType } from './types';

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
  forceOpen?: boolean;
  gapFromAnchor?: number;
  autoFocus?: boolean;
  unfilled?: boolean;
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
  setIsUpdatingEvent,
  forceOpen,
  gapFromAnchor,
  autoFocus,
  unfilled
}: TimeFieldProps) => {
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);

  // Whether or not the time picker dropdown / drawer is open
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(forceOpen || false);

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
          autoFocus={autoFocus}
          date={date}
          error={error}
          gapFromAnchor={gapFromAnchor}
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
          unfilled={unfilled}
        />
      )}
    </TimeFieldContainer>
  );
};

export default TimeField;
