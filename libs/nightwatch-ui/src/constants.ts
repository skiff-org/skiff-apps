import { Size } from './types';

export const MOUSE_SAFE_AREA_CLASSNAME = 'mouse-safe-area';

/** Maps Small, Medium and Large sizes to their corresponding height values */
export const SIZE_HEIGHT: Record<Size.X_SMALL | Size.SMALL | Size.MEDIUM | Size.LARGE, number> = {
  xsmall: 28,
  small: 33,
  medium: 35,
  large: 42
};
