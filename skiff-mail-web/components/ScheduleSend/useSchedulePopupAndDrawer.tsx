import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarPicker, CalendarPickerProps } from '@mui/x-date-pickers/CalendarPicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Drawer,
  Icon,
  InputField,
  Size,
  Surface,
  Typography,
  TypographySize
} from '@skiff-org/skiff-ui';
import dayjs, { Dayjs } from 'dayjs';
import customParserFormat from 'dayjs/plugin/customParseFormat';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { HourPicker, useTheme, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { useLocalHourFormat } from '../../hooks/useDate';

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
  const { theme } = useTheme();
  const [dateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);
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
      setDateAndTime(newDate);

      if (newDate.isBefore(Date.now(), 'minute')) {
        setTimeFieldError('Time must be in the future');
      } else {
        setTimeFieldError(undefined);
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
      setDateAndTime(newDate);
      if (newDate.isBefore(Date.now(), 'day')) {
        setDateFieldError('Date must be in the future');
        setTimeFieldError('Time must be in the future');
      } else {
        setDateFieldError(undefined);
        // If time also after current time, we can clear time error as well.
        if (newDate.isAfter(Date.now())) {
          setTimeFieldError(undefined);
        }
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
      setTimeFieldError('Time must be in the future');
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

  const hasError = !!timeFieldError || !!dateFieldError;
  const blockIfErrorOnClick = () => {
    if (hasError) {
      return;
    }
    void handleSendClick(dateAndTime?.toDate());
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
        <ButtonGroupItem icon={Icon.Send} label='Send later' onClick={blockIfErrorOnClick} />
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
    <Drawer forceTheme={theme} hideDrawer={() => setOpen(false)} show={open}>
      <DrawerContainer>
        <TextContainer>
          <Typography mono uppercase size={TypographySize.LARGE}>
            Select Date
          </Typography>
          <Typography mono uppercase color='secondary' size={TypographySize.SMALL}>
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
              forceTheme={theme}
              initialHour={initialDate || dayjs(Date.now()).add(5, 'minutes')}
              itemHeight={48}
              onChange={updateTime}
              timeFormat={timeFormat}
            />
          )}
        </PickersContainer>
        <Button fullWidth onClick={blockIfErrorOnClick} size={Size.MEDIUM}>
          Send later
        </Button>
      </DrawerContainer>
    </Drawer>
  );
  return { ScheduleSendPopup, ScheduleSendDrawer };
};
