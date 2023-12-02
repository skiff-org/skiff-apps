import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { motion } from 'framer-motion';
import isNumber from 'lodash/isNumber';
import React from 'react';
import styled, { css } from 'styled-components';

import { SQUARE_CSS } from '../../styles';
import { Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';
import Tooltip, { TooltipContent, TooltipTrigger } from '../Tooltip';

import { ICON_COLOR, ICON_SIZE, ICON_SVG } from './Icons.constants';
import { IconProps } from './Icons.types';

const IconContainer = styled(motion.div)<{
  $clickable: boolean;
  $color: string;
  $disabled: boolean;
  $size: number;
  $transitionDelay: number;
  $forceTheme?: ThemeMode;
  $shadow?: boolean;
}>`
  z-index: 1;
  display: flex;
  flex-shrink: 0;

  user-select: none;

  ${(props) => props.$clickable && 'cursor: pointer;'}
  ${(props) =>
    !!props.$shadow &&
    'filter: drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.1)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.06));'}

  & svg {
    width: ${(props) => props.$size}px !important;
    height: ${(props) => props.$size}px !important;
  }

  path {
    fill: ${(props) => getThemedColor(props.$color, props.$forceTheme)};
    transition-delay: ${(props) => props.$transitionDelay}ms;
    transition-property: fill;
  }

  ${(props) =>
    props.$disabled &&
    css`
      pointer-events: none;
      cursor: default;
    `}

  ${SQUARE_CSS}
`;

const Icons: React.FC<IconProps> = ({
  dataTest,
  icon,
  onClick,
  size = Size.MEDIUM,
  color = 'primary',
  disabled,
  forceTheme,
  rotate,
  shadow,
  tooltip,
  tooltipDelay,
  colorDelay = 0
}) => {
  const IconSVG = ICON_SVG[icon];
  const iconSize = isNumber(size) ? size : ICON_SIZE[size];
  const iconColor = ICON_COLOR[color] ?? '';

  if (!IconSVG) {
    return null;
  }

  return (
    <FloatingDelayGroup delay={{ open: tooltipDelay, close: tooltipDelay }}>
      <Tooltip>
        <TooltipContent>{!disabled ? tooltip : ''}</TooltipContent>
        <TooltipTrigger>
          <IconContainer
            className={`sk-icon-container`}
            data-test={dataTest}
            onClick={onClick}
            animate={{ rotate }}
            transition={{ duration: 0.1, ease: [0.04, 0.62, 0.23, 0.98] }}
            $clickable={!!onClick}
            $color={iconColor}
            $disabled={!!disabled}
            $transitionDelay={colorDelay}
            $size={iconSize}
            $forceTheme={forceTheme}
            $shadow={shadow}
          >
            <IconSVG />
          </IconContainer>
        </TooltipTrigger>
      </Tooltip>
    </FloatingDelayGroup>
  );
};

export default Icons;
