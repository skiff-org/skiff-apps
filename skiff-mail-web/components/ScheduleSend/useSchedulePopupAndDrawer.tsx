import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarPicker, CalendarPickerProps } from '@mui/x-date-pickers/CalendarPicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import customParserFormat from 'dayjs/plugin/customParseFormat';
import { Icon, ButtonGroup, ButtonGroupItem, Surface, Drawer, Typography, InputField, Button } from 'nightwatch-ui';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { HourPicker } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { useLocalHourFormat } from '../../hooks/useDate';
import useLocalSetting from '../../hooks/useLocalSetting';

import DateTimeForm from './DateTimeForm';

dayjs.extend(customParserFormat);

const MobileCalenderStyles = css`
  &.MuiCalendarPicker-root {
    width: 100%;

    .MuiTypography-root {
      width: 44px;
      height: 44px;
      font-size: 15px;
    }

    .MuiButtonBase-root {
      width: 44px;
      height: 44px;
      font-size: 15px;
    }
  }
`;

const StyledCalenderPicker = styled(CalendarPicker)<CalendarPickerProps<Date>>`
  svg:not(:root) {
    width: 1em;
    height: 1em;
  }

  ${isMobile && MobileCalenderStyles}
`;

const Container = styled.div`
  display: flex;
  gap: 20px;
`;

const DrawerContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
`;
const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 28px;
`;
const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const PickersContainer = styled.div`
  width: 100%;
  height: ${!isMobile ? '300px' : '100%'};
`;

interface ScheduleSendPopupProps {
  initialDate?: Dayjs;
  buttonRef: RefObject<HTMLDivElement>;
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSendClick: (scheduleSendAt?: Date) => Promise<void>;
}

const SURFACE_WIDTH = 600;

const enum ActivePicker {
  DATE = 'date',
  TIME = 'time'
}

