import { Typography, Icon, TypographySize, Icons, TypographyWeight, Size } from 'nightwatch-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { ActionType } from 'skiff-graphql';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { UserLabelPlain, UserLabelFolder, SYSTEM_LABELS } from '../../../utils/label';

import { ActionChip } from './Chips/ActionChip';
import { FilterConditionChip } from './Chips/FilterConditionChip';
import { MarkAsType } from './Filters.constants';
import { Filter } from './Filters.types';

const FilterRowContainer = styled.div<{ $isFirstRow: boolean; $isLastRow: boolean; $hover: boolean }>`
  display: flex;
  padding: 24px 0;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
  ${({ $isFirstRow }) => $isFirstRow && ' padding-top: 0;'}
  ${({ $hover }) => $hover && 'cursor: pointer;'}
  ${({ $isLastRow }) => !$isLastRow && 'border-bottom: 1px solid var(--border-tertiary);'}
`;

const FilterContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const FilterChips = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
  align-items: center;
`;

const RowTitle = styled.div`
  display: flex;
  user-select: none;
  margin-top: 4px;
  gap: 4px;
`;

const IconContainer = styled.div<{ $hover: boolean }>`
  ${({ $hover }) => !$hover && 'visibility: hidden;'}
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  width: 32px;
  height: 27px;
  background: var(--cta-secondary-default);
  border: 1px solid var(--border-secondary);
  margin-left: 12px;
`;

interface FilterRowProps {
  filter: Filter;
  index: number;
  labels: UserLabelPlain[];
  folders: UserLabelFolder[];
  isLastRow: boolean;
}

export const FilterRow: React.FC<FilterRowProps> = ({ filter, index, labels, folders, isLastRow }: FilterRowProps) => {
  const dispatch = useDispatch();

  const [hover, setHover] = useState(false);

  const openEditFilterModal = () => {
    const getSelectedMarkAsOption = () => {
      const shouldMarkAsRead = filter.actions.find((action) => action.type === ActionType.MarkAsRead);
      return shouldMarkAsRead ? MarkAsType.Read : MarkAsType.Unread;
    };

    const getSelectedMoveToOption = () => {
      const possibleMoveToTargets = filter.actions.filter(
        (action) => action.type === ActionType.ApplyLabel || action.type === ActionType.ApplySystemLabel
      );
      if (!possibleMoveToTargets) return undefined;
      const targetFolder = folders.filter((folder) =>
        possibleMoveToTargets.find((target) => target.value === folder.value)
      );
      const targetSystemLabel = SYSTEM_LABELS.filter((systemLabel) =>
        possibleMoveToTargets.find((target) => target.value === systemLabel.value)
      );
      // Can only move to one folder or system label
      return targetFolder?.[0] || targetSystemLabel?.[0];
    };

    const getSelectedLabels = () => {
      const possibleLabels = filter.actions.filter((action) => action.type === ActionType.ApplyLabel);
      if (!possibleLabels) return undefined;
      return labels.filter((label) => possibleLabels.find((target) => target.value === label.value));
    };

    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.Filter,
        filterID: filter.id,
        selectedMoveToOption: getSelectedMoveToOption(),
        selectedLabels: getSelectedLabels(),
        selectedMarkAsOption: getSelectedMarkAsOption(),
        activeConditions: filter.conditions,
        shouldORFilters: filter.shouldORFilters,
        name: filter.name
      })
    );
  };

  return (
    <FilterRowContainer
      $hover={hover}
      $isFirstRow={index === 0}
      $isLastRow={isLastRow}
      onClick={!isMobile ? openEditFilterModal : undefined}
      onMouseLeave={() => {
        if (!isMobile) setHover(false);
      }}
      onMouseOver={() => {
        if (!isMobile) setHover(true);
      }}
    >
      <FilterContent>
        <RowTitle>
          <Typography size={TypographySize.SMALL} weight={TypographyWeight.MEDIUM}>
            Filter {index + 1}
          </Typography>
          {filter.name && (
            <>
              <Typography color='secondary' size={TypographySize.SMALL} weight={TypographyWeight.BOLD}>
                &#183;
              </Typography>
              <Typography color='secondary' size={TypographySize.SMALL}>
                {filter.name}
              </Typography>
            </>
          )}
        </RowTitle>
        <FilterChips>
          {filter.conditions.map((condition, conditionIndex) => {
            return (
              <FilterConditionChip
                condition={condition}
                includeConnector={conditionIndex !== filter.conditions.length - 1}
                key={condition.id}
                shouldORFilters={filter.shouldORFilters}
              />
            );
          })}
          <Icons color='secondary' icon={Icon.ArrowRight} size={Size.X_SMALL} />
          {filter.actions.map((action, actionIndex) => {
            return (
              <ActionChip
                action={action}
                key={`${action.type}-${action.value ?? ''}-${actionIndex}`}
                labelsAndFolders={[...labels, ...folders]}
              />
            );
          })}
        </FilterChips>
      </FilterContent>
      <IconContainer $hover={hover}>
        <Icons icon={Icon.ChevronRight} />
      </IconContainer>
    </FilterRowContainer>
  );
};
