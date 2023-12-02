import { css } from 'styled-components';

import { Size } from '../../../types';
import { InputFieldSize, InputFieldVariant } from '../InputField.types';

const SMALL_CSS = css`
  border-radius: 10px;
`;

const MEDIUM_CSS = css`
  border-radius: 12px;
`;

const LARGE_CSS = css`
  border-radius: 14px;
`;

export const INPUT_SIZE_CSS = ({
  $size,
  $variant
}: {
  $size: InputFieldSize;
  $variant: InputFieldVariant;
}) => {
  if ($variant === InputFieldVariant.SEARCH || $size === Size.MEDIUM) return MEDIUM_CSS;
  if ($size === Size.SMALL) return SMALL_CSS;
  return LARGE_CSS;
};
