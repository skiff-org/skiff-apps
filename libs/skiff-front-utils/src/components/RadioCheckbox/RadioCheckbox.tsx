import { Icons, Icon, Size, ThemeMode, themeNames } from '@skiff-org/skiff-ui';
import React from 'react';
import styled, { css } from 'styled-components';

interface RadioCheckboxProps {
  checked: boolean;
  dataTest?: string;
  className?: string;
  theme?: ThemeMode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const BASE_ICON_CSS = css`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
`;

const CheckedIcon = styled.div`
  ${BASE_ICON_CSS}
  background: ${themeNames.light['--text-link']};
  outline: 2px solid var(--accent-orange-secondary);
  box-shadow: var(--shadow-l2);
  border-radius: 32px;
`;

const CheckedIconDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  background: var(--icon-always-white);
  box-shadow: var(--shadow-l2);
`;

const UnCheckedIcon = styled.div`
  ${BASE_ICON_CSS}
  opacity: 0.6;
`;

const RadioCheckbox: React.FC<RadioCheckboxProps> = ({ checked, dataTest, className, theme, onClick }) => {
  return (
    <>
      {checked && (
        <CheckedIcon className={className} data-test={dataTest} onClick={onClick}>
          <CheckedIconDot />
        </CheckedIcon>
      )}
      {!checked && (
        <UnCheckedIcon className={className} data-test={dataTest} onClick={onClick}>
          <Icons color='secondary' forceTheme={theme} icon={Icon.RadioEmpty} size={Size.X_MEDIUM} />
        </UnCheckedIcon>
      )}
    </>
  );
};

export default RadioCheckbox;
