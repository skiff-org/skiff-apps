import { Dayjs } from 'dayjs';
import { Icon, Icons, InputField, InputFieldVariant, InputFieldSize, useOnClickOutside } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { HourFormats } from '../../constants';

import { TimeDateInputFieldWrapper } from './styles';
import { TIME_PICKER_DROPDOWN_CLASSNAME } from './TimeField.constants';
import { dateToFormatString, parseCustomTime } from './TimeField.utils';
import TimeFieldDropdown from './TimeFieldDropdown';
import { CalendarDateFieldType } from './types';

const InputFieldWrapper = styled.div<{ $unfilled?: boolean }>`
  ${TimeDateInputFieldWrapper}
`;

interface TimeInputFieldProps {
  id: string;
  // Whether or not the time dropdown is open
  // Indicates that the user started editing the field
  isTimePickerOpen: boolean;
  inputFieldSize: InputFieldSize;
  selectedHourFormat: HourFormats;
  type: CalendarDateFieldType;
  onSelectTime: (time: Dayjs | string) => void;
  setIsTimePickerOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedField: Dispatch<SetStateAction<CalendarDateFieldType>>;
  date?: Dayjs;
  error?: boolean;
  initialTime?: Dayjs;
  isReadOnly?: boolean;
  isMultiDay?: boolean;
  startIcon?: Icon;
  setIsUpdatingEvent?: Dispatch<SetStateAction<boolean>>;
  gapFromAnchor?: number;
  autoFocus?: boolean;
  unfilled?: boolean;
}

// Renders the Time InputField for Desktop as well as controls the Time List Dropdown
const TimeInputField: React.FC<TimeInputFieldProps> = ({
  id,
  isTimePickerOpen,
  inputFieldSize,
  selectedHourFormat,
  type,
  onSelectTime,
  setIsTimePickerOpen,
  setSelectedField,
  date,
  error,
  initialTime,
  isReadOnly = false,
  isMultiDay,
  startIcon,
  setIsUpdatingEvent,
  gapFromAnchor,
  autoFocus,
  unfilled
}: TimeInputFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputInnerRef = useRef<HTMLInputElement>(null);

  const [customTimeInput, setCustomTimeInput] = useState<string | undefined>(undefined);

  const inputFieldValue = customTimeInput ?? (date ? dateToFormatString(date, selectedHourFormat) : undefined);

  // Submits the new time
  const onSubmitTime = (newTime: Dayjs | string | undefined) => {
    if (!newTime) {
      // Terminates editing resetting the input field value
      setIsTimePickerOpen(false);
      return;
    }

    const newSelectedTime =
      typeof newTime === 'string' ? parseCustomTime(newTime, selectedHourFormat, initialTime ?? date) : newTime;
    onSelectTime(newSelectedTime);
    setIsTimePickerOpen(false);
  };

  // Clicking outside should submit the inputted time
  // Ignore clicks within the time picker dropdown
  useOnClickOutside(
    inputInnerRef,
    () => {
      setIsUpdatingEvent?.(true);
      onSubmitTime(customTimeInput);
    },
    [TIME_PICKER_DROPDOWN_CLASSNAME],
    {}, // Use default event handling
    [], // No excluded refs
    customTimeInput === undefined && !isTimePickerOpen
  );

  // When the user stops editing, blur the input field and reset the custom time state
  // useEffect is necessary because the user can also close the dropdown by pressing Escape
  useEffect(() => {
    if (!isTimePickerOpen) {
      inputInnerRef?.current?.blur();
      setCustomTimeInput(undefined);
      setSelectedField(CalendarDateFieldType.None);
    } else {
      setSelectedField(type);
    }
  }, [isTimePickerOpen, setSelectedField, type]);

  return (
    <>
      <InputFieldWrapper $unfilled={unfilled} ref={inputRef}>
        <InputField
          autoFocus={autoFocus}
          disabled={isReadOnly}
          endAdornment={unfilled ? <Icons color='secondary' icon={Icon.ChevronUp} /> : undefined}
          error={error}
          icon={startIcon}
          id={id}
          innerRef={inputInnerRef}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTimeInput(e.target.value)}
          onBlur={() => {
            // Clicking on the input field while the dropdown is open
            // blurs the input field because of the dropdown's background blocker
            // so this ensures that if the user is still editing, the input field would remain focused
            const shouldRefocus = isTimePickerOpen;
            if (shouldRefocus) inputInnerRef?.current?.focus();
          }}
          // We use onFocus instead of onClick because it is necessary for when the user focuses the field
          // by tabbing into it instead of clicking on it
          onFocus={() => setIsTimePickerOpen(true)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Tab') onSubmitTime(customTimeInput);
          }}
          onKeyPress={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') onSubmitTime(customTimeInput);
          }}
          placeholder={selectedHourFormat}
          size={unfilled ? undefined : inputFieldSize}
          value={inputFieldValue}
          variant={unfilled ? InputFieldVariant.GHOST : undefined}
        />
      </InputFieldWrapper>
      <TimeFieldDropdown
        customTimeInput={customTimeInput}
        date={date}
        gapFromAnchor={gapFromAnchor}
        initialTime={initialTime}
        inputRef={inputRef}
        isMultiDay={isMultiDay}
        isOpen={isTimePickerOpen}
        onSubmitTime={onSubmitTime}
        selectedHourFormat={selectedHourFormat}
        setIsOpen={setIsTimePickerOpen}
      />
    </>
  );
};

export default TimeInputField;
