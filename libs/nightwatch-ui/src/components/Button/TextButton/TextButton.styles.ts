import { css } from 'styled-components';

import { SIZE_HEIGHT } from '../../../constants';
import { Size } from '../../../types';
import { ButtonSize } from '../Button.constants';

import { SIZE_STYLES } from './TextButton.constants';

/** Size.SMALL styles */
const SMALL_CSS = css`
  height: ${SIZE_HEIGHT[Size.SMALL]}px;
  padding: 0px ${SIZE_STYLES[Size.SMALL].horizontalPadding}px;
  border-radius: 12px;
`;

/** Size.MEDIUM styles */
const MEDIUM_CSS = css`
  height: ${SIZE_HEIGHT[Size.MEDIUM]}px;
  padding: 0px ${SIZE_STYLES[Size.MEDIUM].horizontalPadding}px;
  border-radius: 14px;
`;

/** Size.LARGE styles */
const LARGE_CSS = css`
  height: ${SIZE_HEIGHT[Size.LARGE]}px;
  padding: 0px ${SIZE_STYLES[Size.LARGE].horizontalPadding}px;
  border-radius: 16px;
`;

/** Size-specific button container styles */
export const BUTTON_SIZE_CONTAINER_CSS = ({ $size }: { $size: ButtonSize }) => {
  switch ($size) {
    case Size.SMALL:
      return SMALL_CSS;
    case Size.LARGE:
      return LARGE_CSS;
    case Size.MEDIUM:
    default:
      return MEDIUM_CSS;
  }
};
