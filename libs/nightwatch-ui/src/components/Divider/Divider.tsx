import * as React from 'react';
import styled from 'styled-components';

import { ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

import { DIVIDER_TYPE_CSS } from './Divider.styles';
import { DividerColor, DividerProps, DividerType } from './Divider.types';
import { getDividerColor } from './Divider.utils';

const StyledHR = styled.hr<{
  $color: DividerColor | string;
  $type: DividerType;
  $forceTheme?: ThemeMode;
  $height?: number | string;
  $width?: number | string;
}>`
  border: none;
  margin-bottom: 0px;
  margin-top: 0px;
  border-radius: 100px;

  ${(props) => {
    const dividerColor = getDividerColor(props.$color);
    const themedColor = getThemedColor(dividerColor, props.$forceTheme);
    return `
      color: ${themedColor};
      background: ${themedColor};
    `;
  }}

  ${DIVIDER_TYPE_CSS}
`;

const Divider: React.FC<DividerProps> = ({
  className,
  color = 'secondary',
  forceTheme,
  height,
  style,
  type = DividerType.HORIZONTAL,
  width
}) => (
  <StyledHR
    className={className}
    style={style}
    $color={color}
    $forceTheme={forceTheme}
    $height={height}
    $type={type}
    $width={width}
  />
);

export default Divider;
