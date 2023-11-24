import { FilledVariant, Icon, IconText, Icons, Size, Typography, TypographySize, colors } from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CallBackProps } from 'react-joyride';
import { useDispatch } from 'react-redux';
import { FilterSelect, SettingValue, TabPage, useCurrentUserEmailAliases } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { JoyrideStepID, skemailJoyrideReducer } from '../../../redux/reducers/joyrideReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { useSettings } from '../../Settings/useSettings';

import { QuickAliasJoyride } from './QuickAliasJoyride';
import {
  FILTER_BY_ALIAS_STEP_CLASSNAME,
  MANAGE_ALIASES_STEP_CLASSNAME,
  QUICK_ALIAS_JOYRIDE_STEPS
} from './QuickAliasMailbox.constants';
import { IdentifiedJoyrideStep } from './QuickAliasMailbox.types';

const pulseAnimation = css`
  @keyframes pulseBackground {
    0%,
    100% {
      background: rgba(${colors['--orange-400']}, 0.1);
    }
    50% {
      background: var(--accent-orange-secondary);
    }
  }

  animation: pulseBackground 2s infinite;
`;

const AnimatedIconText = styled(IconText)`
  ${pulseAnimation}
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px; //conform with mailbox actions padding
  border-top: 1px solid var(--border-tertiary);
  box-sizing: border-box;
`;

const FilterDropdownChip = styled.div<{
  $filtersApplied?: boolean;
  $isDropdownOpen?: boolean;
  $isJoyrideStepActive?: boolean;
}>`
  display: flex;
  padding: 4px;
  border: 1px ${(props) => (props.$filtersApplied ? 'solid var(--border-secondary)' : 'dashed var(--border-primary)')};
  border-radius: 32px;
  border-color: ${({ $isJoyrideStepActive }) => ($isJoyrideStepActive ? 'var(--accent-orange-secondary)' : ')')};
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
  height: 24px;
   {
    ${(props) =>
      props.$isDropdownOpen &&
      css`
        background: var(--bg-overlay-secondary);
      `}
  }
   {
    ${(props) => props.$isJoyrideStepActive && pulseAnimation}
  }

  &:hover {
    background: var(--bg-overlay-secondary);
  }
`;

const ChipLabel = styled(Typography)`
  padding: 0px 8px;
  user-select: none;
`;

const DropdownChevron = styled.div<{ $isJoyrideStepActive?: boolean }>`
  background: ${(props) =>
    props.$isJoyrideStepActive ? 'var(--accent-orange-secondary)' : 'var(--bg-overlay-tertiary);'};
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
`;

export const QuickAliasActionBar: React.FC = () => {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const dispatch = useDispatch();

  const quickAliasFilter = useAppSelector((state) => state.mailbox.quickAliasFilter);
  const activeAliasFilters = quickAliasFilter
    ? Object.keys(quickAliasFilter).filter((alias) => quickAliasFilter[alias])
    : [];

  const activeJoyrideStep = useAppSelector((state) => state.joyride.activeJoyrideStep);
  const isFilterJoyrideStepActive = activeJoyrideStep === JoyrideStepID.FILTER_BY_ALIAS;
  const isManageJoyrideStepActive = activeJoyrideStep === JoyrideStepID.MANAGE_ALIASES;

  const { openSettings } = useSettings();
  const openQuickAliasTab = () => openSettings({ tab: TabPage.QuickAliases, setting: SettingValue.QuickAlias });

  const onSelectAliasFilter = useCallback(
    (quickAlias: string) =>
      dispatch(
        skemailMailboxReducer.actions.toggleQuickAliasSelect({
          quickAlias
        })
      ),
    [dispatch]
  );

  const removeAliasFilter = useCallback(() => {
    dispatch(skemailMailboxReducer.actions.clearQuickAliasFilter());
  }, [dispatch]);

  const joyrideCallback = (data: CallBackProps) => {
    const { step, status } = data;
    const id = (step as IdentifiedJoyrideStep).id;
    if (status === 'running') {
      dispatch(skemailJoyrideReducer.actions.setJoyrideStep(id));
    } else {
      dispatch(skemailJoyrideReducer.actions.setJoyrideStep(undefined));
    }
  };

  const { quickAliases } = useCurrentUserEmailAliases();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      removeAliasFilter();
    };
  }, [removeAliasFilter]);

  useEffect(() => {
    // if alias filter false for all, clear to show non-empty
    if (activeAliasFilters.length === 0) {
      removeAliasFilter();
    }
  }, [removeAliasFilter, activeAliasFilters.length]);

  const manageButtonBaseProps = {
    className: MANAGE_ALIASES_STEP_CLASSNAME,
    label: 'Manage',
    onClick: openQuickAliasTab,
    variant: FilledVariant.FILLED
  };

  return (
    <>
      <Container>
        <FilterDropdownChip
          $filtersApplied={!!activeAliasFilters.length}
          $isDropdownOpen={filterDropdownOpen}
          $isJoyrideStepActive={isFilterJoyrideStepActive}
          onClick={() => setFilterDropdownOpen((prev) => !prev)}
          ref={dropdownRef}
        >
          <ChipLabel
            className={FILTER_BY_ALIAS_STEP_CLASSNAME}
            color={isFilterJoyrideStepActive ? 'orange' : 'secondary'}
            size={TypographySize.SMALL}
          >
            {activeAliasFilters.length
              ? `${activeAliasFilters.length} ${pluralize('alias', activeAliasFilters.length)} shown`
              : 'Filter by alias'}
          </ChipLabel>
          <DropdownChevron $isJoyrideStepActive={isFilterJoyrideStepActive}>
            <Icons
              color={isFilterJoyrideStepActive ? 'orange' : 'disabled'}
              icon={filterDropdownOpen ? Icon.ChevronUp : Icon.ChevronDown}
              size={Size.X_SMALL}
            />
          </DropdownChevron>
          <FilterSelect
            buttonRef={dropdownRef}
            clearAllFilters={removeAliasFilter}
            filterLabels={quickAliases}
            isFilterActive={(alias: string) => !!quickAliasFilter?.[alias]}
            minWidth='fit-content'
            numActiveFilters={activeAliasFilters.length}
            onClose={() => setFilterDropdownOpen(false)}
            onSelectFilter={onSelectAliasFilter}
            open={filterDropdownOpen}
          />
        </FilterDropdownChip>
        {isManageJoyrideStepActive ? (
          <AnimatedIconText {...manageButtonBaseProps} color='orange' />
        ) : (
          // temporary mock joyride activator; needs to be hooked up to onboarding via settings
          <IconText {...manageButtonBaseProps} />
        )}
      </Container>
      <QuickAliasJoyride
        callback={joyrideCallback}
        run={isFilterJoyrideStepActive || isManageJoyrideStepActive}
        steps={QUICK_ALIAS_JOYRIDE_STEPS}
      />
    </>
  );
};
