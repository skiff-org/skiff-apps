import * as React from 'react';
import styled from 'styled-components';

import { Alignment } from '../../types';
import { Color, getColorTextValue } from '../../utils/colorUtils';

import {
  TextDecoration,
  TypographyOverflow,
  TypographyProps,
  TypographySize,
  TypographyWeight
} from './Typography.constants';
import { ALIGNMENT_CSS, OVERFLOW_CSS, TEXT_CSS, WIDTH_CSS } from './Typography.styles';

const OuterText = styled.span<{
  $align: Alignment;
  $capitalize: boolean;
  $clickable: boolean;
  $fontColor: Color;
  $inline: boolean;
  $size: TypographySize;
  $uppercase: boolean;
  $weight: TypographyWeight;
  $mono: boolean;
  $maxWidth?: number | string;
  $minWidth?: number | string;
  $transition?: string;
  $width?: number | string;
}>`
  display: ${(props) => (props.$inline ? 'inline-flex' : 'flex')};
  overflow-wrap: break-word;

  ${(props) => props.$clickable && 'cursor: pointer;'}

  ${ALIGNMENT_CSS}
  ${TEXT_CSS}
  ${WIDTH_CSS}
`;

const InnerText = styled.span<{
  $overflow: TypographyOverflow;
  $selectable: boolean;
  $wrap: boolean;
  $isMono: boolean;
  $textDecoration?: TextDecoration;
}>`
  ${(props) => props.$textDecoration && `text-decoration: ${props.$textDecoration};`}
  ${(props) => !props.$selectable && 'user-select: none;'}
  ${OVERFLOW_CSS}
  ${(props) => props.$isMono && 'margin-top: 2px;'}
`;

const Typography: React.FC<TypographyProps> = ({
  children,
  align = Alignment.INHERIT,
  capitalize,
  className,
  color = 'primary',
  dataTest,
  forceTheme,
  id,
  inline = false,
  size = TypographySize.MEDIUM,
  maxWidth,
  minWidth,
  mono = false,
  overflow = TypographyOverflow.HIDDEN,
  selectable = true,
  textDecoration,
  transition,
  uppercase,
  weight = TypographyWeight.REGULAR,
  width,
  wrap = false,
  onClick
}) => {
  const fontColor = getColorTextValue(color, forceTheme) as Color;

  return (
    <OuterText
      id={id}
      data-test={dataTest}
      className={className}
      onClick={onClick}
      $align={align}
      $capitalize={!!capitalize}
      $uppercase={!!uppercase}
      $clickable={!!onClick}
      $fontColor={fontColor}
      $inline={inline}
      $size={size}
      $weight={weight}
      $mono={mono}
      $maxWidth={maxWidth}
      $minWidth={minWidth}
      $transition={transition}
      $width={width}
    >
      <InnerText
        $overflow={overflow}
        $isMono={mono}
        $selectable={selectable}
        $textDecoration={textDecoration}
        $wrap={wrap}
      >
        {children}
      </InnerText>
    </OuterText>
  );
};

export default Typography;
