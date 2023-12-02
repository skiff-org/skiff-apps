import React from 'react';
import styled from 'styled-components';

import { Size, ThemeMode } from '../../types';
import { getTextAndBgColors, getThemedColor } from '../../utils/colorUtils';
import Icons from '../Icons';
import Typography, { TypographySize } from '../Typography';

import { MonoTagProps } from './MonoTag.types';

const Tag = styled.div<{ $bgColor: string; $forceBoxShadowTheme?: ThemeMode; $forceTheme?: ThemeMode }>`
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  padding: 0px 5px;
  gap: 4px;
  box-sizing: border-box;

  ${({ $bgColor, $forceBoxShadowTheme, $forceTheme }) => `
    background: ${getThemedColor($bgColor, $forceTheme)};
    border: 1px solid ${getThemedColor($bgColor, $forceBoxShadowTheme ?? $forceTheme)};
  `}

  border-radius: 4px;
  border-bottom-width: 2px;
`;

const MonoTag: React.FC<MonoTagProps> = ({
  color,
  label,
  forceBoxShadowTheme,
  forceTheme,
  icon,
  textColor: customTextColor,
  bgColor: customBgColor,
  className
}: MonoTagProps) => {
  const [defaultTextColor, defaultBgColor] = getTextAndBgColors(color, false, label, forceTheme);
  const textColor = customTextColor ?? defaultTextColor;
  const bgColor = customBgColor ?? defaultBgColor;

  return (
    <Tag $bgColor={bgColor} $forceBoxShadowTheme={forceBoxShadowTheme} $forceTheme={forceTheme} className={className}>
      {icon && <Icons size={Size.SMALL} icon={icon} color={textColor} forceTheme={forceTheme} />}
      <Typography color={textColor} mono size={TypographySize.SMALL} forceTheme={forceTheme}>
        {label}
      </Typography>
    </Tag>
  );
};

export default MonoTag;
