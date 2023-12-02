import { Size } from '../../types';
import { TypographySize } from '../Typography';

import { SizeStyles } from './Avatar.types';

/** Rounded border radius */
export const FULL_RADIUS = 100;

export const SIZE_STYLES: Record<Size, SizeStyles> = {
  xsmall: {
    avatarSize: 16,
    borderRadius: 4,
    borderWidth: 1,
    iconSize: Size.X_SMALL,
    typographySize: TypographySize.CAPTION
  },
  small: {
    avatarSize: 20,
    borderRadius: 5,
    borderWidth: 1,
    iconSize: Size.X_SMALL,
    typographySize: TypographySize.SMALL
  },
  medium: {
    avatarSize: 24,
    borderRadius: 6,
    borderWidth: 2,
    iconSize: Size.SMALL,
    typographySize: TypographySize.MEDIUM
  },
  xmedium: {
    avatarSize: 32,
    borderRadius: 8,
    borderWidth: 3,
    iconSize: Size.MEDIUM,
    typographySize: TypographySize.LARGE
  },
  large: {
    avatarSize: 36,
    borderRadius: 8,
    borderWidth: 3,
    iconSize: Size.MEDIUM,
    typographySize: TypographySize.LARGE
  },
  xlarge: {
    avatarSize: 85,
    borderRadius: 16,
    borderWidth: 2.5,
    iconSize: Size.X_LARGE,
    typographySize: TypographySize.H1
  }
};
