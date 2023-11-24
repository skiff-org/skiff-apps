import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin
import utc from 'dayjs/plugin/utc';
import { DropdownItem, FilledVariant, InputField, Size } from 'nightwatch-ui';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import { uniqueTimezones, renderCustomLabel, stringifyTimeZone, SelectField } from 'skiff-front-utils';
import styled from 'styled-components';
import timezones from 'timezones-list';

dayjs.extend(utc);
dayjs.extend(timezone);

const FormContainer = styled.div`
  gap: 15px;
  width: 300px;
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
  const [timeZoneFieldValue, setTimeZoneFieldValue] = useState(
    timezones.find((t) => t.label.includes(dayjs.tz.guess()))?.tzCode
  );
  const dateFieldRef = useRef<HTMLInputElement>(null);
  const timeFieldRef = useRef<HTMLInputElement>(null);
  const timeZoneFieldRef = useRef<HTMLInputElement>(null);

  return (
    <FormContainer>
      <LabeledField>
        <InputField
          error={dateFieldError}
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
          size={Size.SMALL}
          value={dateFieldValue}
        />
      </LabeledField>
      <LabeledField>
        <InputField
          error={timeFieldError}
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
          placeholder='Time'
          size={Size.SMALL}
          value={timeFieldValue}
        />
      </LabeledField>
      <SelectField
        maxHeight={400}
        onChange={(value: string) => {
          setTimeZoneFieldValue(value);
        }}
        placeholder='Timezone'
        size={Size.SMALL}
        value={timeZoneFieldValue}
        variant={FilledVariant.FILLED}
      >
        {uniqueTimezones.map((tz) => {
          const isActive = timeZoneFieldValue === tz.name;
          return (
            <DropdownItem
              customLabel={renderCustomLabel(tz)}
              key={tz.name}
              label={stringifyTimeZone(tz)}
              ref={isActive ? timeZoneFieldRef : undefined}
              value={tz.name}
            />
          );
        })}
      </SelectField>
    </FormContainer>
  );
};

export default DateTimeForm;
