import * as React from 'react';
import styled, { css } from 'styled-components';

import { Size, ThemeMode, Type } from '../../../types';
import CircularProgress from '../../CircularProgress/CircularProgress';
import Icons, { Icon } from '../../Icons';
import { IconComponent } from '../../IconText';
import Tooltip from '../../Tooltip';
import { TooltipContent, TooltipTrigger } from '../../Tooltip/Tooltip';
import Typography, { TypographyWeight } from '../../Typography';
import { BUTTON_ICON_SIZE, BUTTON_TYPE_COLOR, ButtonSize } from '../Button.constants';
import { BUTTON_TYPE_CONTAINER_CSS } from '../Button.styles';
import { getButtonClassName } from '../Button.utils';

import { SIZE_STYLES, TYPOGRAPHY_SIZE } from './TextButton.constants';
import { BUTTON_SIZE_CONTAINER_CSS } from './TextButton.styles';
import { ButtonProps } from './TextButton.types';

const ButtonContainer = styled.div<{
  $floatRight: boolean;
  $fullWidth: boolean;
  $size: ButtonSize;
  $type: Type;
  $forceTheme?: ThemeMode;
  $compact?: boolean;
}>`
  position: relative;

  display: flex;
  justify-content: center;
  align-items: center;

  height: fit-content;
  width: ${(props) => (props.$fullWidth ? '100%' : 'fit-content')};
  box-sizing: border-box;

  cursor: pointer;
  user-select: none;

  ${(props) => props.$floatRight && 'margin-left: auto;'}

  &.disabled {
    pointer-events: none;
  }

  ${BUTTON_TYPE_CONTAINER_CSS}
  ${BUTTON_SIZE_CONTAINER_CSS}
  ${(props) =>
    props.$compact &&
    css`
      border-radius: 4px;
      padding: 4px 8px;
      height: fit-content;
      border: none;
    `}
`;

const ButtonBody = styled.div<{ $gap: number; $hidden: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(props) => `${props.$gap}px`};

  ${(props) => props.$hidden && `visibility: hidden;`}
`;

const LoadingContainer = styled.div<{ $fullWidth: boolean; $horizontalPadding: number }>`
  position: absolute;
  ${(props) =>
    props.$fullWidth
      ? `right: ${props.$horizontalPadding}px;`
      : `
        top: 50%;
        left: 50%;
        transform: translate(-50% , -50%);
        `}

  span:nth-child(2) {
    opacity: 0.4;
  }
`;

function Button(
  {
    children,
    className = '',
    active = false,
    size = Size.MEDIUM,
    type = Type.PRIMARY,
    tooltip = '',
    floatRight = false,
    forceTheme,
    fullWidth = false,
    icon: startIcon,
    id,
    disabled = false,
    onClick,
    dataTest,
    loading,
    compact = false,
    style
  }: ButtonProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const hideButtonBody = !fullWidth && !!loading;
  const isDisabledOrLoading = !!disabled || (!!loading && type !== 'destructive');

  const buttonContentColor = isDisabledOrLoading ? 'disabled' : BUTTON_TYPE_COLOR[type];

  const iconSize = BUTTON_ICON_SIZE[size];
  const typographySize = TYPOGRAPHY_SIZE[size];
  const { gap, horizontalPadding } = SIZE_STYLES[size];

  const renderIcon = (icon: Icon | IconComponent) => {
    const customColor = typeof icon === 'string' ? undefined : icon.props.color;
    const iconColor = isDisabledOrLoading ? 'disabled' : customColor ?? BUTTON_TYPE_COLOR[type];
    return typeof icon === 'string' ? (
      <Icons size={iconSize} icon={icon} color={iconColor} forceTheme={forceTheme} />
    ) : (
      React.cloneElement(icon, {
        forceTheme,
        size: icon.props.size ?? iconSize,
        color: iconColor
      })
    );
  };

  return (
    <Tooltip>
      <TooltipContent>{!disabled ? tooltip : ''}</TooltipContent>
      <TooltipTrigger fullWidth={fullWidth}>
        <ButtonContainer
          className={getButtonClassName(active, className, isDisabledOrLoading)}
          id={id}
          ref={ref}
          onClick={(e: React.MouseEvent) => void onClick(e)}
          data-test={dataTest}
          style={style}
          $floatRight={floatRight}
          $fullWidth={fullWidth}
          $size={size}
          $type={type}
          $forceTheme={forceTheme}
          $compact={compact}
          role='button'
        >
          <ButtonBody $gap={gap} $hidden={hideButtonBody}>
            {!!startIcon && renderIcon(startIcon)}
            <Typography
              forceTheme={forceTheme}
              size={typographySize}
              weight={TypographyWeight.MEDIUM}
              color={buttonContentColor}
            >
              {children}
            </Typography>
          </ButtonBody>
          {loading && (
            <LoadingContainer $fullWidth={fullWidth} $horizontalPadding={horizontalPadding}>
              <CircularProgress progressColor={buttonContentColor} size={Size.SMALL} spinner forceTheme={forceTheme} />
            </LoadingContainer>
          )}
        </ButtonContainer>
      </TooltipTrigger>
    </Tooltip>
  );
}

export default React.forwardRef<HTMLDivElement, ButtonProps>(Button);
