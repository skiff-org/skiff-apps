import * as React from 'react';
import styled, { css } from 'styled-components';

import { ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

import { SKELETON_COLOR } from './Skeleton.constants';
import { SkeletonColor, SkeletonProps } from './Skeleton.types';

const StyledSkeleton = styled.div<{
  $height: string | number;
  $width: string | number;
  $color: SkeletonColor;
  $borderRadius: string | number;
  $forceTheme?: ThemeMode;
}>`
  @keyframes pulse {
    0% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.7;
    }
  }

  -webkit-animation: pulse 3s infinite ease-in-out;
  -o-animation: pulse 3s infinite ease-in-out;
  -ms-animation: pulse 3s infinite ease-in-out;
  -moz-animation: pulse 3s infinite ease-in-out;
  animation: pulse 3s infinite ease-in-out;

  background: var(--bg-overlay-tertiary);

  ${(props) => {
    const backgroundColor = SKELETON_COLOR[props.$color];
    const themedColor = getThemedColor(`var(${backgroundColor})`, props.$forceTheme);
    return css`
      color: ${themedColor};
      background: ${themedColor};
    `;
  }}

  height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height)};
  width: ${({ $width }) => (typeof $width === 'number' ? `${$width}px` : $width)};
  border-radius: ${({ $borderRadius }) => (typeof $borderRadius === 'number' ? `${$borderRadius}px` : $borderRadius)};
`;

const Skeleton: React.FC<SkeletonProps> = ({
  height,
  width,
  borderRadius = 12,
  color = 'tertiary',
  forceTheme
}: SkeletonProps) => {
  return (
    <StyledSkeleton
      $height={height}
      $width={width}
      $borderRadius={borderRadius}
      $color={color}
      $forceTheme={forceTheme}
    />
  );
};

export default Skeleton;
