import { themeNames } from '../theme';
import { ThemeMode } from '../types';

/**
 * Convert a string to a hash.
 * See https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 * @param {string} strToHash - String used to compute hash.
 */
function stringToHash(strToHash: string) {
  // randomize so similar words have different colors
  let hash = 0;
  if (strToHash.length === 0) {
    return hash;
  }
  for (let i = 0; i < strToHash.length; i += 1) {
    const char = strToHash.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char;
    // eslint-disable-next-line no-bitwise
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
}

export interface RGBValue {
  r: number;
  g: number;
  b: number;
}

const TEXT_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'disabled',
  'destructive',
  'link',
  'inverse',
  'white',
  'black'
] as const;
const ACCENT_COLORS = ['green', 'orange', 'red', 'yellow', 'pink', 'dark-blue', 'blue'] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];
export type TextColor = (typeof TEXT_COLORS)[number];

export type Color = TextColor | AccentColor;

export const isAccentColor = (color: Color): color is AccentColor => {
  return ACCENT_COLORS.includes(color as AccentColor);
};

export const isTextColor = (color: Color): color is TextColor => {
  return TEXT_COLORS.includes(color as TextColor);
};

export const isColor = (color: string): color is AccentColor => {
  return [...ACCENT_COLORS, ...TEXT_COLORS].includes(color as Color);
};

/** [primary, secondary, accent] */
type ColorOptions = [string, string, AccentColor];

const COLOR_BRIGHTNESS_THRESHOLD = 125;
const COLOR_DIFF_THRESHOLD = 500;

export const TEXT_COLOR_VALUES: Record<TextColor, string> = {
  primary: 'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  tertiary: 'var(--text-tertiary)',
  disabled: 'var(--text-disabled)',
  destructive: 'var(--text-destructive)',
  link: 'var(--text-link)',
  inverse: 'var(--text-inverse)',
  white: 'var(--text-always-white)',
  black: 'var(--text-always-black)'
};

export const ACCENT_COLOR_VALUES: Record<AccentColor, ColorOptions> = {
  red: ['var(--accent-red-primary)', 'var(--accent-red-secondary)', 'red'],
  orange: ['var(--accent-orange-primary)', 'var(--accent-orange-secondary)', 'orange'],
  pink: ['var(--accent-pink-primary)', 'var(--accent-pink-secondary)', 'pink'],
  yellow: ['var(--accent-yellow-primary)', 'var(--accent-yellow-secondary)', 'yellow'],
  green: ['var(--accent-green-primary)', 'var(--accent-green-secondary)', 'green'],
  blue: ['var(--accent-blue-primary)', 'var(--accent-blue-secondary)', 'blue'],
  'dark-blue': ['var(--accent-dark-blue-primary)', 'var(--accent-dark-blue-secondary)', 'dark-blue']
};

// Correct primary and secondary to look visually nicer
export const CorrectedColorSelect: Record<string, string> = {
  'var(--accent-red-primary)': '#D72828',
  'var(--accent-orange-primary)': '#EF5A3C',
  'var(--accent-pink-primary)': '#FFAFD7',
  'var(--accent-yellow-primary)': '#FFCB30',
  'var(--accent-green-primary)': '#00A05E',
  'var(--accent-blue-primary)': '#4AB7EE',
  'var(--accent-dark-blue-primary)': '#0D48BF',
  white: 'white'
};

// Mapping from accent color to only its primary color
export const accentColorToPrimaryColor = Object.fromEntries(
  Object.entries(ACCENT_COLOR_VALUES).map(([accentColor, [primaryColor]]) => [accentColor, primaryColor])
) as Record<AccentColor, string>;

/**
 * Given an color in form var(--color), return the inner --color
 */
export const getInnerColorVar = (colorVar: string): string | undefined => {
  if (!colorVar) return undefined;
  return colorVar.match(/var\((.+)\)/)?.[1];
};

/** Enforces a theme on the color string */
export function getThemedColor(color: string, forceTheme?: ThemeMode): string {
  const innerVar = getInnerColorVar(color);
  if (!forceTheme || !innerVar) return color;

  const themeValues = themeNames[forceTheme];
  return themeValues[innerVar];
}

// Converts string to ColorOptions
export function stringToColor(str: string, forceTheme?: ThemeMode): ColorOptions {
  const numericalHash = stringToHash(str.substring(0, 3)) % Object.keys(ACCENT_COLOR_VALUES).length;
  const [primaryToken, secondaryToken, name] = Object.values(ACCENT_COLOR_VALUES)[numericalHash];

  const themedPrimaryColor = getThemedColor(primaryToken, forceTheme);
  const themedSecondaryColor = getThemedColor(secondaryToken, forceTheme);
  return [themedPrimaryColor, themedSecondaryColor, name];
}

