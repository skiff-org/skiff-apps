import { Icon, Icons, ThemeMode, Color, Size, getThemedColor } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

import { SKIFF_PUBLIC_WEBSITE } from '../../constants/routes.constants';

const LogoContainer = styled.div<{ $color: string; $size: number; $forceTheme?: ThemeMode }>`
  display: flex;
  align-items: center;
  justify-content: center;

  background: ${(props) => getThemedColor(props.$color, props.$forceTheme)};
  box-shadow: var(--secondary-button-border);
  border-radius: 30%;

  height: ${(props) => props.$size}px;
  width: ${(props) => props.$size}px;

  cursor: pointer;
`;

interface LogoProps {
  className?: string;
  onClick?: () => void;
  bgColor?: string;
  bgSize?: number;
  forceTheme?: ThemeMode;
  iconColor?: Color;
  size?: Size | number;
}

/**
 * Logo component that moves up when mobile keyboard is open
 */
export const Logo: React.FC<LogoProps> = ({
  className,
  onClick,
  iconColor,
  forceTheme,
  bgColor = 'var(--icon-link)',
  bgSize = 40,
  size = 32
}: LogoProps) => {
  const logoClick = onClick ? onClick : () => window.open(SKIFF_PUBLIC_WEBSITE);

  return (
    <LogoContainer $color={bgColor} $forceTheme={forceTheme} $size={bgSize} className={className}>
      <Icons color={iconColor} forceTheme={forceTheme} icon={Icon.Skiff} onClick={logoClick} size={size} />
    </LogoContainer>
  );
};

export default Logo;
