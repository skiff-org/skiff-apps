import { Icon, Icons, Size, ThemeMode, themeNames } from 'nightwatch-ui';
import React from 'react';
import styled, { css } from 'styled-components';

interface RadioCheckboxProps {
  checked: boolean;
  dataTest?: string;
  className?: string;
  theme?: ThemeMode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  size?: number;
}

const BASE_ICON_CSS = css`
  ${({ $size }: { $size?: number | string }) => `
    width: ${!!$size ? `${$size}px` : '20px'};
    height: ${!!$size ? `${$size}px` : '20px'};
  `}
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
`;

const CheckedIcon = styled.div<{ $size?: number }>`
  ${BASE_ICON_CSS}
  background: ${themeNames.light['--text-link']};
  outline: 2px solid var(--accent-orange-secondary);
  box-shadow: var(--shadow-l2);
  border-radius: 32px;
`;

const CheckedIconDot = styled.div<{ $size?: number }>`
  width: ${({ $size }) => ($size ? `${$size / 2 - 2}px` : '8px')};
  height: ${({ $size }) => ($size ? `${$size / 2 - 2}px` : '8px')};
  border-radius: 32px;
  background: var(--icon-always-white);
  box-shadow: var(--shadow-l2);
`;

const UnCheckedIcon = styled.div<{ $size?: string | number }>`
  ${BASE_ICON_CSS}
  opacity: 0.6;
`;

const RadioCheckbox: React.FC<RadioCheckboxProps> = ({ checked, dataTest, className, theme, onClick, size }) => {
  return (
    <>
      {checked && (
        <CheckedIcon $size={size} className={className} data-test={dataTest} onClick={onClick}>
          <CheckedIconDot />
        </CheckedIcon>
      )}
      {!checked && (
        <UnCheckedIcon $size={size} className={className} data-test={dataTest} onClick={onClick}>
          <Icons
            color='secondary'
            forceTheme={theme}
            icon={Icon.RadioEmpty}
            size={typeof size === 'number' ? size : Size.X_MEDIUM}
          />
        </UnCheckedIcon>
      )}
    </>
  );
};

export default RadioCheckbox;
