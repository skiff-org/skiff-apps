import {
  Divider,
  DividerType,
  FilledVariant,
  IconText,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { Suspense, useEffect } from 'react';
import {
  DateFormats,
  EncryptionBadge,
  EncryptionBadgeTypes,
  useUserPreference,
  lazyWithPreload
} from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import {
  dateToFormatString,
  getUserGuessedTimeZone,
  getWeekStartAndEndDates,
  useAppSelector,
  useLocalSetting
} from '../../utils';
import { useCurrentCalendarView } from '../../utils/hooks/useCalendarView';
import useJumpToDate from '../../utils/hooks/useJumpToDate';

import { CalendarController } from './CalendarController';
import { CalendarViewController } from './CalendarViewController';

const SyncStateBadge = lazyWithPreload(() => import('./SyncStateBadge'));

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 24px;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
  user-select: none;
`;

const StyledYear = styled.span`
  margin-left: 8px;
  color: var(--text-disabled);
  font-weight: 360;
`;

const ActionButtons = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BadgeContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledDivider = styled(Divider)`
  margin: 0 4px;
`;

export const CalendarHeader: React.FC = () => {
  const { jumpToToday } = useJumpToDate();
  const { selectedViewDate } = useAppSelector((state) => state.time);
  const { currCalendarView } = useCurrentCalendarView();

  const [userPreferredTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const timeZone = userPreferredTimezone ?? getUserGuessedTimeZone();

  const [localStartDay] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);
  const { weekStartDate, weekEndDate } = getWeekStartAndEndDates(selectedViewDate, localStartDay, timeZone);

  useEffect(() => {
    void Promise.all([SyncStateBadge.preload()]);
  }, []);

  const renderMonthAndYearHeaderText = (): JSX.Element => {
    // If view overlaps multiple months, show an abbreviate version of both
    // In month view we always show current month
    if (weekStartDate.month() !== weekEndDate.month() && currCalendarView !== CalendarView.Monthly) {
      // If years are also different, include the start week year
      const startWeekYear =
        weekStartDate.year() !== weekEndDate.year() ? (
          <StyledYear>{dateToFormatString(weekStartDate, DateFormats.FullYear)}</StyledYear>
        ) : null;

      const formattedStartMonth = dateToFormatString(weekStartDate, DateFormats.AbbreviatedMonth);

      const formattedEndMonth = dateToFormatString(weekEndDate, DateFormats.AbbreviatedMonth);

      return (
        <Typography size={TypographySize.H3} weight={TypographyWeight.BOLD}>
          {/* Dec */}
          {formattedStartMonth}
          {/* 2022 */}
          {startWeekYear}
          {/* –	*/}
          {<span> &ndash; </span>}
          {/* Jan */}
          {formattedEndMonth}
          {/* 2023 */}
          <StyledYear>{dateToFormatString(weekEndDate, DateFormats.FullYear)}</StyledYear>
        </Typography>
      );
    }

    // Else, just display full current month
    // In weekly view, we get month/year of week start date
    // In monthly view, we get month/year of selected date
    const dateForCurrentMonthAndYear = currCalendarView === CalendarView.Weekly ? weekStartDate : selectedViewDate;
    return (
      <Typography size={TypographySize.H3} weight={TypographyWeight.BOLD}>
        {dateToFormatString(dateForCurrentMonthAndYear, DateFormats.FullMonth)}
        <StyledYear>{dateToFormatString(dateForCurrentMonthAndYear, DateFormats.FullYear)}</StyledYear>
      </Typography>
    );
  };

  return (
    <Header>
      {renderMonthAndYearHeaderText()}
      <BadgeContainer>
        <EncryptionBadge
          tooltipSubtext='All events, locations, titles, descriptions, links, and external guests are end-to-end encrypted.'
          type={EncryptionBadgeTypes.E2EE}
        />
        <Suspense fallback={<></>}>
          <SyncStateBadge />
        </Suspense>
      </BadgeContainer>
      <ActionButtons>
        <CalendarController />
        <StyledDivider color='tertiary' height={27} type={DividerType.VERTICAL} />
        <IconText label='Today' onClick={jumpToToday} variant={FilledVariant.FILLED} />
        <CalendarViewController />
      </ActionButtons>
    </Header>
  );
};
