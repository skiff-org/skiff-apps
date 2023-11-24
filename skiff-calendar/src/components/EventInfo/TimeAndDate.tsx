import dayjs, { Dayjs } from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Icon, Icons, Size, Toggle, Typography, TypographySize } from 'nightwatch-ui';
import { Dispatch, SetStateAction, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { DateField, hourFormatParser, useToast } from 'skiff-front-utils';
import { useUserPreference } from 'skiff-front-utils';
import { HourFormats } from 'skiff-front-utils';
import { RecurrenceRule } from 'skiff-ics';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { DATE_UNIT, DAY_UNIT, HOUR_UNIT, MINUTE_UNIT } from '../../constants/time.constants';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent, UpdateEventArgs } from '../../storage/models/event/types';
import {
  getDefaultEndTime,
  getMonthDateYear,
  getNewEndTime,
  getStartOfDateInUTC,
  performOnNextTik,
  setMonthDateYear,
  useLocalSetting
} from '../../utils';
import useJumpToDate from '../../utils/hooks/useJumpToDate';
import { useScrollToSelectedEvent } from '../../utils/hooks/useScrollToSelectedEvent';
import { isRecurringEvent } from '../../utils/recurringUtils';

import { Recurrence } from './Recurrence/Recurrence';
import { TimeField } from './TimeField';
import { CalendarDateFieldType, DateTime } from './types';

dayjs.extend(dayOfYear);

const TimeAndDateContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 4px;
`;

const MultiDateTime = styled.div<{ $isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  ${(props) => props.$isDisabled && `opacity: 0.2;`}
`;

const IconContainer = styled.div`
  margin-bottom: 4px;
`;

const AllDayToggle = styled.div`
  display: flex;
  padding: 2px 4px;
  align-items: center;
  gap: 4px;
`;

const MobileAllDayToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
  ${isMobile
    ? css`
        width: 100%;
        justify-content: space-between;
      `
    : ''}
`;

const ToggleContainer = styled.div`
  padding: 8px ${isMobile ? '0' : '4px'};
`;

const MobileAllDayText = styled.div`
  display: flex;
  gap: 10px;
  margin-left: 12px;
  align-items: center;
`;

const AllDayRecurrenceContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  ${isMobile
    ? css`
        flex-direction: column;
        align-content: flex-start;
      `
    : css`
        align-items: center;
      `}
  justify-content: space-between;
  width: 100%;
  min-height: 32px;
`;

interface TimeAndDateProps {
  dateTime: DateTime | undefined;
  setDateTime: (newDateTime: DateTime) => void;
  isAllDay: boolean;
  setIsAllDay: (allDay: boolean) => void;
  updateEventDetails: (newDetails: UpdateEventArgs) => Promise<void>;
  isReadOnly?: boolean;
  setIsUpdatingEvent?: Dispatch<SetStateAction<boolean>>;
  recurrenceRule?: RecurrenceRule | null;
  setRecurrenceRule: (recurrenceRule?: RecurrenceRule | null) => void;
  selectedEvent: DecryptedEvent | null;
  selectedDraft: DecryptedDraft | null;
}

