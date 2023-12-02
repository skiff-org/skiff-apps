import { Size } from '../../types';
import { TypographySize } from '../Typography';

import { IconSize, IconTextSize } from './IconText.types';

export const ICON_TEXT_ICON_SIZE: Record<IconTextSize, IconSize | number> = {
  xsmall: 8,
  small: Size.SMALL,
  medium: Size.MEDIUM,
  large: Size.X_MEDIUM
};

export const ICON_TEXT_TYPOGRAPHY_SIZE: Record<IconTextSize, TypographySize> = {
  xsmall: TypographySize.CAPTION,
  small: TypographySize.SMALL,
  medium: TypographySize.MEDIUM,
  large: TypographySize.LARGE
};
