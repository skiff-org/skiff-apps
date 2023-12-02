import React from 'react';
import styled from 'styled-components';

import { Size } from '../../types';
import Tooltip, { TooltipContent, TooltipTrigger } from '../Tooltip';

import { SIZE_VALUES } from './CircularProgress.constants';
import { CircularProgressProps } from './CircularProgress.types';
import { getColorValue } from './CircularProgress.utils';

const CircularProgressRoot = styled.span<{ $size: number }>`
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: ${(props) => props.$size}px;
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0; // prevent from shrinking when CircularProgress is in a flex container.
  position: relative;
`;

const CircularProgressSvg = styled.svg<{ $svgOffset: number }>`
  width: inherit;
  height: inherit;
  display: inherit;
  box-sizing: inherit;
  position: absolute;
  top: ${(props) => props.$svgOffset}px;
  left: ${(props) => props.$svgOffset}px; // centered align
`;

const CircularProgressTrack = styled.circle<{ $thickness: number; $color: string; $radius: number }>`
  cx: 50%;
  cy: 50%;
  r: ${(props) => props.$radius}px;
  fill: transparent;
  stroke-width: ${(props) => props.$thickness}px;
  stroke: ${(props) => props.$color};
`;

const CircularProgressProgress = styled.circle<{
  $radius: number;
  $thickness: number;
  $color: string;
  $progressLength: number;
  $strokeDashoffset: number;
  $spinner: boolean;
}>`
  cx: 50%;
  cy: 50%;
  r: ${(props) => props.$radius}px;
  fill: transparent;
  stroke-width: ${(props) => props.$thickness}px;
  stroke: ${(props) => props.$color};
  stroke-linecap: round;
  stroke-dasharray: ${(props) => props.$progressLength};
  stroke-dashoffset: ${(props) => props.$strokeDashoffset};
  transform-origin: center;
  transform: rotate(-90deg);
  @keyframes circulate {
    0% {
      transform: rotate(-90deg);
    }
    100% {
      transform: rotate(270deg);
    }
  }
  ${(props) => props.$spinner && 'animation: 0.75s ease-in-out 0s infinite normal none running circulate;'}
`;

const CircularProgress = ({
  className,
  dataTest,
  forceTheme,
  progress = 47,
  progressColor = 'secondary',
  size = Size.MEDIUM,
  spinner = false,
  style,
  tooltip,
  trackColor = 'var(--bg-overlay-tertiary)',
  thickness
}: CircularProgressProps) => {
  const { rootSize, borderWidth, trackThickness, progressThickness } = SIZE_VALUES[size];
  const progressColorValue = getColorValue(progressColor, forceTheme);
  const trackColorValue = getColorValue(trackColor, forceTheme);

  const trackThicknessValue = thickness ?? trackThickness;
  const progressThicknessValue = thickness ?? progressThickness;

  const innerSize = rootSize - borderWidth * 2;
  const thicknessDiff = trackThicknessValue - progressThicknessValue;
  const trackRadius = innerSize / 2 - trackThicknessValue / 2 + Math.min(0, thicknessDiff / 2);
  const progressRadius = innerSize / 2 - progressThicknessValue / 2 + Math.max(0, thicknessDiff / 2);
  const progressLength = 2 * 3.1415926535 * progressRadius;
  const valuePercent = progress;
  const strokeDashoffset = progressLength - (valuePercent * progressLength) / 100;
  return (
    <Tooltip>
      <TooltipContent>{tooltip}</TooltipContent>
      <TooltipTrigger>
        <CircularProgressRoot className={className} data-test={dataTest} style={style} $size={rootSize}>
          <CircularProgressSvg $svgOffset={borderWidth}>
            <CircularProgressTrack $thickness={trackThicknessValue} $color={trackColorValue} $radius={trackRadius} />
            <CircularProgressProgress
              $radius={progressRadius}
              $thickness={progressThicknessValue}
              $color={progressColorValue}
              $progressLength={progressLength}
              $strokeDashoffset={strokeDashoffset}
              $spinner={spinner}
            />
          </CircularProgressSvg>
        </CircularProgressRoot>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default CircularProgress;
