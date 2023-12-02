import { css } from 'styled-components';

import { Alignment } from '../../types';
import { Color } from '../../utils/colorUtils';

import { TypographyOverflow, TypographySize, TypographyWeight } from './Typography.constants';

/** Alignment-specific styles */
export const ALIGNMENT_CSS = css`
  ${({ $align }: { $align: Alignment }) => `
    text-align: ${$align};
    justify-content: ${$align};
  `}
`;

/** Overflow-specific styles */
export const OVERFLOW_CSS = css`
  ${({ $overflow, $wrap }: { $overflow: TypographyOverflow; $wrap: boolean }) => `
    text-overflow: ellipsis;
    overflow: ${$overflow};
    white-space: ${$wrap ? 'normal' : 'nowrap'};
    `}
`;

/** TypographySize.H1 styles */
const H1_CSS = css`
  font-size: 34px;
  line-height: 120%;
  letter-spacing: -0.02em;
`;

/** TypographySize.H2 styles */
const H2_CSS = css`
  font-size: 28px;
  line-height: 120%;
  letter-spacing: -0.02em;
`;

/** TypographySize.H3 styles */
const H3_CSS = css`
  font-size: 22px;
  line-height: 28px;
  letter-spacing: -0.02em;
`;

/** TypographySize.H4 styles */
const H4_CSS = css`
  font-size: 19px;
  line-height: 130%;
  letter-spacing: -0.02em;
`;

/** TypographySize.LARGE styles */
export const LARGE_CSS = css`
  font-size: 17px;
  line-height: 130%;
  letter-spacing: -0.01em;
`;

/** TypographySize.MEDIUM styles */
export const MEDIUM_CSS = css`
  font-size: 15px;
  line-height: 130%;
  letter-spacing: 0em;
`;

/** TypographySize.SMALL styles */
export const SMALL_CSS = css`
  font-size: 13px;
  line-height: 130%;
  letter-spacing: 0em;
`;

/** TypographySize.CAPTION styles */
const CAPTION_CSS = css`
  font-size: 11px;
  line-height: 130%;
  letter-spacing: 0.01em;
`;

/** Text-specific styles */
export const TEXT_CSS = css`
  ${({
    $capitalize,
    $uppercase,
    $fontColor,
    $mono,
    $size,
    $weight,
    $transition
  }: {
    $capitalize: boolean;
    $uppercase: boolean;
    $fontColor: Color;
    $mono: boolean;
    $size: TypographySize;
    $weight: TypographyWeight;
    $transition?: string;
  }) => {
    let styles = `
      color: ${$fontColor};
      font-weight: ${$weight};
      font-family: ${
        $mono
          ? "Skiff Mono, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
          : "Skiff Sans Text, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"
      };
      text-transform: ${$capitalize ? 'capitalize' : $uppercase ? 'uppercase' : ''};
      transition: ${$transition ?? ''};

      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    `;

    switch ($size) {
      case TypographySize.H1:
        styles += H1_CSS;
        break;
      case TypographySize.H2:
        styles += H2_CSS;
        break;
      case TypographySize.H3:
        styles += H3_CSS;
        break;
      case TypographySize.H4:
        styles += H4_CSS;
        break;
      case TypographySize.LARGE:
        styles += LARGE_CSS;
        break;
      case TypographySize.SMALL:
        styles += SMALL_CSS;
        break;
      case TypographySize.CAPTION:
        styles += CAPTION_CSS;
        break;
      case TypographySize.MEDIUM:
      default:
        styles += MEDIUM_CSS;
    }

    return styles;
  }}
`;

/** Width-specific styles */
export const WIDTH_CSS = ({
  $align,
  $maxWidth,
  $minWidth,
  $width
}: {
  $align: Alignment;
  $maxWidth?: number | string;
  $minWidth?: number | string;
  $width?: number | string;
}) => {
  const customWidth = $width ? (typeof $width === 'string' ? $width : `${$width}px`) : undefined;
  const customMaxWidth = $maxWidth ? (typeof $maxWidth === 'string' ? $maxWidth : `${$maxWidth}px`) : undefined;
  const customMinWidth = $minWidth ? (typeof $minWidth === 'string' ? $minWidth : `${$minWidth}px`) : undefined;
  return css`
    width: ${customWidth ?? ($align === Alignment.INHERIT ? 'fit-content' : '100%')};
    max-width: ${customMaxWidth ?? '100%'};
    min-width: ${customMinWidth ?? '0px'};
  `;
};
