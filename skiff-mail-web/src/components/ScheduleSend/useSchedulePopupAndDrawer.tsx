import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarPicker, CalendarPickerProps } from '@mui/x-date-pickers/CalendarPicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import customParserFormat from 'dayjs/plugin/customParseFormat';
import {
  Button,
  Dropdown,
  Icon,
  IconText,
  Icons,
  InputField,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  DATE_PICKER_DROPDOWN_CLASSNAME,
  DateFormats,
  DatePicker,
  Drawer,
  HourFormats,
  HourPicker,
  TimeField,
  uniqueTimezones,
  useLocalSetting,
  useTheme,
  useUserPreference,
  TimeZonePicker
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { useLocalHourFormat } from '../../hooks/useDate';

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

const TimeSelects = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ScheduleSendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  padding: 8px 8px 8px 16px;
  height: 44px;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-overlay-tertiary);
  border-top: 1px solid var(--border-tertiary);
`;

const TimeInputContainer = styled.div<{ $width?: number }>`
  width: ${(props) => props.$width || 96}px;
`;

const Separator = styled.div`
  width: 1px;
  height: 28px;
  background: var(--border-tertiary);
`;

const DROPDOWN_GAP_FROM_ANCHOR = 24;
interface ScheduleSendPopupProps {
  initialDate?: Dayjs;
  buttonRef: RefObject<HTMLDivElement>;
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSendClick: (scheduleSendAt?: Date) => Promise<void>;
}

const enum ActivePicker {
  DATE = 'date',
  TIME = 'time'
}

export const useScheduleSendPopupAndDrawer = ({
  initialDate,
  open,
  setOpen,
  handleSendClick
}: ScheduleSendPopupProps) => {
  const { theme } = useTheme();
  const [dateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);
  const [timeZone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const defaultTimeZone = uniqueTimezones.find((t) => t.name === timeZone);

  const timeFormat = useLocalHourFormat();
  const datePickerRef = useRef<HTMLDivElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const timeIconTextRef = useRef<HTMLDivElement>(null);
  const timeZonePickerRef = useRef<HTMLDivElement>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isTimeZonePickerOpen, setIsTimeZonePickerOpen] = useState(false);

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
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(defaultTimeZone?.name || '');

  const currentDate = dayjs().tz(defaultTimeZone ? defaultTimeZone.name : undefined);

  const updateTime = useCallback(
    (time: string) => {
      const parsed = dayjs(time, timeFormat);
      if (!parsed.isValid()) return;
      let newDate = dayjs(dateAndTime);
      newDate = newDate.set('hours', parsed.hour());
      newDate = newDate.set('minutes', parsed.minute());

      // valid time
      if (newDate.hour() >= dayjs().hour() && dayjs(newDate).isSame(dayjs(), 'day')) {
      } else if (!isMobile && newDate.isSame(currentDate, 'day')) {
        // if invalid time, set to next day
        newDate = newDate.add(1, 'day'); // Add one day if the time is past midnight
      }

      setDateAndTime(newDate);

      if (newDate.isBefore(dayjs(), 'minute')) {
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
      // valid time
      // if new date before current time, set new date to current time + 5 minutes
      if (newDate.isBefore(dayjs(), 'minute')) {
        newDate = dayjs(Date.now()).add(5, 'minutes');
        setDateAndTime(newDate);
      }

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

  const onSubmitTime = (time: Dayjs | string | undefined) => {
    if (typeof time === 'string') {
      updateTime(time);
    } else if (!!time) {
      updateTime(time.format(timeFormat));
    }
    setIsTimePickerOpen(false);
  };

  const hasError = !!timeFieldError || !!dateFieldError;
  const blockIfErrorOnClick = () => {
    if (hasError) {
      return;
    }
    void handleSendClick(dateAndTime?.toDate());
  };

  const ScheduleSendPopup = (
    <>
      <Dropdown
        buttonRef={datePickerRef}
        className={DATE_PICKER_DROPDOWN_CLASSNAME}
        gapFromAnchor={DROPDOWN_GAP_FROM_ANCHOR}
        portal
        setShowDropdown={setIsDatePickerOpen}
        showDropdown={isDatePickerOpen}
      >
        <DatePicker
          forceTheme={ThemeMode.DARK}
          minDate={currentDate.toDate()}
          onSelectDate={(newDate: Date | unknown) => {
            if (newDate instanceof Date) {
              updateDate(dayjs(newDate).toString());
            }
            setIsDatePickerOpen(false);
          }}
          selectedDate={dateAndTime || undefined}
        />
      </Dropdown>
      <TimeZonePicker
        buttonRef={timeZonePickerRef}
        fixedHeight
        gapFromAnchor={DROPDOWN_GAP_FROM_ANCHOR}
        isOpen={isTimeZonePickerOpen}
        onSelectTimeZone={(tzName: string) => {
          const newDate = dayjs(dateAndTime).tz(tzName);
          setDateAndTime(newDate);
          setSelectedTimeZone(tzName);
        }}
        setIsOpen={setIsTimeZonePickerOpen}
        timeZone={selectedTimeZone}
      />
    </>
  );

  const ScheduleSendDrawer = (
    <>
      {isMobile && (
        <Drawer forceTheme={theme} hideDrawer={() => setOpen(false)} show={open}>
          <DrawerContainer>
            <TextContainer>
              <Typography size={TypographySize.LARGE}>Select Date</Typography>
              <Typography color='secondary' size={TypographySize.SMALL}>
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
                      if (typeof newDate === 'string') {
                        updateDate(newDate);
                      }
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
      )}
      {!isMobile && (
        <ScheduleSendRow>
          <Typography>Schedule email</Typography>
          <TimeSelects>
            <IconText
              color={isDatePickerOpen ? 'primary' : 'secondary'}
              endIcon={
                <Icons
                  color={isDatePickerOpen ? 'secondary' : 'disabled'}
                  icon={isDatePickerOpen ? Icon.ChevronUp : Icon.ChevronDown}
                />
              }
              label={(dateAndTime || dayjs()).format(DateFormats.Long)}
              onClick={() => setIsDatePickerOpen(true)}
              ref={datePickerRef}
              weight={TypographyWeight.REGULAR}
            />
            <Separator />
            {!isTimePickerOpen && (
              <IconText
                color={isTimePickerOpen ? 'primary' : 'secondary'}
                endIcon={<Icons color='disabled' icon={Icon.ChevronDown} />}
                label={(dateAndTime || dayjs()).format(HourFormats.Long)}
                onClick={() => {
                  setIsTimePickerOpen(true);
                }}
                ref={timeIconTextRef}
                weight={TypographyWeight.REGULAR}
              />
            )}
            {isTimePickerOpen && (
              <TimeInputContainer $width={timeIconTextRef.current?.clientWidth} ref={timePickerRef}>
                <TimeField
                  autoFocus
                  date={dateAndTime || dayjs()}
                  forceOpen={isTimePickerOpen}
                  gapFromAnchor={DROPDOWN_GAP_FROM_ANCHOR}
                  initialTime={dayjs().startOf('day').subtract(15, 'minutes')}
                  isMultiDay
                  onSelectTime={onSubmitTime}
                  setIsUpdatingEvent={() => {
                    setIsTimePickerOpen(false);
                  }}
                  setSelectedField={() => {}}
                  type={1}
                  unfilled
                />
              </TimeInputContainer>
            )}
            <Separator />
            <IconText
              color={isTimeZonePickerOpen ? 'primary' : 'secondary'}
              endIcon={
                <Icons
                  color={isTimeZonePickerOpen ? 'secondary' : 'disabled'}
                  icon={isTimeZonePickerOpen ? Icon.ChevronUp : Icon.ChevronDown}
                />
              }
              label={(dateAndTime || dayjs()).format('z')}
              onClick={() => setIsTimeZonePickerOpen(true)}
              ref={timeZonePickerRef}
              weight={TypographyWeight.REGULAR}
            />
            <Separator />
            <IconText
              color='secondary'
              onClick={() => {
                setOpen(false);
                setIsTimePickerOpen(false);
                setIsTimeZonePickerOpen(false);
                setIsDatePickerOpen(false);
              }}
              startIcon={Icon.Close}
            />
          </TimeSelects>
        </ScheduleSendRow>
      )}
    </>
  );
  return { ScheduleSendPopup, ScheduleSendDrawer, handleScheduleSendClick: blockIfErrorOnClick };
};
