import { PickerOnChangeFn } from '@mui/x-date-pickers/internals/hooks/useViews';
import dayjs, { Dayjs } from 'dayjs';
import { Dropdown, Icon, InputField, InputFieldSize, ThemeMode, useOnClickOutside } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import { DateFormats, DateInputFormats, ShortDateFormatValue, YEAR_UNIT } from '../../constants';
import DatePicker from '../DatePicker';

export const DATE_PICKER_DROPDOWN_CLASSNAME = 'date-picker-dropdown';

interface DateInputFieldProps {
  // Date format used to display the date in the input field
  displayedDateFormat: DateFormats | string;
  id: string;
  // Whether or not the date picker dropdown is open
  // Indicates that the user started editing the field
  isDatePickerOpen: boolean;
  inputFieldSize: InputFieldSize;
  // Date format selected by the user in local settings
  userSelectedDateFormat: ShortDateFormatValue | DateInputFormats;
  onSelectDate: PickerOnChangeFn<Date> & PickerOnChangeFn<unknown>;
  setIsDatePickerOpen: Dispatch<SetStateAction<boolean>>;
  date?: Dayjs;
  error?: boolean;
  isReadOnly?: boolean;
  // The min date that can be selected
  minDate?: Date;
  startIcon?: Icon;
  preSubmitCustomDateAction?: () => void;
  postSubmitCustomDateAction?: () => void;
  autoFocus?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
}

// Renders the Date InputField for Desktop as well as controls the DatePicker Dropdown
const DateInputField: React.FC<DateInputFieldProps> = ({
  displayedDateFormat,
  id,
  isDatePickerOpen,
  inputFieldSize,
  userSelectedDateFormat,
  onSelectDate,
  setIsDatePickerOpen,
  date,
  error,
  isReadOnly = false,
  minDate,
  startIcon,
  preSubmitCustomDateAction,
  postSubmitCustomDateAction,
  autoFocus,
  ref
}: DateInputFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputInnerRef = useRef<HTMLInputElement>(null);

  // Custom date input
  const [customDateInput, setCustomDateInput] = useState<string | undefined>(undefined);
  // Indicates that the user started editing the field
  const [isEditing, setIsEditing] = useState(false);

  // Value to be displayed in the input field
  const inputValue = customDateInput ?? (date ? date.format(displayedDateFormat) : '');

  const resetValues = () => {
    setCustomDateInput(undefined);
    setIsEditing(false);
  };

  // Submit user-inputted date by converting the date string to Dayjs object and updating the event
  const onSubmitCustomDate = () => {
    if (!customDateInput) {
      setIsDatePickerOpen(false);
      resetValues();
      return;
    }

    const trimmedCustomDate = customDateInput.trim();

    const dateInLocalSettingsFormat = dayjs(trimmedCustomDate, userSelectedDateFormat);
    const isInLocalSettingsFormat = dateInLocalSettingsFormat.isValid();

    const getCustomDateObj = (): Dayjs => {
      // If the entered date is in the local settings format, return the formatted date
      if (isInLocalSettingsFormat) return dateInLocalSettingsFormat;

      // If the entered date is not in the local settings format, then the user likely entered the date
      // in the format the date is displayed in
      // If the display format includes the year, return the inputted date as is.
      if (displayedDateFormat.includes('Y')) return dayjs(trimmedCustomDate);

      // If the display date format does not include a year, we default the year to the existing or current year
      const fallbackYear = date?.year() ?? dayjs().year();
      return dayjs(trimmedCustomDate).set(YEAR_UNIT, fallbackYear);
    };

    const customDateObj: Dayjs = getCustomDateObj();

    if (customDateObj.isValid()) onSelectDate(customDateObj.toDate());

    setIsDatePickerOpen(false);
    resetValues();
  };

  // Clicking outside should submit the inputted date
  // Ignore clicks within the date picker dropdown
  useOnClickOutside(
    inputInnerRef,
    () => {
      preSubmitCustomDateAction?.();
      onSubmitCustomDate();
      postSubmitCustomDateAction?.();
    },
    [DATE_PICKER_DROPDOWN_CLASSNAME],
    {}, // Use default event handling
    [], // No excluded refs
    customDateInput === undefined && !isDatePickerOpen
  );

  // Blur the input field when the user stops editing
  useEffect(() => {
    if (!isEditing) inputInnerRef?.current?.blur();
  }, [isEditing]);

  return (
    <>
      <div ref={inputRef}>
        <InputField
          autoComplete='off'
          autoFocus={autoFocus}
          disabled={isReadOnly}
          error={error}
          icon={startIcon}
          id={id}
          innerRef={inputInnerRef}
          onBlur={() => {
            // Opening the date picker blurs the input field,
            // so we refocus to avoid interrupting user editing
            const shouldRefocus = isDatePickerOpen || isEditing;
            if (shouldRefocus) inputInnerRef.current?.focus();
          }}
          onFocus={() => {
            setIsDatePickerOpen(true);
            setIsEditing(true);
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCustomDateInput(e.target.value);
            setIsDatePickerOpen(false);
          }}
          // We use onFocus instead of onClick because it is necessary for when the user focuses the field
          // by tabbing into it instead of clicking on it
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Tab') onSubmitCustomDate();
            else if (e.key === 'Escape') resetValues();
          }}
          onKeyPress={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') onSubmitCustomDate();
          }}
          placeholder={userSelectedDateFormat}
          ref={ref}
          size={inputFieldSize}
          value={inputValue}
        />
      </div>
      <Dropdown
        buttonRef={inputRef}
        className={DATE_PICKER_DROPDOWN_CLASSNAME}
        gapFromAnchor={4}
        portal
        setShowDropdown={setIsDatePickerOpen}
        showDropdown={isDatePickerOpen}
      >
        <DatePicker
          forceTheme={ThemeMode.DARK}
          minDate={minDate}
          onSelectDate={(newDate: Date | unknown) => {
            onSelectDate(newDate);
            setIsDatePickerOpen(false);
            resetValues();
          }}
          selectedDate={date}
        />
      </Dropdown>
    </>
  );
};

export default DateInputField;