export const TimeAndDate: React.FC<TimeAndDateProps> = ({
  dateTime,
  setDateTime,
  isAllDay,
  setIsAllDay,
  updateEventDetails,
  isReadOnly,
  recurrenceRule,
  selectedEvent,
  selectedDraft,
  setIsUpdatingEvent,
  setRecurrenceRule
}: TimeAndDateProps) => {
  const { startDateTime, endDateTime } = dateTime ?? {};
  const { enqueueToast } = useToast();
  const { jumpToDate } = useJumpToDate();

  /** State */
  // Which field (start or end) was selected last
  const [selectedField, setSelectedField] = useState<CalendarDateFieldType>(CalendarDateFieldType.None);
  const [dateTimeInputError, setDateTimeInputError] = useState(false);

  // Custom hooks
  const [userTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  const scrollToSelectedEvent = useScrollToSelectedEvent();
  const timeFormat: HourFormats = userHourFormat ? hourFormatParser(userHourFormat) : HourFormats.Long;

  const getInitialTime = () => {
    switch (selectedField) {
      case CalendarDateFieldType.Start:
        return startDateTime;
      case CalendarDateFieldType.End:
        return endDateTime;
      case CalendarDateFieldType.None:
      default:
        return undefined;
    }
  };

  // If the event spans multiple days
  const isMultiDay = startDateTime ? !startDateTime.isSame(endDateTime, DAY_UNIT) || isAllDay : false;

  const isTimeFieldDisabled = isReadOnly || isAllDay;

  const updateDate = (newDateTime: DateTime) => {
    setDateTime(newDateTime);
    const { startDateTime: newStartDateTime, endDateTime: newEndDateTime } = newDateTime;

    // If it is an all day event, we do not want to factor in the timezone and
    // the start and end dates should be the start of the day in UTC
    const transformedStartDate = isAllDay ? getStartOfDateInUTC(newStartDateTime) : newStartDateTime;
    const transformedEndDate = isAllDay ? getStartOfDateInUTC(newEndDateTime) : newEndDateTime;

    void updateEventDetails({
      plainContent: {
        startDate: transformedStartDate.valueOf(),
        endDate: transformedEndDate.valueOf()
      }
    });
    // move so that the selected date is in view
    jumpToDate(newStartDateTime);
  };

  const onToggleChange = () => {
    if (isReadOnly || !startDateTime || !endDateTime) return;
    const updatedIsAllDay = !isAllDay;
    setIsAllDay(updatedIsAllDay);
    // If it is an all day event, we do not want to factor in the timezone
    // If we are changing from an all day event to non all day, set the
    // start time and end time to include the user's timezone
    const newEndDate = updatedIsAllDay ? endDateTime.startOf(DATE_UNIT).utc(true) : endDateTime.tz(userTimezone, true);
    const newStartDate = updatedIsAllDay
      ? startDateTime.startOf(DATE_UNIT).utc(true)
      : startDateTime.tz(userTimezone, true);

    // Update date on toggling
    updateDate({
      startDateTime: newStartDate,
      endDateTime: newEndDate
    });

    void updateEventDetails({
      decryptedContent: { isAllDay: !isAllDay },
      plainContent: {
        startDate: newStartDate.valueOf(),
        endDate: newEndDate.valueOf()
      }
    });
  };

  const updateStartTime = (newStartTime: Dayjs) => {
    const newEndTime =
      startDateTime && endDateTime
        ? getNewEndTime(newStartTime, startDateTime, endDateTime)
        : getDefaultEndTime(newStartTime);

    updateDate({
      startDateTime: newStartTime,
      endDateTime: newEndTime
    });

    setTimeout(() => {
      // scroll to start time within current week
      scrollToSelectedEvent();
    }, 600); // wait for event to be added to calendar
  };

  const updateEndTime = (newEndTime: Dayjs) => {
    let updatedTime = newEndTime;
    if (!startDateTime) return;
    // If the updatedTime is before the initialTime
    // that means the updatedTime should be updated to be 1 day following the initialTime
    if (!isMultiDay && newEndTime.isBefore(startDateTime)) {
      updatedTime = updatedTime.add(1, DAY_UNIT);
    }
    updateDate({
      startDateTime,
      endDateTime: updatedTime
    });
  };

  const handleTimeChange = (newTime: string | Dayjs) => {
    const parsed = dayjs(typeof newTime === 'string' ? newTime.toUpperCase() : newTime, timeFormat);
    const initialTime = getInitialTime();
    if (!parsed.isValid() || !initialTime) return;
    // TODO @ororsatti revert changes after dayjs PR #2144 is merged
    const updatedTime = dayjs(initialTime)
      .set(HOUR_UNIT, parsed.hour())
      .set(MINUTE_UNIT, parsed.minute())
      .set(DATE_UNIT, initialTime.date())
      .tz(userTimezone);

    if (selectedField === CalendarDateFieldType.Start) return updateStartTime(updatedTime);
    else if (selectedField === CalendarDateFieldType.End) return updateEndTime(updatedTime);
    else {
      console.error('Failed to handle time change: No time field selected');
      return;
    }
  };

  const handleStartDateSelect = (newDate: Date | null | unknown) => {
    if (newDate && startDateTime && endDateTime) {
      const { month, date, year } = getMonthDateYear(newDate as Date);
      const newStartDate = setMonthDateYear(startDateTime, month, date, year);
      let newEndDate = setMonthDateYear(endDateTime, month, date, year);
      if (isMultiDay) {
        // If the new start date is past the original end date, push the whole event
        if (!endDateTime.isAfter(newStartDate)) {
          newEndDate = getNewEndTime(newStartDate, startDateTime, endDateTime);
          // Else it's multi-day and end is still past the new start date, use original date
        } else {
          newEndDate = endDateTime;
        }
      }
      updateDate({
        startDateTime: newStartDate,
        endDateTime: newEndDate
      });
    }
  };

  const handleEndDateSelect = (newDate: Date | null | unknown) => {
    setDateTimeInputError(false);

    if (newDate && startDateTime && endDateTime) {
      const { month, date, year } = getMonthDateYear(newDate as Date);
      const newEndDate = setMonthDateYear(endDateTime, month, date, year);

      // If the newEndDate time is before the newStartDate time, validation error
      // All day events can start and end on the same date
      if (newEndDate.isBefore(startDateTime)) {
        enqueueToast({ title: 'Invalid time', body: 'End date must be after start date.' });
        setDateTimeInputError(true);
        return;
      }

      updateDate({
        startDateTime,
        endDateTime: newEndDate
      });
    }
  };

  const renderAllDayToggle = () => {
    return isMobile ? (
      <MobileAllDayToggle>
        <MobileAllDayText>
          <Icons color='disabled' icon={Icon.Sun} size={Size.SMALL} />
          <Typography color='secondary' onClick={onToggleChange}>
            All day
          </Typography>
        </MobileAllDayText>
        <ToggleContainer>
          <Toggle checked={isAllDay} disabled={isReadOnly} onChange={onToggleChange} />
        </ToggleContainer>
      </MobileAllDayToggle>
    ) : (
      <AllDayToggle>
        <ToggleContainer>
          <Toggle checked={isAllDay} disabled={isReadOnly} onChange={onToggleChange} size={Size.SMALL} />
        </ToggleContainer>
        <Typography color='secondary' onClick={onToggleChange} size={TypographySize.SMALL}>
          All day
        </Typography>
      </AllDayToggle>
    );
  };

  const eventOrDraftRecurring =
    (selectedEvent && isRecurringEvent(selectedEvent)) || (selectedDraft && isRecurringEvent(selectedDraft));
  const showRecurring = eventOrDraftRecurring || !isReadOnly;
  const showAllDay = !isReadOnly || isAllDay;

  const preSubmitCustomDateAction = () => {
    setIsUpdatingEvent?.(true);
  };

  const postSubmitCustomDateAction = () => {
    // Wait for the `isUpdatingEvent` state to be set and prevent the CalendarSidebar click outside handler from closing the sidebar
    // Then set it back to false after the next tick
    performOnNextTik(() => {
      setIsUpdatingEvent?.(false);
    });
  };

  return (
    <TimeAndDateContainer>
      <MultiDateTime>
        <DateField
          date={startDateTime}
          isMultiDay={isMultiDay}
          isReadOnly={isReadOnly}
          onSelectDate={handleStartDateSelect}
          postSubmitCustomDateAction={postSubmitCustomDateAction}
          preSubmitCustomDateAction={preSubmitCustomDateAction}
          showIcon
        />
        {isMultiDay && (
          <>
            <IconContainer>
              <Icons color='secondary' icon={Icon.ArrowRight} size={Size.SMALL} />
            </IconContainer>
            <DateField
              date={endDateTime}
              error={dateTimeInputError}
              isEndDate
              isMultiDay={isMultiDay}
              isReadOnly={isReadOnly}
              minDate={startDateTime?.toDate()}
              onSelectDate={handleEndDateSelect}
              postSubmitCustomDateAction={postSubmitCustomDateAction}
              preSubmitCustomDateAction={preSubmitCustomDateAction}
            />
          </>
        )}
      </MultiDateTime>
      {/**
       * Disable time fields for all day events, since it isn't relevant.
       * Disabling both time fields differs (visually) from the time fields
       * being read-only. */}
      <MultiDateTime $isDisabled={isAllDay}>
        <TimeField
          date={startDateTime}
          isReadOnly={isTimeFieldDisabled}
          onSelectTime={handleTimeChange}
          setIsUpdatingEvent={setIsUpdatingEvent}
          setSelectedField={setSelectedField}
          type={CalendarDateFieldType.Start}
        />
        <IconContainer>
          <Icons color='secondary' icon={Icon.ArrowRight} size={Size.SMALL} />
        </IconContainer>
        <TimeField
          date={endDateTime}
          error={dateTimeInputError} // only show the error on the end time since the start time is never invalid
          initialTime={startDateTime}
          isMultiDay={isMultiDay}
          isReadOnly={isTimeFieldDisabled}
          onSelectTime={handleTimeChange}
          setIsUpdatingEvent={setIsUpdatingEvent}
          setSelectedField={setSelectedField}
          type={CalendarDateFieldType.End}
        />
      </MultiDateTime>
      {(showRecurring || showAllDay) && (
        <AllDayRecurrenceContainer>
          {showAllDay && renderAllDayToggle()}
          {showRecurring && (
            <Recurrence
              currentRRule={recurrenceRule}
              dateTime={dateTime}
              isAllDay={isAllDay}
              isReadOnly={isReadOnly}
              updateRecurrence={async (updateRRule: RecurrenceRule | null) => {
                if (recurrenceRule?.toJsonString() !== updateRRule?.toJsonString()) {
                  let newRule = updateRRule;
                  // If it's an all day event and there's an until date set, set it to UTC
                  // as we do not want to factor in timezones for all day events
                  if (updateRRule?.until && isAllDay) {
                    newRule = new RecurrenceRule({
                      ...updateRRule,
                      until: dayjs(updateRRule.until).utc(true).valueOf()
                    });
                  }
                  await updateEventDetails({ plainContent: { recurrenceRule: newRule || null } });
                  setRecurrenceRule(newRule);
                }
              }}
            />
          )}
        </AllDayRecurrenceContainer>
      )}
    </TimeAndDateContainer>
  );
};
