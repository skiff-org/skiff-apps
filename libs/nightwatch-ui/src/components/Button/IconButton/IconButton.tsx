import { motion } from 'framer-motion';
import * as React from 'react';
import styled from 'styled-components';

import { SIZE_HEIGHT } from '../../../constants';
import { SQUARE_CSS } from '../../../styles';
import { FilledVariant, Size, ThemeMode, Type } from '../../../types';
import Icons, { IconColor } from '../../Icons';
import Tooltip from '../../Tooltip';
import { TooltipContent, TooltipTrigger } from '../../Tooltip/Tooltip';
import { BUTTON_ICON_SIZE, BUTTON_TYPE_COLOR } from '../Button.constants';
import { getButtonClassName } from '../Button.utils';

import { BUTTON_SIZE_BORDER_RADIUS } from './IconButton.constants';
import { ICON_BUTTON_VARIANT_CSS } from './IconButton.styles';
import { IconButtonProps, IconButtonType } from './IconButton.types';

const IconButtonContainer = styled.div<{
  $borderRadius: number;
  $disabled: boolean;
  $size: number;
  $type: IconButtonType;
  $variant: FilledVariant;
  $forceTheme?: ThemeMode;
}>`
  box-sizing: border-box;
  background: transparent;
  cursor: pointer;
  user-select: none;

  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ $borderRadius }) => $borderRadius}px;

  ${({ $disabled }) => $disabled && 'cursor: default;'}

  ${ICON_BUTTON_VARIANT_CSS}
  ${SQUARE_CSS}
`;

function IconButton(
  {
    active = false,
    animationProps,
    className = '',
    dataTest,
    disabled = false,
    forceTheme,
    icon,
    id,
    size = Size.MEDIUM,
    style,
    tooltip = '',
    type = Type.PRIMARY,
    variant = FilledVariant.FILLED,
    onClick
  }: IconButtonProps,
  ref: React.ForwardedRef<HTMLDivElement | null>
) {
  const borderRadius = BUTTON_SIZE_BORDER_RADIUS[size];
  const buttonSize = SIZE_HEIGHT[size];

  const renderIcon = () => {
    const customColor = typeof icon === 'string' ? undefined : icon.props.color;
    const defaultColor = variant === FilledVariant.FILLED ? BUTTON_TYPE_COLOR[type] : (type as IconColor);
    const color = disabled ? 'disabled' : customColor ?? defaultColor;
    const iconSize = BUTTON_ICON_SIZE[size];
    return typeof icon === 'string' ? (
      <Icons size={iconSize} icon={icon} color={color} forceTheme={forceTheme} />
    ) : (
      React.cloneElement(icon, {
        color,
        forceTheme,
        size: icon.props.size ?? iconSize
      })
    );
  };

  return (
    <Tooltip>
      <TooltipContent>{!disabled ? tooltip : ''}</TooltipContent>
      <TooltipTrigger>
        <IconButtonContainer
          className={getButtonClassName(active, className, disabled)}
          data-test={dataTest}
          id={id}
          ref={ref}
          style={style}
          onClick={disabled ? undefined : onClick}
          $borderRadius={borderRadius}
          $disabled={disabled}
          $size={buttonSize}
          $type={type}
          $variant={variant}
          $forceTheme={forceTheme}
          role='button'
        >
          {animationProps ? <motion.div {...animationProps}>{renderIcon()}</motion.div> : renderIcon()}
        </IconButtonContainer>
      </TooltipTrigger>
    </Tooltip>
  );
}

export default React.forwardRef<HTMLDivElement | null, IconButtonProps>(IconButton);
