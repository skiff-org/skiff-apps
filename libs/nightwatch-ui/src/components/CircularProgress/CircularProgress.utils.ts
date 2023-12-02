import { ThemeMode } from '../../types';
import { Color, getColorTextValue, getInnerColorVar, getThemedColor } from '../../utils/colorUtils';

export const getColorValue = (color: Color | string, forceTheme?: ThemeMode) => {
  if (getInnerColorVar(color)) return getThemedColor(color, forceTheme);
  return getColorTextValue(color as Color, forceTheme);
};
