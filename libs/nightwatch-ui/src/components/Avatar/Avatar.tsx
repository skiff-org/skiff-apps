import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import * as React from 'react';
import styled, { css } from 'styled-components';

import { SQUARE_CSS } from '../../styles';
import { Size, ThemeMode } from '../../types';
import { getAccentColorValues, getTextAndBgColors, getThemedColor } from '../../utils/colorUtils';
import Icons from '../Icons';
import Tooltip, { TooltipContent, TooltipPlacement, TooltipTrigger } from '../Tooltip';
import Typography, { TypographyWeight } from '../Typography';

import { FULL_RADIUS, SIZE_STYLES } from './Avatar.constants';
import { AvatarProps } from './Avatar.types';
import { stripEmojis } from './Avatar.utils';

const AvatarContainer = styled.div<{
  $active: boolean;
  $background: string;
  $borderRadius: number;
  $borderWidth: number;
  $isClickable: boolean;
  $isXLarge: boolean;
  $size: number;
  $forceTheme?: ThemeMode;
  $customBorderRadius?: boolean;
}>`
  z-index: 0;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;

  background: ${(props) => getThemedColor(props.$background, props.$forceTheme)};
  opacity: ${(props) => (props.$active ? '100%' : '40%')};
  cursor: ${(props) => (props.$isClickable ? 'pointer' : 'default')};
  user-select: none;

  ${(props) => {
    // Non-XLarge avatar
    if (!props.$isXLarge || !!props?.$customBorderRadius) return `border-radius: ${props.$borderRadius}px;`;

    // XLarge avatar
    const innerOffset = props.$borderWidth;
    const innerRadius = props.$borderRadius;
    const outerRadius = innerOffset + innerRadius;
    return css`
      border: ${innerOffset}px solid ${getThemedColor(props.$background, props.$forceTheme)};
      border-radius: ${outerRadius}px;
    `;
  }}

  ${SQUARE_CSS}
`;

const AvatarBadgeContainer = styled.div<{ $background: string; $borderWidth: number; $forceTheme?: ThemeMode }>`
  z-index: 2;
  position: absolute;
  bottom: -${(props) => props.$borderWidth}px;
  right: -${(props) => props.$borderWidth}px;

  border-radius: 50%;
  background: ${(props) => getThemedColor(props.$background, props.$forceTheme)};
  padding: ${(props) => props.$borderWidth}px;
`;

const AvatarBadge = styled.div<{
  $badgeColor: string;
  $size: number;
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: inherit;
  background: ${(props) => props.$badgeColor};

  ${SQUARE_CSS}
`;

const AvatarBackground = styled.div<{
  $borderRadius: number;
  $hasImage: boolean;
  $secondaryColor: string;
}>`
  position: absolute;
  width: 100%;
  height: 100%;

  background: ${(props) => !props.$hasImage && props.$secondaryColor};
  border-radius: ${(props) => props.$borderRadius}px;
`;

const AvatarContent = styled.div`
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AvatarImage = styled.img<{ $borderRadius: number }>`
  border-radius: ${(props) => props.$borderRadius}px;
`;

const Avatar: React.FC<AvatarProps> = ({
  active = true,
  background = 'var(--bg-l2-solid)',
  badgeColor = 'green',
  badgeIcon,
  badgeSize,
  customBorderRadius,
  color,
  dataTest,
  disabled = false,
  forceTheme,
  icon,
  iconDataTest,
  imageDataTest,
  imageSrc,
  label,
  rounded = false,
  showBadge = false,
  badgeTooltip,
  size = Size.MEDIUM,
  style,
  onClick = undefined
}) => {
  const [avatarColorName, avatarSecondaryColor] = getTextAndBgColors(color, disabled, label, forceTheme);
  const [badgePrimaryColor, , badgeName] = getAccentColorValues(badgeColor, forceTheme);

  const { avatarSize, borderRadius, borderWidth, iconSize, typographySize } = SIZE_STYLES[size];
  const radius = customBorderRadius || (rounded ? FULL_RADIUS : borderRadius);

  const renderAvatarBadge = () => (
    <FloatingDelayGroup delay={{ open: 200, close: 200 }}>
      <Tooltip placement={TooltipPlacement.BOTTOM_START}>
        <TooltipContent>{badgeTooltip}</TooltipContent>
        <TooltipTrigger>
          <AvatarBadgeContainer $background={background} $borderWidth={borderWidth} $forceTheme={forceTheme}>
            <AvatarBadge $size={badgeSize ?? radius} $badgeColor={badgePrimaryColor}>
              {badgeIcon && (
                <Icons
                  color={badgeName === 'disabled' ? 'secondary' : 'white'}
                  icon={badgeIcon}
                  size={badgeSize ?? radius}
                />
              )}
            </AvatarBadge>
          </AvatarBadgeContainer>
        </TooltipTrigger>
      </Tooltip>
    </FloatingDelayGroup>
  );

  const renderAvatarWithImage = () => (
    <AvatarImage
      src={imageSrc}
      width='100%'
      height='100%'
      data-test={imageDataTest}
      alt='User avatar'
      $borderRadius={radius}
    />
  );

  const renderAvatarWithoutImage = () => (
    <>
      {icon && typeof icon === 'string' && (
        <Icons icon={icon} color={avatarColorName} size={iconSize} forceTheme={forceTheme} dataTest={iconDataTest} />
      )}
      {icon &&
        typeof icon !== 'string' &&
        React.cloneElement(icon, {
          dataTest: iconDataTest,
          color: icon.props.color ?? avatarColorName,
          forceTheme,
          size: icon.props.size ?? iconSize
        })}
      {label && (
        <Typography
          capitalize
          dataTest='user-avatar'
          weight={TypographyWeight.MEDIUM}
          color={avatarColorName}
          forceTheme={forceTheme}
          size={typographySize}
        >
          {stripEmojis(label).charAt(0)}
        </Typography>
      )}
    </>
  );

  return (
    <AvatarContainer
      data-test={dataTest}
      style={style}
      onClick={onClick}
      $active={active}
      $background={background}
      $borderRadius={radius}
      $borderWidth={borderWidth}
      $customBorderRadius={!!customBorderRadius}
      $forceTheme={forceTheme}
      $isClickable={!!onClick}
      $isXLarge={size === Size.X_LARGE}
      $size={avatarSize}
    >
      <AvatarBackground
        data-test='avatar-background'
        $borderRadius={radius}
        $hasImage={!!imageSrc}
        $secondaryColor={avatarSecondaryColor}
      />
      <AvatarContent>{imageSrc ? renderAvatarWithImage() : renderAvatarWithoutImage()}</AvatarContent>
      {showBadge && renderAvatarBadge()}
    </AvatarContainer>
  );
};

export default Avatar;
