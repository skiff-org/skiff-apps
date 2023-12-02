import { Dayjs } from 'dayjs';
import {
  Alignment,
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DropdownItem,
  FilledVariant,
  InputField,
  InputType,
  Layout,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { DateField, DateFormats, RadioCheckbox, SelectField } from 'skiff-front-utils';
import { RecurrenceDay, RecurrenceFrequency } from 'skiff-graphql';
import { MAX_RECURRENCE_COUNT, RecurrenceRule } from 'skiff-ics';
import { StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { RADIO_BUTTON_CLASS_NAME } from '../../../constants/calendar.constants';
import { DAY_UNIT } from '../../../constants/time.constants';
import { getLocalSettingCurrentValue } from '../../../utils';
import { dayjs } from '../../../utils/dateTimeUtils';

import { RECURRENCE_DAYS_ORDERED, REPEAT_OPTIONS } from './constants';
import { EndRecurrenceType } from './types';
import { shiftDays, useByDaysShift } from './useShouldShiftDays';
import { getDefaultRecurringEndDate } from './utils';

const LABEL_WIDTH = 150;
const SQUARE_BUTTON_CLASSNAME = 'recurrence-modal-square-button';

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 10px;
  ${isMobile
    ? css`
        padding: 0px 10px 30px 10px;
      `
    : ''}
`;

const FrequencyRow = styled.div`
  height: 36px;
  display: grid;
  width: 100%;
  grid-template-columns: ${isMobile ? '1fr' : '90px'} 2fr;
  align-items: center;
`;

const DayRow = styled.div`
  display: flex;
  align-items: center;
  ${isMobile
    ? css`
        justify-content: space-between;
      `
    : ''}
  gap: 8px;
  width: ${isMobile ? '100%' : 'fit-content'};
`;

const EndRow = styled.div`
  width: 100%;
`;

const SmallInputContainer = styled.div`
  min-width: 76px;
  margin-right: 4px;
`;

// applied only to SquareButton class to avoid the syling being applied to DropdownItem
const SquareButton = styled.div<{ $active: boolean }>`
  &.${SQUARE_BUTTON_CLASSNAME} {
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    background: var(--cta-secondary-default);
    border-radius: 12px;
    border: 1px solid var(--border-secondary);
    cursor: pointer;
    ${({ $active }) =>
      $active &&
      css`
        background-color: #ef5a3c !important;
      `};
  }
`;

const EndRecurrenceSelect = styled.div`
  min-height: 36px;
  display: grid;
  grid-template-columns: ${isMobile ? '1fr' : '90px'} 2fr;
  margin-bottom: 12px;
  width: 100%;
  align-items: center;
`;

const RadioWithLabelContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
`;

const BottomRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/**
 * used to change layout on mobile
 */
const OptionRowContainer = styled.div<{ $alignCenter?: boolean }>`
  ${({ $alignCenter }) =>
    isMobile
      ? css`
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        `
      : css`
          display: grid;
          width: 100%;
          grid-template-columns: ${LABEL_WIDTH}px 1fr;
          ${$alignCenter ? `align-items: center;` : ''}
        `}
`;

const InputError = styled.div<{ $includeTopMargin: boolean }>`
  grid-column-start: 2;
  ${({ $includeTopMargin }) =>
    $includeTopMargin &&
    css`
      margin-top: 4px;
    `}
`;

const EndTitleText = styled.div`
  padding-top: 8px;
`;

const RadioWithLabel = ({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) => {
  return (
    <RadioWithLabelContainer className={RADIO_BUTTON_CLASS_NAME} onClick={onClick}>
      <RadioCheckbox
        checked={checked}
        onClick={(e) => {
          // prevent the modal from off-clicking
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
      />
      <Typography>{label}</Typography>
    </RadioWithLabelContainer>
  );
};

const getEndRecurrenceType = (currentRRule?: RecurrenceRule | null) => {
  if (!currentRRule) return EndRecurrenceType.Never;
  if (currentRRule.until) return EndRecurrenceType.On;
  if (currentRRule.count) return EndRecurrenceType.After;

  return EndRecurrenceType.Never;
};

export interface CustomRecurrenceRuleContentProps {
  closeCustomRule: () => void;
  startDate: Dayjs;
  updateRecurrence: (recurrenceRule: RecurrenceRule | null) => Promise<void>;
  currentRRule?: RecurrenceRule | null;
  isAllDay: boolean;
}

export const CustomRecurrenceRuleContent = ({
  closeCustomRule,
  updateRecurrence,
  currentRRule,
  startDate,
  isAllDay
}: CustomRecurrenceRuleContentProps) => {
  const byDaysShift = useByDaysShift(startDate, currentRRule?.timezone);

  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    currentRRule?.frequency || RecurrenceFrequency.Weekly
  );

  const [frequencyInterval, setFrequencyInterval] = useState<string>(
    currentRRule?.interval ? `${currentRRule.interval}` : `1`
  );

  const byDaysStart = currentRRule?.byDays || [RECURRENCE_DAYS_ORDERED[startDate.get(DAY_UNIT)]];

  const [repeatDays, setRepeatDays] = useState<RecurrenceDay[]>(shiftDays(byDaysStart, byDaysShift));
  const [endRecurrenceType, setEndRecurrenceType] = useState<EndRecurrenceType>(getEndRecurrenceType(currentRRule));
  const [endRecurrenceDate, setEndRecurrenceDate] = useState<number | undefined>(currentRRule?.until);
  const [endRecurrenceTimes, setEndRecurrenceTimes] = useState<string | undefined>(
    currentRRule?.count ? `${currentRRule.count}` : '10'
  );
  const [frequencyError, setFrequencyError] = useState<string>();
  const [endDateError, setEndDateError] = useState<string>();
  const [numOccurrencesError, setNumOccurrencesError] = useState<string>();
  const error = frequencyError || endDateError || numOccurrencesError;

  /**
   * add/remove repeat days.
   * If the clicked day is already selected - remove it, if not - add it
   * @param day
   */
  const updateRepeatDays = (day: RecurrenceDay) => {
    if (repeatDays.includes(day)) {
      // Removing the given day from the selection
      setRepeatDays((old) => {
        // enforce at least one selected day
        if (old.length === 1) return old;

        const updatedDays = old.filter((oldDay) => oldDay !== day);
        return updatedDays;
      });
    } else {
      // Adding the given day to the selection
      setRepeatDays((old) => {
        const updatedDays = [...old];
        updatedDays.push(day);
        return updatedDays;
      });
    }
  };

  const saveRecurrenceUpdates = () => {
    const timezone = getLocalSettingCurrentValue(StorageTypes.TIME_ZONE);
    void updateRecurrence(
      new RecurrenceRule({
        startDate: startDate.valueOf(),
        frequency,
        interval: parseInt(frequencyInterval),
        byDays:
          repeatDays.length && frequency === RecurrenceFrequency.Weekly
            ? shiftDays(repeatDays, -byDaysShift)
            : undefined,
        until: endRecurrenceType === EndRecurrenceType.On ? endRecurrenceDate : undefined,
        count:
          endRecurrenceType === EndRecurrenceType.After && endRecurrenceTimes
            ? parseInt(endRecurrenceTimes)
            : undefined,
        timezone,
        isAllDay
      })
    );
    closeCustomRule();
  };

  const renderInputError = (errorMsg: string, includeTopMargin?: boolean) => (
    <InputError $includeTopMargin={!!includeTopMargin}>
      <Typography color='destructive' size={TypographySize.SMALL}>
        {errorMsg}
      </Typography>
    </InputError>
  );

  return (
    <OptionsContainer>
      <OptionRowContainer $alignCenter>
        <Typography>Repeat every</Typography>
        <FrequencyRow>
          <SmallInputContainer>
            <InputField
              error={!!frequencyError}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (+e.target.value < 1) {
                  setFrequencyError('Must be at least 1');
                } else if (frequencyError) {
                  setFrequencyError(undefined);
                }
                setFrequencyInterval(e.target.value);
              }}
              placeholder='0'
              size={isMobile ? Size.MEDIUM : Size.SMALL}
              type={InputType.NUMBER}
              value={frequencyInterval}
            />
          </SmallInputContainer>
          <SelectField
            onChange={(value) => setFrequency(value as RecurrenceFrequency)}
            size={isMobile ? Size.MEDIUM : Size.SMALL}
            value={frequency}
            variant={FilledVariant.FILLED}
            width={!isMobile ? 224 : undefined}
          >
            {REPEAT_OPTIONS.map((repeatOption) => (
              <DropdownItem
                active={frequency === repeatOption.frequency}
                key={`${repeatOption.unitLabel}-label`}
                label={pluralize(repeatOption.unitLabel, parseInt(frequencyInterval))}
                value={repeatOption.frequency}
              />
            ))}
          </SelectField>
        </FrequencyRow>
        {frequencyError && renderInputError(frequencyError, !isMobile)}
      </OptionRowContainer>
      {frequency === RecurrenceFrequency.Weekly && (
        <OptionRowContainer $alignCenter>
          <Typography>Repeats on</Typography>
          <DayRow>
            {RECURRENCE_DAYS_ORDERED.map((day) => {
              const isActive = repeatDays.includes(day);
              return (
                <SquareButton
                  $active={isActive}
                  className={SQUARE_BUTTON_CLASSNAME}
                  key={`${day}-button`}
                  onClick={() => updateRepeatDays(day)}
                >
                  <Typography
                    align={Alignment.CENTER}
                    color={isActive ? 'white' : 'primary'}
                    weight={isActive ? TypographyWeight.MEDIUM : TypographyWeight.REGULAR}
                  >
                    {day[0]}
                  </Typography>
                </SquareButton>
              );
            })}
          </DayRow>
        </OptionRowContainer>
      )}
      <OptionRowContainer>
        <Typography>
          <EndTitleText>Ends</EndTitleText>
        </Typography>
        <EndRow>
          <EndRecurrenceSelect>
            <RadioWithLabel
              checked={endRecurrenceType === EndRecurrenceType.Never}
              label='never'
              onClick={() => setEndRecurrenceType(EndRecurrenceType.Never)}
            />
          </EndRecurrenceSelect>
          <EndRecurrenceSelect>
            <RadioWithLabel
              checked={endRecurrenceType === EndRecurrenceType.On}
              label='on'
              onClick={() => {
                setEndRecurrenceType(EndRecurrenceType.On);
                if (endRecurrenceType !== EndRecurrenceType.On) {
                  setEndRecurrenceDate(endRecurrenceDate || getDefaultRecurringEndDate(startDate, frequency));
                }
              }}
            />
            <DateField
              customDisplayedDateFormat={DateFormats.ShortWithYear}
              date={dayjs(endRecurrenceDate || getDefaultRecurringEndDate(startDate, frequency))}
              error={!!endDateError}
              minDate={startDate.toDate()}
              onSelectDate={(date: Date | null | unknown) => {
                if (!date) return;
                if ((date as Date).getTime() < startDate.valueOf()) {
                  setEndDateError('Must be on or after the start date');
                } else if (endDateError) {
                  setEndDateError(undefined);
                }

                const asDayjs = dayjs(date as Date);
                // set the date as the end of the selected date
                setEndRecurrenceDate(
                  dayjs(startDate)
                    .set('date', asDayjs.get('date'))
                    .set('month', asDayjs.get('month'))
                    .set('year', asDayjs.get('year'))
                    .valueOf()
                );
                if (endRecurrenceType !== EndRecurrenceType.On) setEndRecurrenceType(EndRecurrenceType.On);
              }}
            />
            {endDateError && renderInputError(endDateError)}
          </EndRecurrenceSelect>
          <EndRecurrenceSelect>
            <RadioWithLabel
              checked={endRecurrenceType == EndRecurrenceType.After}
              label='after'
              onClick={() => setEndRecurrenceType(EndRecurrenceType.After)}
            />
            <InputField
              endAdornment={
                <Typography color='disabled' size={TypographySize.SMALL}>
                  times
                </Typography>
              }
              error={!!numOccurrencesError}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (+e.target.value < 1) {
                  setNumOccurrencesError('Must be at least 1');
                } else if (+e.target.value > MAX_RECURRENCE_COUNT) {
                  setNumOccurrencesError(`Must be less than ${MAX_RECURRENCE_COUNT}`);
                } else if (numOccurrencesError) {
                  setNumOccurrencesError(undefined);
                }
                setEndRecurrenceTimes(e.target.value);
                if (endRecurrenceType !== EndRecurrenceType.After) setEndRecurrenceType(EndRecurrenceType.After);
              }}
              placeholder='0'
              size={isMobile ? Size.MEDIUM : Size.SMALL}
              type={InputType.NUMBER}
              value={endRecurrenceTimes}
            />
            {numOccurrencesError && renderInputError(numOccurrencesError, true)}
          </EndRecurrenceSelect>
        </EndRow>
      </OptionRowContainer>
      <BottomRowContainer>
        <ButtonGroup fullWidth={isMobile} layout={isMobile ? Layout.STACKED : Layout.INLINE}>
          <ButtonGroupItem
            key='update'
            label='Save'
            onClick={() => {
              if (error) return;
              saveRecurrenceUpdates();
            }}
          />
          <ButtonGroupItem key='cancel' label='Cancel' onClick={() => closeCustomRule()} />
        </ButtonGroup>
      </BottomRowContainer>
    </OptionsContainer>
  );
};

export interface CustomRecurrenceRuleModalProps {
  closeCustomRule: () => void;
  customRuleOpen: boolean;
  startDate: Dayjs;
  updateRecurrence: (recurrenceRule: RecurrenceRule | null) => Promise<void>;
  currentRRule?: RecurrenceRule | null;
  isAllDay: boolean;
}

export const CustomRecurrenceRuleModal = ({
  closeCustomRule,
  updateRecurrence,
  customRuleOpen,
  currentRRule,
  startDate,
  isAllDay
}: CustomRecurrenceRuleModalProps) => {
  return (
    <Dialog customContent onClose={() => closeCustomRule()} open={customRuleOpen} title='Customize recurring event'>
      <CustomRecurrenceRuleContent
        closeCustomRule={closeCustomRule}
        currentRRule={currentRRule}
        isAllDay={isAllDay}
        startDate={startDate}
        updateRecurrence={updateRecurrence}
      />
    </Dialog>
  );
};