export const useScheduleSendPopupAndDrawer = ({
  initialDate,
  buttonRef,
  open,
  setOpen,
  handleSendClick
}: ScheduleSendPopupProps) => {
  const [dateFormat] = useLocalSetting('dateFormat');
  const timeFormat = useLocalHourFormat();

  const [dateAndTime, setDateAndTime] = useState<Dayjs | null>(initialDate || dayjs(Date.now()).add(5, 'minutes'));

  useEffect(() => {
    if (initialDate) setDateAndTime(initialDate || null);
  }, [initialDate]);

  const pickerContainerRef = useRef<HTMLDivElement>(null);

  const [activePicker, setActivePicker] = useState<ActivePicker>(ActivePicker.DATE);
  const [dateFieldValue, setDateFieldValue] = useState(dayjs(dateAndTime).format(dateFormat));
  const [timeFieldValue, setTimeFieldValue] = useState(dayjs(dateAndTime).format(timeFormat));
  const [dateFieldError, setDateFieldError] = useState<string>();
  const [timeFieldError, setTimeFieldError] = useState<string>();

  const updateTime = useCallback(
    (time: string) => {
      const parsed = dayjs(time, timeFormat);
      if (!parsed.isValid()) return;
      let newDate = dayjs(dateAndTime);
      newDate = newDate.set('hours', parsed.hour());
      newDate = newDate.set('minutes', parsed.minute());
      if (newDate.isBefore(Date.now(), 'minute')) {
        setTimeFieldError('Time must be in the future');
        setDateAndTime(dateAndTime);
      } else {
        setTimeFieldError(undefined);
        setDateAndTime(newDate);
      }
    },
    [dateAndTime, timeFormat]
  );

  const updateDate = useCallback(
    (_date: string) => {
      let parsed = dayjs(_date, dateFormat);
      if (!parsed.isValid()) parsed = dayjs(_date);
      if (!parsed.isValid()) return;
      let newDate = dayjs(dateAndTime);
      newDate = newDate.set('year', parsed.year());
      newDate = newDate.set('month', parsed.month());
      newDate = newDate.set('date', parsed.date());

      if (newDate.isBefore(Date.now(), 'day')) {
        setDateFieldError('Date must be in the future');
        setDateAndTime(dateAndTime);
      } else {
        setDateFieldError(undefined);
        setDateAndTime(newDate);
      }
    },
    [dateAndTime]
  );

  const showPicker = (picker: ActivePicker) => {
    setActivePicker(picker);
  };

  useEffect(() => {
    setDateFieldValue(dayjs(dateAndTime).format(dateFormat));
    setTimeFieldValue(dayjs(dateAndTime).format(timeFormat));

    if (dateAndTime?.isBefore(Date.now(), 'day')) {
      setDateFieldError('Date must be in the future');
      setTimeFieldError(undefined);
    } else if (dateAndTime?.isBefore(Date.now(), 'minute')) {
      setTimeFieldError('Time must be in the future');
    } else {
      setDateFieldError(undefined);
      setTimeFieldError(undefined);
    }
  }, [dateAndTime]);

  const buttonRect = buttonRef.current?.getBoundingClientRect();

  const surfaceAnchor = {
    top: (buttonRect?.top || 0) - 15,
    left: (buttonRect?.left || 0) - SURFACE_WIDTH / 2
  };

  const ScheduleSendPopup = (
    <Surface
      hug
      level='l2'
      onClose={() => setOpen(false)}
      open={open}
      size='xlarge'
      style={{
        position: 'absolute',
        transform: 'translateY(-100%)',
        ...surfaceAnchor
      }}
    >
      <Container>
        <PickersContainer ref={pickerContainerRef}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <StyledCalenderPicker
              date={dateAndTime?.toDate() || null}
              disablePast
              onChange={(newDate) => {
                updateDate(newDate);
              }}
              views={['day', 'month']}
            />
          </LocalizationProvider>
        </PickersContainer>
        <DateTimeForm
          dateFieldError={dateFieldError}
          dateFieldValue={dateFieldValue}
          setDateFieldValue={setDateFieldValue}
          setTimeFieldValue={setTimeFieldValue}
          timeFieldError={timeFieldError}
          timeFieldValue={timeFieldValue}
          updateDate={updateDate}
          updateTime={updateTime}
        />
      </Container>
      <ButtonGroup>
        <ButtonGroupItem
          disabled={dateAndTime?.isBefore(dayjs(Date.now()))}
          icon={Icon.Send}
          label={'Send later'}
          onClick={() => handleSendClick(dateAndTime?.toDate())}
        />
        <ButtonGroupItem
          label={'Cancel'}
          onClick={() => {
            setOpen(false);
          }}
        />
      </ButtonGroup>
    </Surface>
  );

  const ScheduleSendDrawer = (
    <Drawer hideDrawer={() => setOpen(false)} show={open}>
      <DrawerContainer>
        <TextContainer>
          <Typography color='primary' level={1}>
            Select Date
          </Typography>
          <Typography color='secondary' level={3}>
            After selecting a date, you can choose a time
          </Typography>
        </TextContainer>
        <InputContainer>
          <InputField
            active={activePicker === ActivePicker.DATE}
            disabled
            onClick={() => showPicker(ActivePicker.DATE)}
            value={dateFieldValue}
          />
          <InputField
            active={activePicker === ActivePicker.TIME}
            disabled
            onClick={() => showPicker(ActivePicker.TIME)}
            value={timeFieldValue}
          />
        </InputContainer>
        <PickersContainer ref={pickerContainerRef}>
          {activePicker === ActivePicker.DATE && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <StyledCalenderPicker
                date={dateAndTime?.toDate() || null}
                disablePast
                onChange={(newDate) => {
                  updateDate(newDate);
                }}
                views={['day', 'month']}
              />
            </LocalizationProvider>
          )}
          {activePicker === ActivePicker.TIME && (
            <HourPicker
              initialHour={initialDate || dayjs(Date.now()).add(5, 'minutes')}
              itemHeight={48}
              onChange={updateTime}
              timeFormat={timeFormat}
            />
          )}
        </PickersContainer>
        {!isMobile && (
          <ButtonGroup>
            <ButtonGroupItem
              disabled={!!timeFieldError || !!dateFieldError}
              icon={Icon.Send}
              label='Send later'
              onClick={() => handleSendClick(dateAndTime?.toDate())}
            />
            <ButtonGroupItem
              label='Cancel'
              onClick={() => {
                setOpen(false);
              }}
            />
          </ButtonGroup>
        )}
        {isMobile && (
          <Button
            align='center'
            disabled={!!timeFieldError || !!dateFieldError}
            fullWidth
            onClick={() => handleSendClick(dateAndTime?.toDate())}
            size='medium'
          >
            Send later
          </Button>
        )}
      </DrawerContainer>
    </Drawer>
  );
  return { ScheduleSendPopup, ScheduleSendDrawer };
};
