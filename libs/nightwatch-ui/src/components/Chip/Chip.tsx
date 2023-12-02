import React from 'react';
import styled from 'styled-components';

import { SQUARE_CSS } from '../../styles';
import { FilledVariant, Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';
import { AvatarComponent } from '../Avatar';
import Icons, { Icon } from '../Icons';
import { IconComponent } from '../IconText';
import { ICON_TEXT_TYPOGRAPHY_SIZE } from '../IconText/IconText.constants';
import Tooltip, { TooltipContent, TooltipPlacement, TooltipTrigger } from '../Tooltip';
import Typography, { TypographyWeight } from '../Typography';

import { CHIP_END_ICON_DATA_TEST, CHIP_ICON_SIZE, ICON_CONTAINER_SIZE } from './Chip.constants';
import { CHIP_TYPE_CSS } from './Chip.styles';
import { ChipProps } from './Chip.types';
import { getIconTextAndBgColors } from './Chip.utils';

export const ChipContainer = styled.div<{
  $clickable: boolean;
  $destructive: boolean;
  $size: Size;
  $variant: FilledVariant;
  $forceTheme?: ThemeMode;
  $noBorder?: boolean;
}>`
  border-radius: 32px;
  box-sizing: border-box;
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-grow: 0;
  gap: 0px;
  padding: ${(props) => (props.$size === Size.X_SMALL ? '2px' : '4px')};
  width: fit-content;

  ${(props) => !props.$noBorder && `border: 1px solid ${getThemedColor('var(--border-secondary)', props.$forceTheme)};`}
  ${(props) =>
    props.$clickable &&
    `
      cursor: pointer;
      user-select: none;
    `}

  ${CHIP_TYPE_CSS}
`;

const IconContainer = styled.div<{ $size: number; $bgColor: string; $forceTheme?: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  background: ${(props) => getThemedColor(props.$bgColor, props.$forceTheme)};

  ${SQUARE_CSS}
`;

const PaddedText = styled.div<{ $size: Size }>`
  padding: ${(props) => (props.$size === Size.X_SMALL ? '0px 4px' : '0px 8px')};
`;

const StartElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Chip: React.FC<ChipProps> = (props) => {
  const {
    avatar: startAvatar,
    avatarTooltip,
    className,
    color,
    dataTest,
    forceTheme,
    icon: startIcon,
    label,
    noBorder,
    size = Size.MEDIUM,
    style,
    tooltip = '',
    typographyWeight = TypographyWeight.REGULAR,
    variant = FilledVariant.FILLED,
    onClick,
    onDelete
  } = props;
  const destructive = color === 'destructive';
  // Chips with defined onDelete functions are input chipss
  const isInputType = !!onDelete;

  const iconSize = CHIP_ICON_SIZE[size];
  const iconContainerSize = ICON_CONTAINER_SIZE[size];

  const typographyColor = color ?? 'primary';
  const typographySize = ICON_TEXT_TYPOGRAPHY_SIZE[size];

  const renderAvatar = (avatar: AvatarComponent) => {
    return (
      <Tooltip>
        <TooltipContent>{avatarTooltip}</TooltipContent>
        <TooltipTrigger>
          {React.cloneElement(avatar, { forceTheme, rounded: true, size: avatar.props.size ?? iconSize })}
        </TooltipTrigger>
      </Tooltip>
    );
  };

  const renderStartIcon = (icon: Icon | IconComponent) => {
    const customColor = typeof icon === 'object' && icon.props.color ? icon.props.color : color;
    const [iconColor, bgColor] = getIconTextAndBgColors(destructive, customColor);
    return (
      <IconContainer $bgColor={bgColor} $size={iconContainerSize} $forceTheme={forceTheme}>
        {typeof icon === 'string' && <Icons color={iconColor} forceTheme={forceTheme} icon={icon} size={iconSize} />}
        {/* Prestyled icon object */}
        {typeof icon === 'object' &&
          React.cloneElement(icon, {
            color: iconColor,
            forceTheme,
            size: icon.props.size ?? iconSize
          })}
      </IconContainer>
    );
  };

  const renderDeleteIcon = (runDelete: (e: React.MouseEvent) => Promise<void> | void) => {
    const icon = Icon.Close;
    const customColor = color ?? 'secondary';
    const [iconColor, bgColor] = getIconTextAndBgColors(destructive, customColor);
    return (
      <IconContainer $bgColor={bgColor} $size={iconContainerSize} $forceTheme={forceTheme}>
        <Icons
          color={iconColor}
          dataTest={CHIP_END_ICON_DATA_TEST}
          icon={icon}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            void runDelete(e);
          }}
          forceTheme={forceTheme}
          size={iconSize}
        />
      </IconContainer>
    );
  };

  if (!startAvatar && !startIcon && !label && !isInputType) return <></>;

  return (
    <Tooltip placement={TooltipPlacement.BOTTOM_START}>
      <TooltipContent>{tooltip}</TooltipContent>
      <TooltipTrigger>
        <ChipContainer
          data-test={dataTest}
          className={className}
          style={style}
          onClick={onClick}
          $destructive={destructive}
          $noBorder={noBorder}
          $clickable={!!onClick}
          $size={size}
          $forceTheme={forceTheme}
          $variant={variant}
        >
          {(startAvatar || startIcon) && (
            <StartElement>
              {startAvatar && renderAvatar(startAvatar)}
              {startIcon && renderStartIcon(startIcon)}
            </StartElement>
          )}
          {label && (
            <PaddedText $size={size}>
              <Typography
                color={typographyColor}
                size={typographySize}
                weight={typographyWeight}
                forceTheme={forceTheme}
              >
                {label}
              </Typography>
            </PaddedText>
          )}
          {/* We render an X icon for input chips to run onDelete */}
          {isInputType && renderDeleteIcon(onDelete)}
        </ChipContainer>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default Chip;
