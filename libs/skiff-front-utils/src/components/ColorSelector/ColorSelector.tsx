import { AccentColor, CorrectedColorSelect, getThemedColor, ThemeMode } from 'nightwatch-ui';
import React, { Fragment } from 'react';
import styled from 'styled-components';

import { useTheme } from '../../theme/AppThemeProvider';

const ColorList = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export const ColorOption = styled.div<{
  $color?: string;
  $isSelected?: boolean;
  disabled?: boolean;
  $showHover?: boolean;
  $theme?: ThemeMode;
}>`
  width: 28px;
  height: 28px;
  border-radius: 28px;
  ${(props) =>
    props.$showHover &&
    `
    margin: 2px;
  `}
  display: flex;
  align-items: center;
  box-sizing: border-box;
  justify-content: center;

  ${(props) =>
    props.$isSelected &&
    `
  border: 2px ${props.$color ?? ''} solid !important;
  box-shadow: var(--shadow-l1);
  `}

  &:hover {
    border: 2px solid
      rgba(
        ${(props) =>
          getThemedColor(props.$color ?? '', props.$theme)
            .substring(4)
            .slice(0, -1)},
        0.3
      );
    cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  }
`;

export const ColorCircle = styled.div<{
  $color: string;
  $isSelected?: boolean;
  $showHover?: boolean;
  $isHighlight?: boolean;
}>`
  height: 20px;
  width: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  ${(props) =>
    props.$showHover &&
    `
    border: 1px solid ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
  `}
  ${(props) =>
    props.$isHighlight &&
    `
    box-shadow: inset 0 0 0 1000px rgba(255, 255, 255, 0.3);
    `}
  background: ${(props) => props.$color};

  ${(props) =>
    !props.$isHighlight &&
    props.$isSelected &&
    `
      box-shadow: var(--shadow-l1);
  `}
`;

interface ColorSelectorProps {
  colorToStyling: Record<AccentColor, string>;
  value: string;
  handleChange: (newValue: AccentColor, evt?: React.MouseEvent) => void;
  disabled?: boolean;
  hideSelected?: boolean;
  showHover?: boolean;
  isHighlight?: boolean;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colorToStyling,
  value,
  handleChange,
  disabled,
  hideSelected,
  showHover,
  isHighlight
}) => {
  const { theme } = useTheme();
  return (
    <ColorList>
      {Object.entries(colorToStyling).map(([colorValue, colorStyling]) => {
        const isSelected = !hideSelected && colorValue === value;
        return (
          <Fragment key={colorStyling}>
            <ColorOption
              $color={showHover ? colorStyling : CorrectedColorSelect[colorStyling]}
              $isSelected={isSelected}
              $showHover={showHover}
              $theme={theme}
              disabled={disabled}
              key={colorValue}
              onClick={(evt: React.MouseEvent) => {
                if (disabled) return;
                evt.stopPropagation();
                handleChange(colorValue as AccentColor);
              }}
            >
              <ColorCircle
                $color={showHover ? colorStyling : CorrectedColorSelect[colorStyling]}
                $isHighlight={isHighlight}
                $isSelected={isSelected}
                $showHover={showHover}
              />
            </ColorOption>
          </Fragment>
        );
      })}
    </ColorList>
  );
};

export default ColorSelector;
