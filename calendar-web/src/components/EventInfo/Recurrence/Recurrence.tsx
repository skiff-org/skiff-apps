import {
  Dropdown,
  DropdownItem,
  Icon,
  Icons,
  IconText,
  MouseEvents,
  Size,
  ThemeMode,
  themeNames,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { BrowserDesktopView, Drawer } from 'skiff-front-utils';
import { RecurrenceFrequency } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import styled, { css } from 'styled-components';

import { DrawerTypes, mobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { DateTime } from '../types';

import { DOES_NOT_REPEAT_LABEL, REPEAT_OPTIONS } from './constants';
import { CustomRuleDrawer } from './CustomRecurrenceRuleDrawer';
import { CustomRecurrenceRuleModal } from './CustomRecurrenceRuleModal';
import { useByDaysShift } from './useShouldShiftDays';
import {
  createRRuleForFrequency,
  formatRecurrenceRuleText,
  generateRepeatLabel,
  getRecurrenceButtonTitle,
  isCustomRRule
} from './utils';

const CustomRRuleTextDropdownItem = styled.div<{ $isReadOnly?: boolean }>`
  ${(props) =>
    !props.$isReadOnly &&
    css`
      border-bottom: 1px solid ${themeNames.dark['--border-secondary']};
    `}
  padding: 6px 8px;
  width: 200px !important;
`;

const RecurrenceOption = styled.div`
  display: flex;
`;

const SubLabel = styled.div`
  margin-left: 4px;
  display: inline-block;
`;

const DrawerItem = styled.div<{ $isLastItem: boolean }>`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 12px 8px;
  box-sizing: border-box;
  justify-content: space-between;
  ${({ $isLastItem }) =>
    $isLastItem &&
    css`
      margin-bottom: 48px;
    `}
`;

const InputStyleButton = styled.div<{ $hoverEffect: boolean }>`
  width: ${isMobile ? 'auto' : '104.5px'} !important;
  border-radius: 4px !important;
  cursor: pointer;
  box-sizing: border-box;
  min-width: fit-content;
  padding: 2px 4px !important;
  &:hover {
    background: var(--bg-overlay-tertiary) !important;
  }
  ${({ $hoverEffect }) =>
    $hoverEffect
      ? css`
          background: var(--bg-overlay-tertiary) !important;
        `
      : ''}
`;

export interface RecurrenceProps {
  updateRecurrence: (recurrenceRule: RecurrenceRule | null) => Promise<void>;
  currentRRule?: RecurrenceRule | null;
  isReadOnly?: boolean;
  dateTime?: DateTime;
  isAllDay: boolean;
}

export const Recurrence = ({ dateTime, updateRecurrence, currentRRule, isReadOnly, isAllDay }: RecurrenceProps) => {
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);
  const [customRuleOpen, setCustomRuleOpen] = useState(false);

  const byDaysShift = useByDaysShift(dateTime?.startDateTime, currentRRule?.timezone);

  const repeatButtonRef = useRef(null);
  const dispatch = useDispatch();

  const updateRecurrenceRuleFromFrequency = async (frequency: RecurrenceFrequency | undefined) => {
    if (!dateTime) return;
    if (!frequency) {
      await updateRecurrence(null);
    } else {
      await updateRecurrence(createRRuleForFrequency(dateTime.startDateTime, frequency, isAllDay));
    }

    setFrequencyDropdownOpen(false);
  };

  const getButtonLabel = () => {
    if (!currentRRule) return 'Repeats';
    // for readers in mobile show the full rule
    if (isMobile && isReadOnly) return formatRecurrenceRuleText(currentRRule.toText(), byDaysShift);
    return getRecurrenceButtonTitle(currentRRule);
  };

  if (!dateTime) return null;

  const CheckIcon = () => <Icons forceTheme={ThemeMode.DARK} icon={Icon.Check} size={Size.X_MEDIUM} />;

  return (
    <div>
      <InputStyleButton
        $hoverEffect={frequencyDropdownOpen && !(isMobile && isReadOnly)}
        onClick={() => {
          if (isReadOnly && (isMobile || !isCustomRRule(currentRRule))) return;
          setFrequencyDropdownOpen(!frequencyDropdownOpen);
        }}
        ref={repeatButtonRef}
      >
        <IconText
          color='secondary'
          label={getButtonLabel()}
          size={isMobile ? Size.MEDIUM : Size.SMALL}
          startIcon={<Icons color='disabled' icon={Icon.Reload} size={Size.SMALL} />}
          weight={TypographyWeight.REGULAR}
          wrap={isMobile}
        />
      </InputStyleButton>
      <MobileView>
        <Drawer
          extraSpacer={false}
          forceTheme={ThemeMode.DARK}
          formatTitle={false}
          hideDrawer={() => setFrequencyDropdownOpen(false)}
          maxHeight='95vh'
          show={frequencyDropdownOpen}
          title={currentRRule ? formatRecurrenceRuleText(currentRRule.toText(), byDaysShift) : 'Repeats'}
          wrapTitle
        >
          <DrawerItem
            $isLastItem={false}
            key='does-not-repeat'
            onClick={() => void updateRecurrenceRuleFromFrequency(undefined)}
          >
            <Typography forceTheme={ThemeMode.DARK}>{DOES_NOT_REPEAT_LABEL}</Typography>
          </DrawerItem>
          {REPEAT_OPTIONS.map((repeatOption) => (
            <DrawerItem
              $isLastItem={false}
              key={repeatOption.patternLabel}
              onClick={() => void updateRecurrenceRuleFromFrequency(repeatOption.frequency)}
            >
              <Typography forceTheme={ThemeMode.DARK}>
                <RecurrenceOption>
                  {repeatOption.patternLabel}
                  <Typography color='secondary' forceTheme={ThemeMode.DARK}>
                    <SubLabel>{generateRepeatLabel(dateTime?.startDateTime, repeatOption.frequency)}</SubLabel>
                  </Typography>
                </RecurrenceOption>
              </Typography>
              {currentRRule?.frequency === repeatOption.frequency && !isCustomRRule(currentRRule) && <CheckIcon />}
            </DrawerItem>
          ))}
          <DrawerItem
            $isLastItem={true}
            key='custom-rrule'
            onClick={() => {
              dispatch(mobileDrawerReducer.actions.openDrawer(DrawerTypes.CustomRecurrenceRule));
              setFrequencyDropdownOpen(false);
            }}
          >
            <Typography forceTheme={ThemeMode.DARK}>Custom</Typography>
            {!!(currentRRule && isCustomRRule(currentRRule)) && <CheckIcon />}
          </DrawerItem>
        </Drawer>
      </MobileView>
      <BrowserDesktopView>
        <Dropdown
          buttonRef={repeatButtonRef}
          clickOutsideWebListener={MouseEvents.CLICK}
          portal
          setShowDropdown={setFrequencyDropdownOpen}
          showDropdown={frequencyDropdownOpen}
        >
          {currentRRule && isCustomRRule(currentRRule) && (
            <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL} wrap>
              <CustomRRuleTextDropdownItem $isReadOnly={isReadOnly}>
                {formatRecurrenceRuleText(currentRRule.toText(), byDaysShift)}
              </CustomRRuleTextDropdownItem>
            </Typography>
          )}
          {!isReadOnly && (
            <>
              <DropdownItem
                active={false}
                key='does-not-repeat'
                label={DOES_NOT_REPEAT_LABEL}
                onClick={() => void updateRecurrenceRuleFromFrequency(undefined)}
              />
              {REPEAT_OPTIONS.map((repeatOption) => (
                <DropdownItem
                  active={currentRRule?.frequency === repeatOption.frequency && !isCustomRRule(currentRRule)}
                  customLabel={
                    <Typography forceTheme={ThemeMode.DARK}>
                      <RecurrenceOption>
                        {repeatOption.patternLabel}
                        <Typography color='secondary' forceTheme={ThemeMode.DARK}>
                          <SubLabel>{generateRepeatLabel(dateTime?.startDateTime, repeatOption.frequency)}</SubLabel>
                        </Typography>
                      </RecurrenceOption>
                    </Typography>
                  }
                  key={repeatOption.patternLabel}
                  label={repeatOption.patternLabel}
                  onClick={() => void updateRecurrenceRuleFromFrequency(repeatOption.frequency)}
                />
              ))}
              <DropdownItem
                active={!!(currentRRule && isCustomRRule(currentRRule))}
                key='custom-rrule'
                label='Custom'
                onClick={() => {
                  setCustomRuleOpen(true);
                  setFrequencyDropdownOpen(false);
                }}
              />
            </>
          )}
        </Dropdown>
      </BrowserDesktopView>
      <CustomRecurrenceRuleModal
        closeCustomRule={() => setCustomRuleOpen(false)}
        currentRRule={currentRRule}
        customRuleOpen={customRuleOpen}
        isAllDay={isAllDay}
        startDate={dateTime.startDateTime}
        updateRecurrence={updateRecurrence}
      />
      <CustomRuleDrawer
        currentRRule={currentRRule}
        isAllDay={isAllDay}
        startDate={dateTime.startDateTime}
        updateRecurrence={updateRecurrence}
      />
    </div>
  );
};
