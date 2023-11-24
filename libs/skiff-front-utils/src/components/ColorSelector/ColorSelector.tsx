import { AccentColor, CorrectedColorSelect, getThemedColor, ThemeMode, useOnClickOutside } from 'nightwatch-ui';
import React, { Fragment } from 'react';
import styled from 'styled-components';

import { useRef, useState } from 'react';
import { useTheme } from '../../theme/AppThemeProvider';
import ColorPicker from './ColorPicker';

const ColorList = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const CustomColorContainer = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 28px;
  margin: 2px;
  display: flex;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  box-sizing: border-box;
  cursor: pointer;
`;

const CustomColor = styled.div`
  background: conic-gradient(
    rgb(235, 87, 87),
    rgb(242, 201, 76),
    rgb(76, 183, 130),
    rgb(78, 167, 252),
    rgb(250, 96, 122)
  );
  box-sizing: border-box;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  aspect-ratio: 1;
`;

interface ColorSelectorProps {
  colorToStyling: Record<AccentColor, string>;
  value: string;
  handleChange: (newValue: AccentColor | string, evt?: React.MouseEvent) => void;
  handlePickerChange?: (newValue: string) => void;
  pickerColorContainerRef?: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
  hideSelected?: boolean;
  showHover?: boolean;
  isHighlight?: boolean;
  pickerLeftOffset?: number;
  pickerTopOffset?: number;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colorToStyling,
  value,
  handleChange,
  handlePickerChange,
  pickerColorContainerRef,
  disabled,
  hideSelected,
  showHover,
  isHighlight,
  pickerLeftOffset = -100,
  pickerTopOffset = 30
}) => {
  const { theme } = useTheme();
  const [openPicker, setOpenPicker] = useState<boolean>(false);
  const customColorButtonRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  const closeColorPicker = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
    if (openPicker) {
      setOpenPicker(false);
    }
  };

  const colorContainerRef = pickerColorContainerRef ?? fallbackRef;

  useOnClickOutside(colorContainerRef, closeColorPicker);

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
      {!!handlePickerChange && (
        <>
          <CustomColorContainer ref={customColorButtonRef}>
            <CustomColor onClick={() => setOpenPicker(true)} />
          </CustomColorContainer>
          <ColorPicker
            handleColorChange={(color: string) => {
              handlePickerChange(color);
            }}
            colorContainerRef={colorContainerRef}
            buttonRef={customColorButtonRef}
            open={openPicker}
            value={value}
            leftOffset={pickerLeftOffset}
            topOffset={pickerTopOffset}
          />
        </>
      )}
    </ColorList>
  );
};

export default ColorSelector;
