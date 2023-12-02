import { Size, Type } from '../../types';
import { Color } from '../../utils/colorUtils';

export type ButtonSize = Size.SMALL | Size.MEDIUM | Size.LARGE;

/** Maps button size to icon size */
export const BUTTON_ICON_SIZE: Record<ButtonSize, Size> = {
  small: Size.SMALL,
  medium: Size.MEDIUM,
  large: Size.X_MEDIUM
};

/** Maps button type to text / icon color */
export const BUTTON_TYPE_COLOR: Record<Type, Color> = {
  primary: 'inverse',
  secondary: 'primary',
  tertiary: 'primary',
  destructive: 'destructive'
};
