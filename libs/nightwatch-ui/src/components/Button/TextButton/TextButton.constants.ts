import { TypographySize } from '../../Typography';
import { ButtonSize } from '../Button.constants';

import { TextButtonSizeStyles } from './TextButton.types';

/** Maps button size to typography size */
export const TYPOGRAPHY_SIZE: Record<ButtonSize, TypographySize> = {
  small: TypographySize.SMALL,
  medium: TypographySize.MEDIUM,
  large: TypographySize.LARGE
};

/** Maps button size to size-specific styles -- padding and gap */
export const SIZE_STYLES: Record<ButtonSize, TextButtonSizeStyles> = {
  small: {
    horizontalPadding: 16,
    gap: 4
  },
  medium: {
    horizontalPadding: 16,
    gap: 6
  },
  large: {
    horizontalPadding: 24,
    gap: 8
  }
};
