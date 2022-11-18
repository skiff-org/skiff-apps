import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin
import utc from 'dayjs/plugin/utc';
import { Dropdown, DropdownItem, Typography, Icon, InputField } from 'nightwatch-ui';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import styled from 'styled-components';
import timezones from 'timezones-list';

dayjs.extend(utc);
dayjs.extend(timezone);

const FormContainer = styled.div`
  gap: 15px;
  width: 200px;
  display: flex;
  flex-direction: column;
`;

const LabeledField = styled.div``;

interface DateTimeFormProps {
  dateFieldValue: string;
  setDateFieldValue: Dispatch<SetStateAction<string>>;
  timeFieldValue: string;
  setTimeFieldValue: Dispatch<SetStateAction<string>>;
  dateFieldError?: string;
  timeFieldError?: string;
  updateTime: (time: string) => void;
  updateDate: (date: string) => void;
}

const DateTimeForm: FC<DateTimeFormProps> = ({
  dateFieldValue,
  setDateFieldValue,
  timeFieldValue,
  setTimeFieldValue,
  dateFieldError,
  timeFieldError,
  updateDate,
  updateTime
}) => {
  const [timezoneFilter, setTimezoneFilter] = useState<string | null>(null);
  const [timeZoneFieldValue, setTimeZoneFieldValue] = useState(
    timezones.find(({ label }) => label.includes(dayjs.tz.guess()))?.name
  );
  const [timeZoneDropdownOpen, setTimeZoneDropdownOpen] = useState(false);

  const dateFieldRef = useRef<HTMLInputElement>(null);
  const timeFieldRef = useRef<HTMLInputElement>(null);
  const timeZoneFieldRef = useRef<HTMLInputElement>(null);

  const filteredTimezones = timezoneFilter
    ? timezones.filter(({ name }) => name.toUpperCase().includes(timezoneFilter.toUpperCase()))
    : timezones;

  return (
    <FormContainer>
      <LabeledField>
        <Typography>Date</Typography>
        <InputField
          error={!!dateFieldError}
          errorMsg={dateFieldError}
          innerRef={dateFieldRef}
          onBlur={() => {
            updateDate(dateFieldValue);
          }}
          onChange={(e) => {
            setDateFieldValue(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              updateDate(dateFieldValue);
              timeFieldRef.current?.focus();
            }
          }}
          size='medium'
          value={dateFieldValue}
        />
      </LabeledField>
      <LabeledField>
        <Typography>Time</Typography>
        <InputField
          error={!!timeFieldError}
          errorMsg={timeFieldError}
          onBlur={() => {
            updateTime(timeFieldValue);
          }}
          onChange={(e) => {
            setTimeFieldValue(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              updateTime(timeFieldValue);
            }
          }}
          size='medium'
          value={timeFieldValue}
        />
      </LabeledField>
      <LabeledField>
        <Typography>Timezone</Typography>
        <InputField
          icon={Icon.ChevronDown}
          innerRef={timeZoneFieldRef}
          onChange={(e) => {
            setTimeZoneFieldValue(e.target.value);
            setTimezoneFilter(e.target.value);
          }}
          onClick={() => {
            timeZoneFieldRef.current?.select();
          }}
          onFocus={() => {
            setTimeZoneDropdownOpen(true);
          }}
          size='medium'
          value={timeZoneFieldValue}
        />
        <Dropdown
          buttonRef={timeZoneFieldRef}
          className='styled-dropdown'
          maxHeight={220}
          portal
          setShowDropdown={setTimeZoneDropdownOpen}
          showDropdown={timeZoneDropdownOpen}
        >
          {filteredTimezones.map(({ name, tzCode }) => (
            <DropdownItem
              key={tzCode}
              label={name}
              onClick={(e) => {
                timeFieldRef.current?.blur();
                setTimeZoneFieldValue(name);
                setTimezoneFilter(null);
                setTimeZoneDropdownOpen(false);
                e?.stopPropagation();
              }}
            />
          ))}
        </Dropdown>
      </LabeledField>
    </FormContainer>
  );
};

export default DateTimeForm;
