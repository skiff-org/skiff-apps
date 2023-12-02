import dayjs, { Dayjs } from 'dayjs';
import {
  ButtonGroup,
  ButtonGroupItem,
  CircularProgress,
  DropdownItem,
  FilledVariant,
  Select,
  Size,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import { Dispatch, SetStateAction, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetEmailImportMetaQuery } from 'skiff-front-graphql';
import { DATE_UNIT, DAY_UNIT, DateField, MONTH_UNIT } from 'skiff-front-utils';
import { EmailImportDateRange, EmailImportDateRangeType, ImportClients } from 'skiff-graphql';
import { TierName, getStorageLimitInMb, mbToGb } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { ImportMailStepHeader } from './ImportMailStepHeader';
import { TimeFrameOption } from './ImportMailStepsModal.constants';
import { UpgradeText } from './UpgradeText';

const TimeFrameOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
  ${isMobile &&
  css`
    flex-direction: column;
    gap: 8px;
  `}
`;

const RowTitle = styled(Typography)`
  padding-top: 6px;
`;

const CustomDates = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const CustomDatesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LoadingContainer = styled.div`
  padding: 16px;
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
`;

interface SelectTimeFrameProps {
  importClient: ImportClients;
  onClose: () => void;
  onContinue: () => void;
  importID: string | undefined;
  setSelectedDateRange: Dispatch<SetStateAction<EmailImportDateRange | undefined>>;
  planTier: TierName;
  openUpgradeModal: () => void;
  loading: boolean;
}

export const SelectTimeFrame: React.FC<SelectTimeFrameProps> = ({
  onClose,
  onContinue,
  importClient,
  importID,
  setSelectedDateRange,
  planTier,
  openUpgradeModal,
  loading
}: SelectTimeFrameProps) => {
  const currentTime = dayjs();
  const initialCustomStartDate = currentTime.subtract(3, MONTH_UNIT);
  const initialCustomEndDate = currentTime;
  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [selectedTimeFrame, setSelectedTimeFrame] = useState(TimeFrameOption.THREE_MONTHS);
  const [customStartDate, setCustomStartDate] = useState<Dayjs | undefined>(initialCustomStartDate);
  const [customEndDate, setCustomEndDate] = useState<Dayjs | undefined>(initialCustomEndDate);
  const [endDateInputError, setEndDateInputError] = useState('');

  const timeFrameOptionToGraphql = () => {
    switch (selectedTimeFrame) {
      case TimeFrameOption.ONE_MONTH:
        return EmailImportDateRangeType.Last_1Month;
      case TimeFrameOption.THREE_MONTHS:
        return EmailImportDateRangeType.Last_3Months;
      case TimeFrameOption.TWELVE_MONTHS:
        return EmailImportDateRangeType.Last_12Months;
      case TimeFrameOption.EVERYTHING:
        return EmailImportDateRangeType.All;
      case TimeFrameOption.CUSTOM:
        return EmailImportDateRangeType.Custom;
    }
  };

  const convertDateForQuery = (dayjsDate: Dayjs) => {
    return dayjsDate.startOf(DAY_UNIT).toDate();
  };

  const customDateRangeToGraphql = () => {
    return customStartDate && customEndDate && selectedTimeFrame === TimeFrameOption.CUSTOM
      ? {
          start: convertDateForQuery(customStartDate),
          end: convertDateForQuery(customEndDate)
        }
      : undefined;
  };

  const currentSelectedDateRange: EmailImportDateRange = {
    clientTimeZone,
    rangeType: timeFrameOptionToGraphql(),
    customDateRange: customDateRangeToGraphql()
  };

  const { data, loading: importMetaDataLoading } = useGetEmailImportMetaQuery({
    variables: {
      request: {
        client: importClient,
        importID: importID ?? '',
        dateRange: currentSelectedDateRange
      }
    },
    // Skip for Gmail, as the Gmail API does not provide reliable count estimates
    skip: !importID || !!endDateInputError || importClient === ImportClients.Gmail
  });

  const numMessagesToImport =
    importClient === ImportClients.Gmail || importClient === ImportClients.Outlook
      ? undefined
      : data?.emailImportMeta.estimatedEmailCount;

  const isCustomTimeFrame = selectedTimeFrame === TimeFrameOption.CUSTOM;

  const handleCustomEndDateSelect = (newDate: Date | null | unknown) => {
    if (!newDate) return;
    setEndDateInputError('');
    const newCustomEndDate = dayjs(newDate as Date);

    if (newCustomEndDate.isBefore(customStartDate, DATE_UNIT)) {
      setEndDateInputError('End date must be after start date.');
      return;
    }

    setCustomEndDate(newCustomEndDate);
  };

  const handleCustomStartDateSelect = (newDate: Date | null | unknown) => {
    if (!newDate) return;
    setEndDateInputError('');
    const newCustomStartDate = dayjs(newDate as Date);

    // If the new start date is after the current end date, set the end date to be the same as the start date
    if (newCustomStartDate.isAfter(customEndDate, DATE_UNIT)) {
      setCustomEndDate(newCustomStartDate);
    }
    setCustomStartDate(newCustomStartDate);
  };

  const isDataLoading = loading || importMetaDataLoading || !importID;

  const renderStorageUpgrade = () => {
    // If the current plan is not Pro or Business (Pro is the highest plan we
    // offer in the upgrade modal), show the upgrade option
    if (planTier !== TierName.Pro && planTier !== TierName.Business) {
      return (
        <UpgradeText
          openUpgradeModal={openUpgradeModal}
          text={`Import up to ${mbToGb(getStorageLimitInMb(planTier))} GB of storage.`}
        />
      );
    }
    return undefined;
  };

  return (
    <>
      <ImportMailStepHeader numItems={numMessagesToImport} title='Import emails' />
      {isDataLoading && (
        <LoadingContainer>
          <CircularProgress spinner />
        </LoadingContainer>
      )}
      {!isDataLoading && (
        <>
          <TimeFrameOptionsContainer>
            <Row>
              <RowTitle>Import since</RowTitle>
              <Select
                onChange={(value) => {
                  // If we are changing to a custom time frame, set the start
                  // and end dates to their initial states
                  if (value === TimeFrameOption.CUSTOM) {
                    setCustomStartDate(initialCustomStartDate);
                    setCustomEndDate(initialCustomEndDate);
                  } else {
                    setCustomStartDate(undefined);
                    setCustomEndDate(undefined);
                  }
                  setSelectedTimeFrame(value as TimeFrameOption);
                }}
                size={isMobile ? Size.MEDIUM : Size.SMALL}
                value={selectedTimeFrame}
                variant={FilledVariant.FILLED}
                width={isMobile ? undefined : 270}
              >
                {Object.entries(TimeFrameOption).map(([option, value]) => {
                  return (
                    <DropdownItem active={option === selectedTimeFrame} key={option} label={value} value={value} />
                  );
                })}
              </Select>
            </Row>
            {isCustomTimeFrame && (
              <Row>
                <RowTitle>Custom date</RowTitle>
                <CustomDatesContainer>
                  <CustomDates>
                    <DateField
                      customDisplayedDateFormat='MMM DD, YYYY'
                      date={customStartDate}
                      onSelectDate={handleCustomStartDateSelect}
                      width={isMobile ? undefined : 120}
                    />
                    <Typography color='disabled' minWidth={16}>
                      to
                    </Typography>
                    <DateField
                      customDisplayedDateFormat='MMM DD, YYYY'
                      date={customEndDate}
                      error={!!endDateInputError}
                      minDate={customStartDate?.toDate()}
                      onSelectDate={handleCustomEndDateSelect}
                      width={isMobile ? undefined : 120}
                    />
                  </CustomDates>
                  {endDateInputError && (
                    <Typography color='destructive' size={TypographySize.SMALL} wrap>
                      {endDateInputError}
                    </Typography>
                  )}
                </CustomDatesContainer>
              </Row>
            )}
          </TimeFrameOptionsContainer>
          {renderStorageUpgrade()}
        </>
      )}
      <ButtonGroup>
        <ButtonGroupItem
          label='Continue'
          onClick={() => {
            if (endDateInputError) return;
            onContinue();
            setSelectedDateRange(currentSelectedDateRange);
          }}
        />
        <ButtonGroupItem label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </>
  );
};
