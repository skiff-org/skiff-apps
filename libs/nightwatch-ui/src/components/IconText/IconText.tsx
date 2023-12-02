import * as React from 'react';
import { useState } from 'react';
import styled, { css } from 'styled-components';

import { FilledVariant, Size, ThemeMode } from '../../types';
import Icons, { Icon } from '../Icons';
import Tooltip, { TooltipContent, TooltipTrigger } from '../Tooltip';
import Typography, { TypographyWeight } from '../Typography';

import { ICON_TEXT_ICON_SIZE, ICON_TEXT_TYPOGRAPHY_SIZE } from './IconText.constants';
import { ICON_TEXT_SIZE_CSS, ICON_TEXT_TYPE_CSS, INTERACTIVE_ICON_TEXT_CSS } from './IconText.styles';
import { IconComponent, IconTextProps, IconTextSize } from './IconText.types';
import { getIconColor, getTextColor } from './IconText.utils';

const IconTextContainer = styled.div<{
  $isDestructive: boolean;
  $isDisabled: boolean;
  $isHovering: boolean;
  $isClickable: boolean;
  $noPadding: boolean;
  $size: IconTextSize;
  $variant: FilledVariant;
  $forceTheme?: ThemeMode;
  $fullWidth?: boolean;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  user-select: none;

  min-width: 0;

  ${(props) =>
    props.$fullWidth
      ? css`
          width: 100%;
        `
      : css`
          max-width: fit-content;
        `}

  box-sizing: border-box;

  ${({ $noPadding }) => $noPadding && 'padding: 0px !important;'}

  ${ICON_TEXT_SIZE_CSS}
  ${ICON_TEXT_TYPE_CSS}
  ${(props) => props.$isClickable && !props.$isDisabled && INTERACTIVE_ICON_TEXT_CSS}
`;

const IconText = (
  {
    label,
    className,
    disabled = false,
    disableHover,
    startIcon,
    style,
    endIcon,
    weight = TypographyWeight.MEDIUM,
    size = Size.MEDIUM,
    color,
    onClick,
    noPadding = false,
    dataTest,
    forceTheme,
    tooltip,
    variant = FilledVariant.UNFILLED,
    id,
    fullWidth,
    ...typographyProps
  }: IconTextProps,
  ref: React.ForwardedRef<HTMLDivElement>
) => {
  const [isHovering, setIsHovering] = useState(false);

  const isClickable = !!onClick;
  const hasLabel = !!label && (typeof label !== 'string' || !!label.length);

  const typographySize = ICON_TEXT_TYPOGRAPHY_SIZE[size];
  const iconSize = ICON_TEXT_ICON_SIZE[size];
  const calculatedTextColor = getTextColor(
    isClickable,
    disabled,
    isHovering,
    variant,
    color === 'source' ? 'primary' : color
  );

  const onMouseOver = () => {
    if (!isClickable || isHovering || disableHover || disabled) return;
    setIsHovering(true);
  };

  const onMouseLeave = () => {
    if (!isClickable || disableHover || disabled) return;
    setIsHovering(false);
  };

  const renderIcon = (icon: Icon | IconComponent) => {
    const customColor = typeof icon === 'string' ? undefined : icon.props.color;
    const calculatedIconColor = getIconColor(isClickable, disabled, isHovering, variant, customColor ?? color);
    return typeof icon === 'string' ? (
      <Icons color={calculatedIconColor} icon={icon} size={iconSize} forceTheme={forceTheme} />
    ) : (
      React.cloneElement(icon, {
        forceTheme,
        size: icon.props.size ?? iconSize,
        color: calculatedIconColor
      })
    );
  };

  if (!hasLabel && !startIcon && !endIcon) return <></>;

  return (
    <Tooltip>
      <TooltipContent>{!disabled ? tooltip : ''}</TooltipContent>
      <TooltipTrigger>
        <IconTextContainer
          className={className}
          data-test={dataTest}
          style={style}
          onClick={!disabled ? onClick : undefined}
          ref={ref}
          onMouseOver={onMouseOver}
          onMouseLeave={onMouseLeave}
          $isDisabled={disabled}
          $isHovering={isHovering}
          $isClickable={isClickable}
          $variant={variant}
          $size={size}
          id={id}
          $forceTheme={forceTheme}
          $fullWidth={fullWidth}
          $isDestructive={color === 'destructive'}
          $noPadding={noPadding}
        >
          {startIcon && renderIcon(startIcon)}
          {hasLabel && (
            <Typography
              color={calculatedTextColor}
              size={typographySize}
              forceTheme={forceTheme}
              weight={weight}
              {...typographyProps}
            >
              {label}
            </Typography>
          )}
          {endIcon && renderIcon(endIcon)}
        </IconTextContainer>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default React.forwardRef<HTMLDivElement, IconTextProps>(IconText);
