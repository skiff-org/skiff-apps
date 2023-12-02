import { css } from 'styled-components';

import { Size } from '../../types';

import { ButtonGroupSize } from './ButtonGroup.types';

const SMALL_CSS = css`
  gap: 6px;
`;

const MEDIUM_CSS = css`
  gap: 8px;
`;

const LARGE_CSS = css`
  gap: 10px;
`;

export const BUTTON_GROUP_SIZE_CSS = ({ $size }: { $size: ButtonGroupSize }) => {
  if ($size === Size.SMALL) return SMALL_CSS;
  if ($size === Size.LARGE) return LARGE_CSS;
  return MEDIUM_CSS;
};
