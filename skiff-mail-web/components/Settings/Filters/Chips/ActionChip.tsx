import { ACCENT_COLOR_VALUES, Icon, IconProps, Icons, Size, Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import React from 'react';
import { ActionType } from 'skiff-graphql';
import { assertUnreachable } from 'skiff-utils';
import styled from 'styled-components';

import { SystemLabel, UserLabelFolder, UserLabelPlain, isFolder, isSystemLabel } from '../../../../utils/label';
import { SYSTEM_LABELS } from '../../../../utils/label';
import { CHIP_TYPOGRAPHY_PADDING, FILTER_CONDITION_CHIP_EDGE_PADDING } from '../Filters.constants';
import { Action } from '../Filters.types';

import { ChipContainer, ChipTypography, labelStyling } from './Chips.styles';

const TypeLabel = styled.div<{ $includeBorder: boolean }>`
  ${labelStyling}
  padding: 0   ${({ $includeBorder }) =>
    $includeBorder
      ? CHIP_TYPOGRAPHY_PADDING
      : FILTER_CONDITION_CHIP_EDGE_PADDING + CHIP_TYPOGRAPHY_PADDING}px 0 ${FILTER_CONDITION_CHIP_EDGE_PADDING +
  CHIP_TYPOGRAPHY_PADDING}px;
  ${({ $includeBorder }) => $includeBorder && 'border-right: 1px var(--border-secondary) solid;'}
`;

const ValueLabel = styled.div`
  ${labelStyling}
  min-width: 0;
  padding-right: ${FILTER_CONDITION_CHIP_EDGE_PADDING}px;
`;

const IconColorContainer = styled.div<{ $color: string }>`
  background: ${(props) => props.$color};
  width: 16px;
  height: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
`;

interface ActionChipProps {
  action: Action;
  labelsAndFolders: (UserLabelPlain | UserLabelFolder)[];
}

export const ActionChip: React.FC<ActionChipProps> = ({ action, labelsAndFolders }: ActionChipProps) => {
  const { type, value } = action;

  const targetLabelOrFolder = labelsAndFolders.find((userLabel) => userLabel.value === value);
  const targetSystemLabel = SYSTEM_LABELS.find((systemLabel) => systemLabel.value === value);
  const moveToTarget = targetLabelOrFolder || targetSystemLabel;
  const isMoveToAction = type === ActionType.ApplyLabel || type === ActionType.ApplySystemLabel;

  const getActionLabel = () => {
    const moveToLabel = 'Move to';
    if (type === ActionType.MarkAsRead) return 'Mark as read';
    if (type === ActionType.ApplySystemLabel) return moveToLabel;
    if (type === ActionType.ApplyLabel) {
      if (targetLabelOrFolder && isFolder(targetLabelOrFolder)) return moveToLabel;
      return 'Apply label';
    }
    return assertUnreachable(type);
  };

  // Return the icon corresponding to the label (folder, plain label, system label)
  // If label is undefined, this means the label does not exist and we should render an invalid label
  const getLabelIcon = (label: SystemLabel | UserLabelPlain | UserLabelFolder | undefined) => {
    const getLabelColor = (): NonNullable<IconProps['color']> => {
      // If label is undefined, this means the label does not exist
      if (!label) return 'disabled';
      if (isSystemLabel(label)) {
        return 'secondary';
      }
      return label.color ?? 'secondary';
    };

    const labelColor = getLabelColor();

    const getIcon = () => {
      // If label is undefined, this means the label does not exist
      if (!label) return Icon.Dot;
      if (isSystemLabel(label)) return label.icon;
      return isFolder(label) ? Icon.FolderSolid : Icon.Dot;
    };

    const getLabelIconContainerColor = () => {
      if (labelColor === 'disabled') return 'var(--bg-overlay-tertiary)';
      return (ACCENT_COLOR_VALUES[labelColor] as Array<string>)?.[1] || 'var(--bg-overlay-secondary)';
    };

    return (
      <IconColorContainer $color={getLabelIconContainerColor()}>
        <Icons color={labelColor} icon={getIcon()} size={Size.X_SMALL} />
      </IconColorContainer>
    );
  };

  const renderValueLabel = () => {
    if (moveToTarget) {
      return (
        <>
          <ChipTypography>
            <Typography weight={TypographyWeight.MEDIUM}>{moveToTarget.name}</Typography>
          </ChipTypography>
          {getLabelIcon(moveToTarget)}
        </>
      );
    }
    // Label to apply has been deleted
    if (isMoveToAction) {
      return (
        <>
          <ChipTypography>
            <Typography color='disabled'>Deleted label</Typography>
          </ChipTypography>
          {getLabelIcon(undefined)}
        </>
      );
    }
    return <Typography weight={TypographyWeight.MEDIUM}>{value}</Typography>;
  };

  return (
    <ChipContainer>
      <TypeLabel $includeBorder={!!value}>
        <Typography color='secondary'>{getActionLabel()}</Typography>
      </TypeLabel>
      {value && <ValueLabel>{renderValueLabel()}</ValueLabel>}
    </ChipContainer>
  );
};