// converts AccentColor to primary and secondary values
export function getAccentColorValues(
  color: AccentColor | Color,
  forceTheme?: ThemeMode
): [string, string, AccentColor | Color] {
  const [primaryColor, secondaryColor, name] = Object.keys(ACCENT_COLOR_VALUES).includes(color)
    ? ACCENT_COLOR_VALUES[color as AccentColor] ?? ACCENT_COLOR_VALUES.red
    : ['var(--bg-l0-solid)', 'var(--text-secondary)', 'disabled'];

  const themedPrimaryColor = getThemedColor(primaryColor, forceTheme);
  const themedSecondaryColor = getThemedColor(secondaryColor, forceTheme);
  return [themedPrimaryColor, themedSecondaryColor, name as AccentColor | Color];
}

// converts Color to primary value
export function getColorTextValue(color: Color, forceTheme?: ThemeMode): string {
  const primaryColor = isAccentColor(color) ? ACCENT_COLOR_VALUES[color][0] : TEXT_COLOR_VALUES[color];
  const themedPrimaryColor = getThemedColor(primaryColor, forceTheme);
  return themedPrimaryColor;
}

// Convert rgba to rgb via Alpha compositing https://en.wikipedia.org/wiki/Alpha_compositing https://stackoverflow.com/questions/2049230/convert-rgba-color-to-rgb
export const rgbaToRgb = (r: number, g: number, b: number, a: number, background: RGBValue) => {
  r = Math.round(((1 - a) * background.r + a * r) % 255);
  g = Math.round(((1 - a) * background.g + a * g) % 255);
  b = Math.round(((1 - a) * background.b + a * b) % 255);
  return { r, g, b };
};

// Convert RGB To HSL https://www.30secondsofcode.org/js/s/rgb-to-hsl
export const RGBToHSL = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const l = Math.max(r, g, b);
  const s = l - Math.min(r, g, b);
  const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0;
  return [
    60 * h < 0 ? 60 * h + 360 : 60 * h,
    100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
    (100 * (2 * l - s)) / 2
  ];
};

// Convert HSL To RGB https://www.30secondsofcode.org/js/s/hsl-to-rgb
export const HSLToRGB = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: 255 * f(0), g: 255 * f(8), b: 255 * f(4) };
};

// calcColorBrightness and calcColorDifference are from https://www.w3.org/TR/AERT/#color-contrast
const calcColorBrightness = (rgb: RGBValue) => {
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
};

const calcColorDifference = (rgb1: RGBValue, rgb2: RGBValue) => {
  return (
    Math.max(rgb1.r, rgb2.r) -
    Math.min(rgb1.r, rgb2.r) +
    Math.max(rgb1.g, rgb2.g) -
    Math.min(rgb1.g, rgb2.g) +
    Math.max(rgb1.b, rgb2.b) -
    Math.min(rgb1.b, rgb2.b)
  );
};

/**
 * Check if color is hard to read with darkmode background
 */
export const isHardToRead = (textColor: RGBValue, background: RGBValue) => {
  if (!textColor) return false;
  const colorBrightness = calcColorBrightness(textColor);
  const colorDifference = calcColorDifference(textColor, background);
  // Algorithm to check if color is dark or not https://www.w3.org/TR/AERT/#color-contrast
  return colorBrightness < COLOR_BRIGHTNESS_THRESHOLD && colorDifference < COLOR_DIFF_THRESHOLD;
};

/**
 * Returns single-tone text and background colors
 * @param {Color | undefined} color
 * @param {boolean | undefined} disabled
 * @param {string | undefined} label
 * @param {ThemeMode | undefined} forceTheme
 */
export const getTextAndBgColors = (
  color?: Color,
  disabled?: boolean,
  label?: string,
  forceTheme?: ThemeMode
): [Color, string] => {
  if (disabled) {
    const colorName = 'secondary';
    const secondaryColor = 'var(--bg-overlay-secondary)';
    const themedSecondaryColor = getThemedColor(secondaryColor, forceTheme);
    return [colorName, themedSecondaryColor];
  }

  if (!color || (!isAccentColor(color) && !isTextColor(color))) {
    const [, secondaryColor, colorName] = stringToColor(label ?? '', forceTheme);
    return [colorName, secondaryColor];
  }

  if (isAccentColor(color)) {
    // Color passed is an accent color
    const [, secondaryColor, colorName] = getAccentColorValues(color, forceTheme);
    return [colorName, secondaryColor];
  } else {
    // Color passed is a text color
    const colorName = color;
    const secondaryColor = 'var(--bg-overlay-tertiary)';
    return [colorName, secondaryColor];
  }
};

/** Converts hexadecimal value to RGB */
export const getRGBFromHex = (hexValue: string) => {
  const red = parseInt(hexValue.substring(1, 3), 16);
  const green = parseInt(hexValue.substring(3, 5), 16);
  const blue = parseInt(hexValue.substring(5, 7), 16);
  return [red, green, blue];
};
