import {
  ACCENT_COLOR_VALUES,
  AccentColor,
  CorrectedColorSelect,
  ThemeMode,
  getRGBFromHex,
  getThemedColor
} from 'nightwatch-ui';

import { COLOR_CORRECTED_FADED_BG, FADED_EVENT_OPACITY } from '../constants';

/**
 * Returns the displayed primary and secondary colors for an event
 * with faded opacity taken into consideration
 */
export const getEventColors = (color: AccentColor, themeMode: ThemeMode, isFaded = false) => {
  const [primaryAccentColor, secondaryAccentColor] = ACCENT_COLOR_VALUES[color];
  let displayedPrimaryColor = CorrectedColorSelect[primaryAccentColor];

  if (isFaded) {
    const [primaryRed, primaryGreen, primaryBlue] = getRGBFromHex(displayedPrimaryColor);
    const opacity = isFaded ? FADED_EVENT_OPACITY : 1;
    displayedPrimaryColor = `rgba(${primaryRed}, ${primaryGreen}, ${primaryBlue}, ${opacity})`;
    const displayedSecondaryColor = COLOR_CORRECTED_FADED_BG[color][themeMode];
    return [displayedPrimaryColor, displayedSecondaryColor];
  }

  const stripeColor = getThemedColor(secondaryAccentColor, themeMode);
  const bgColor = getThemedColor('var(--bg-l3-solid)', themeMode);
  const displayedSecondaryColor = `linear-gradient(0deg, ${stripeColor}, ${stripeColor}), ${bgColor}`;

  return [displayedPrimaryColor, displayedSecondaryColor];
};
