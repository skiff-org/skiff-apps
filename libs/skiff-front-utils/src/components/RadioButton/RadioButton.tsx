import { ThemeMode, themeNames, Typography, TypographySize } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

import RadioCheckbox from '../RadioCheckbox';

interface RadioButtonProps {
  label: string;
  checked: boolean;
  description?: string;
  disabled?: boolean;
  dataTest?: string;
  theme?: ThemeMode;
  className?: string;
  onClick?: () => void;
}

const Container = styled.div<{ checked: boolean; disabled?: boolean; forceTheme?: ThemeMode }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 16px;
  border: 1px solid
    ${(props) => (props.forceTheme ? themeNames[props.forceTheme]['--border-tertiary'] : 'var(--border-tertiary)')};
  border-radius: 12px;
  box-sizing: border-box;

  ${(props) =>
    props.checked &&
    `
    background: ${
      props.forceTheme ? themeNames[props.forceTheme]['--bg-overlay-tertiary'] : 'var(--bg-overlay-tertiary)'
    };
  `}

  ${(props) =>
    props.disabled &&
    `
    opacity: 0.4;
  `}

  ${(props) =>
    !props.disabled &&
    `
    cursor: pointer;
  `}
`;

const LabelAndDescription = styled.div`
  max-width: 90%;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  checked,
  description,
  disabled,
  dataTest,
  theme,
  className,
  onClick
}) => {
  return (
    <Container
      checked={checked}
      className={className}
      data-test={dataTest}
      disabled={disabled}
      forceTheme={theme}
      onClick={!disabled ? onClick : undefined}
    >
      <LabelAndDescription>
        <Typography mono uppercase forceTheme={theme} size={TypographySize.SMALL}>
          {label}
        </Typography>
        <Typography
          mono
          uppercase
          color={checked ? 'secondary' : 'disabled'}
          forceTheme={theme}
          size={TypographySize.SMALL}
          wrap
        >
          {description}
        </Typography>
      </LabelAndDescription>
      <RadioCheckbox checked={checked} theme={theme} />
    </Container>
  );
};

export default RadioButton;
