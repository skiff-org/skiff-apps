import { Dayjs } from 'dayjs';
import range from 'lodash/range';
import { Typography, TypographySize } from 'nightwatch-ui';
import React, { FC, useState, useRef, memo } from 'react';
import { isSameDate, TimeZonePicker } from 'skiff-front-utils';
import { DayFormats } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { WEB_HEADER_HEIGHT } from '../../constants/calendar.constants';
import { DAYS_IN_WEEK, DAY_UNIT } from '../../constants/time.constants';
import { timeReducer } from '../../redux/reducers/timeReducer';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { dateToFormatString, useAppDispatch, useAppSelector, useLocalSetting } from '../../utils';
import { useCurrentCalendarView } from '../../utils/hooks/useCalendarView';
import { useCurrentTimeZone } from '../../utils/hooks/useCurrentTimeZone';

import { AllDayEvents } from './AllDayEvents';
import { WeekDayDateCell } from './WeekDayDateCell';

const WebHeaderContainer = styled.div`
  background-color: var(--bg-l2-solid);
  user-select: none;
`;

const WeeklyViewHeaderContainer = styled.div`
  display: grid;
  grid-template-columns: var(--scale-mark-width) repeat(${DAYS_IN_WEEK}, 1fr);
`;

const MonthlyViewHeaderContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${DAYS_IN_WEEK}, 1fr);
  height: ${WEB_HEADER_HEIGHT}px;
`;

const LabelCell = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 10px 8px 0;
  background: var(--bg-l2-solid);
`;

const TimeZoneButton = styled.div<{ $isActive: boolean }>`
  padding: 4px 8px;
  width: fit-content;
  border-radius: 6px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  cursor: pointer;

  ${({ $isActive }) => {
    const bgStyles = 'background: var(--bg-cell-hover);';
    return $isActive
      ? bgStyles
      : `
      :hover {
        ${bgStyles}
      }
      `;
  }}
`;

interface WebHeaderProps {
  daysToShow: number;
  firstDay: Dayjs;
  allDayEventsInView: DecryptedDraft[][];
}

const WebHeader: FC<WebHeaderProps> = ({ daysToShow, firstDay, allDayEventsInView }) => {
  const { currentTime, selectedViewDate } = useAppSelector((state) => state.time);
  const dispatch = useAppDispatch();
  const { label: timeZoneLabel } = useCurrentTimeZone();
  const [timeZone, setTimeZone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const { currCalendarView } = useCurrentCalendarView();

  const [isTimeZonePickerOpen, setIsTimeZonePickerOpen] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);

  const onSelectTimeZone = (tzName: string) => {
    setTimeZone(tzName);
    dispatch(timeReducer.actions.setSelectedViewDate(selectedViewDate.tz(tzName)));
  };

  return (
    <WebHeaderContainer>
      {currCalendarView === CalendarView.Weekly && (
        <WeeklyViewHeaderContainer>
          <LabelCell>
            <TimeZoneButton
              $isActive={isTimeZonePickerOpen}
              onClick={() => setIsTimeZonePickerOpen(true)}
              ref={buttonRef}
            >
              <Typography color='secondary' size={TypographySize.SMALL}>
                {timeZoneLabel}
              </Typography>
            </TimeZoneButton>
          </LabelCell>
          <TimeZonePicker
            buttonRef={buttonRef}
            isOpen={isTimeZonePickerOpen}
            onSelectTimeZone={onSelectTimeZone}
            setIsOpen={setIsTimeZonePickerOpen}
            timeZone={timeZone}
          />
          {range(DAYS_IN_WEEK).map((value) => {
            const weekDayDate = firstDay.add(value, DAY_UNIT);
            const isToday = isSameDate(currentTime, weekDayDate);
            const isSelectedDay = isSameDate(selectedViewDate, weekDayDate);
            return (
              <WeekDayDateCell isToday={isToday} key={value} selectedDay={isSelectedDay}>
                {`${dateToFormatString(weekDayDate, DayFormats.ShortName).toUpperCase()} ${dateToFormatString(
                  weekDayDate,
                  DayFormats.ShortDate
                )}`}
              </WeekDayDateCell>
            );
          })}
          <AllDayEvents allDayEventsInView={allDayEventsInView} daysToShow={daysToShow} firstDay={firstDay} />
        </WeeklyViewHeaderContainer>
      )}
      {currCalendarView === CalendarView.Monthly && (
        <MonthlyViewHeaderContainer>
          {range(DAYS_IN_WEEK).map((value) => {
            const weekDayDate = firstDay.add(value, DAY_UNIT);
            return (
              <WeekDayDateCell isToday={false} key={value} selectedDay={false}>
                {dateToFormatString(weekDayDate, DayFormats.ShortName).toUpperCase()}
              </WeekDayDateCell>
            );
          })}
        </MonthlyViewHeaderContainer>
      )}
    </WebHeaderContainer>
  );
};

export default memo(WebHeader);
