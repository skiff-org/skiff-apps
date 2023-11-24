import { PickerOnChangeFn } from '@mui/x-date-pickers/internals/hooks/useViews';
import { Dayjs } from 'dayjs';
import { Icon, Size } from 'nightwatch-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { ShortFormat, DateFormats } from '../../constants';
import { useUserPreference } from '../../hooks';

import DateInputField from './DateInputField';
import MobileDateInputField from './MobileDateInputField';

const DATE_FIELD_ID = 'dateField';

const DateFieldContainer = styled.div<{ $width?: number }>`
  width: ${({ $width }) => ($width ? `${$width}px` : '100%')};
`;

interface DateFieldProps {
  onSelectDate: PickerOnChangeFn<Date> & PickerOnChangeFn<unknown>;
  date?: Dayjs;
  error?: boolean;
  // Whether or not it's a multi-day event
  isMultiDay?: boolean;
  // Whether or not it's the end date field
  isEndDate?: boolean;
  isReadOnly?: boolean;
  // The min date that can be selected
  minDate?: Date;
  preSubmitCustomDateAction?: () => void;
  postSubmitCustomDateAction?: () => void;
  customDisplayedDateFormat?: string;
  showIcon?: boolean;
  width?: number;
}

const DateField: React.FC<DateFieldProps> = ({
  onSelectDate,
  date,
  error,
  isMultiDay = false,
  isEndDate = false,
  isReadOnly = false,
  minDate,
  customDisplayedDateFormat,
  preSubmitCustomDateAction,
  postSubmitCustomDateAction,
  showIcon,
  width
}: DateFieldProps) => {
  const [userDateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);

  // Whether or not the date picker dropdown / drawer is open
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Display the date in short format in multi-day events
  const isShortFormat = isMultiDay;
  // Date format selected by the user in local settings
  const userSelectedDateFormat = isShortFormat ? ShortFormat[userDateFormat] : userDateFormat;
  // Date format used to display the date in the input field
  const displayedDateFormat: DateFormats | string =
    customDisplayedDateFormat || (isShortFormat ? DateFormats.Normal : DateFormats.Long);

  const startIcon = showIcon ? Icon.Calendar : undefined;

  // div wrapper is to prevent layout shift when this component is used
  // in a container with a gap value set
  return (
    <DateFieldContainer $width={width}>
      {isMobile ? (
        <MobileDateInputField
          date={date}
          displayedDateFormat={displayedDateFormat}
          drawerTitle={isMultiDay ? `${isEndDate ? 'End' : 'Start'} date` : undefined}
          error={error}
          id={DATE_FIELD_ID}
          inputFieldSize={Size.MEDIUM}
          isDatePickerOpen={isDatePickerOpen}
          isReadOnly={isReadOnly}
          minDate={minDate}
          onSelectDate={onSelectDate}
          setIsDatePickerOpen={setIsDatePickerOpen}
          startIcon={startIcon}
          userSelectedDateFormat={userSelectedDateFormat}
        />
      ) : (
        <DateInputField
          date={date}
          displayedDateFormat={displayedDateFormat}
          error={error}
          id={DATE_FIELD_ID}
          inputFieldSize={Size.SMALL}
          isDatePickerOpen={isDatePickerOpen}
          isReadOnly={isReadOnly}
          minDate={minDate}
          onSelectDate={onSelectDate}
          postSubmitCustomDateAction={postSubmitCustomDateAction}
          preSubmitCustomDateAction={preSubmitCustomDateAction}
          setIsDatePickerOpen={setIsDatePickerOpen}
          startIcon={startIcon}
          userSelectedDateFormat={userSelectedDateFormat}
        />
      )}
    </DateFieldContainer>
  );
};

export default DateField;
