import { Dayjs } from 'dayjs';
import { InputField, InputFieldSize, ThemeMode, Icon } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useRef } from 'react';
import { HourPicker, HourPickerProps } from 'skiff-front-utils';
import { Drawer, HourFormats } from 'skiff-front-utils';
import styled from 'styled-components';

import { dateToFormatString } from '../../../utils';
import { TimeDateInputFieldWrapper } from '../styles';
import { CalendarDateFieldType } from '../types';

const HOUR_PICKER_ITEM_HEIGHT = 48;
const HOUR_PICKER_MINUTE_INTERVAL = 5;

const InputFieldWrapper = styled.div`
  ${TimeDateInputFieldWrapper}
`;

interface MobileTimeInputFieldProps {
  drawerTitle: string;
  id: string;
  isTimePickerOpen: boolean;
  inputFieldSize: InputFieldSize;
  selectedHourFormat: HourFormats;
  type: CalendarDateFieldType;
  onSelectTime: (time: Dayjs | string) => void;
  setIsTimePickerOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedField: Dispatch<SetStateAction<CalendarDateFieldType>>;
  date?: Dayjs;
  error?: boolean;
  isReadOnly?: boolean;
  startIcon?: Icon;
}

// Renders the Time InputField for mobile as well as controls the TimePicker Drawer
const MobileTimeInputField: React.FC<MobileTimeInputFieldProps> = ({
  drawerTitle,
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
  isReadOnly = false,
  startIcon
}: MobileTimeInputFieldProps) => {
  const inputInnerRef = useRef<HTMLInputElement>(null);
  const inputFieldValue = date ? dateToFormatString(date, selectedHourFormat) : undefined;

  return (
    <>
      <InputFieldWrapper>
        <InputField
          disabled={isReadOnly}
          error={error}
          icon={startIcon}
          id={id}
          innerRef={inputInnerRef}
          onClick={() => {
            if (!isReadOnly) {
              setSelectedField(type);
              setIsTimePickerOpen(true);
            }
          }}
          onFocus={() => {
            // Prevents highlighting the input field text
            inputInnerRef?.current?.blur();
          }}
          placeholder={selectedHourFormat}
          readOnly
          size={inputFieldSize}
          value={inputFieldValue}
        />
      </InputFieldWrapper>
      <Drawer
        forceTheme={ThemeMode.DARK}
        hideDrawer={() => {
          setIsTimePickerOpen(false);
          setSelectedField(CalendarDateFieldType.None);
        }}
        show={isTimePickerOpen}
        title={drawerTitle}
      >
        <HourPicker
          forceTheme={ThemeMode.DARK}
          initialHour={date}
          itemHeight={HOUR_PICKER_ITEM_HEIGHT}
          minuteInterval={HOUR_PICKER_MINUTE_INTERVAL}
          onChange={onSelectTime}
          timeFormat={selectedHourFormat as HourPickerProps['timeFormat']}
        />
      </Drawer>
    </>
  );
};

export default MobileTimeInputField;
