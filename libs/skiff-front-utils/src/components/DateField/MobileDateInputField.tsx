import { PickerOnChangeFn } from '@mui/x-date-pickers/internals/hooks/useViews';
import { Dayjs } from 'dayjs';
import { InputField, InputFieldSize, ThemeMode, Icon } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useRef } from 'react';
import { StorageTypes } from 'skiff-utils';

import { DateFormats, ShortDateFormatValue, DateInputFormats } from '../../constants';
import { useUserPreference } from '../../hooks';
import DatePicker from '../DatePicker';
import Drawer from '../Drawer';

interface MobileDateInputFieldProps {
  // Date format used to display the date in the input field
  displayedDateFormat: DateFormats | string;
  id: string;
  isDatePickerOpen: boolean;
  inputFieldSize: InputFieldSize;
  // Date format selected by the user in local settings
  userSelectedDateFormat: ShortDateFormatValue | DateInputFormats;
  onSelectDate: PickerOnChangeFn<Date> & PickerOnChangeFn<unknown>;
  setIsDatePickerOpen: Dispatch<SetStateAction<boolean>>;
  date?: Dayjs;
  drawerTitle?: string;
  error?: boolean;
  isReadOnly?: boolean;
  // The min date that can be selected
  minDate?: Date;
  startIcon?: Icon;
}

// Renders the Date InputField for Mobile as well as controls the DatePicker Drawer
const MobileDateInputField: React.FC<MobileDateInputFieldProps> = ({
  displayedDateFormat,
  id,
  isDatePickerOpen,
  inputFieldSize,
  userSelectedDateFormat,
  onSelectDate,
  setIsDatePickerOpen,
  date,
  drawerTitle,
  isReadOnly = false,
  minDate,
  error,
  startIcon
}: MobileDateInputFieldProps) => {
  const inputInnerRef = useRef<HTMLInputElement>(null);

  // Value to be displayed in the input field
  const inputValue = date ? date.format(displayedDateFormat) : '';

  const hideDrawer = () => setIsDatePickerOpen(false);

  return (
    <>
      <InputField
        disabled={isReadOnly}
        error={error}
        icon={startIcon}
        id={id}
        // Closing the drawer on mobile refocuses the input field
        // which in turn triggers opening the date picker drawer again
        // so we prevent that by only opening the drawer by clicking on the field
        // instead of focusing on it
        innerRef={inputInnerRef}
        onClick={() => {
          if (!isReadOnly) setIsDatePickerOpen(true);
        }}
        onFocus={() => {
          // Prevents highlighting the input field text
          inputInnerRef?.current?.blur();
        }}
        placeholder={userSelectedDateFormat}
        readOnly
        size={inputFieldSize}
        value={inputValue}
      />
      <Drawer forceTheme={ThemeMode.DARK} hideDrawer={hideDrawer} show={isDatePickerOpen} title={drawerTitle}>
        <DatePicker
          forceTheme={ThemeMode.DARK}
          minDate={minDate}
          onSelectDate={(newDate: Date | unknown) => {
            onSelectDate(newDate);
            hideDrawer();
          }}
          selectedDate={date}
        />
      </Drawer>
    </>
  );
};

export default MobileDateInputField;
