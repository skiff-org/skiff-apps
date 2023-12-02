import { motion } from 'framer-motion';
import * as React from 'react';
import styled from 'styled-components';

import { SQUARE_CSS } from '../../styles';
import { Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

import { KNOB_SIZE } from './Toggle.constants';
import { TOGGLE_CONTAINER_SIZE_CSS, TOGGLE_CONTAINER_STATE_CSS } from './Toggle.styles';
import { ToggleProps, ToggleSize } from './Toggle.types';

const ToggleContainer = styled.div<{
  $checked: boolean;
  $disabled: boolean;
  $size: ToggleSize;
  $forceTheme?: ThemeMode;
}>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 14px;
  transition: background 0.5s ease-in-out;
  box-sizing: border-box;

  cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};

  ${TOGGLE_CONTAINER_SIZE_CSS}
  ${TOGGLE_CONTAINER_STATE_CSS}
`;

const Knob = styled(motion.div)<{ $size: number; $forceTheme?: ThemeMode }>`
  background: white;
  border-radius: 100px;
  box-shadow: ${(props) => getThemedColor('var(--shadow-l1)', props.$forceTheme)};

  ${SQUARE_CSS}
`;

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  dataTest,
  disabled = false,
  forceTheme,
  size = Size.MEDIUM
}) => {
  const knobSize = KNOB_SIZE[size];

  return (
    <ToggleContainer
      data-test={dataTest}
      onClick={!disabled ? onChange : undefined}
      $checked={checked}
      $disabled={disabled}
      $forceTheme={forceTheme}
      $size={size}
    >
      <Knob initial={false} animate={{ x: checked ? knobSize : 0 }} $size={knobSize} />
    </ToggleContainer>
  );
};

export default Toggle;
