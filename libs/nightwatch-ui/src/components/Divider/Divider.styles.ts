import { css } from 'styled-components';

import { DividerType } from './Divider.types';

const VERTICAL_CSS = ({ $height, $width }: { $height?: number | string; $width?: number | string }) => {
  const heightValue = $height !== undefined ? (typeof $height === 'string' ? $height : `${$height}px`) : undefined;
  const widthValue = $width !== undefined ? (typeof $width === 'string' ? $width : `${$width}px`) : undefined;
  return css`
    min-height: ${heightValue ?? '100%'};
    max-height: ${heightValue ?? '100%'};
    height: ${heightValue ?? '100%'};
    width: ${widthValue ?? '1px'};
  `;
};

const HORIZONTAL_CSS = ({ $height, $width }: { $height?: number | string; $width?: number | string }) => {
  const heightValue = $height !== undefined ? (typeof $height === 'string' ? $height : `${$height}px`) : undefined;
  const widthValue = $width !== undefined ? (typeof $width === 'string' ? $width : `${$width}px`) : undefined;
  return css`
    min-height: ${heightValue ?? '1px'};
    max-height: ${heightValue ?? '1px'};
    height: ${heightValue ?? '1px'};
    width: ${widthValue ?? '100%'};
  `;
};

export const DIVIDER_TYPE_CSS = ({ $type }: { $type: DividerType }) =>
  $type === DividerType.VERTICAL ? VERTICAL_CSS : HORIZONTAL_CSS;
