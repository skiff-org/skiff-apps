import { ThemeMode } from 'nightwatch-ui';

export const FADED_EVENT_OPACITY = 0.6;

/**
 * Maps event colors to their faded colors
 * We use these color-corrected colors instead of applying opacity to faded events
 * in order for the event to be fully opaque, preventing overlapping text in Week view
 */
export const COLOR_CORRECTED_FADED_BG: Record<string, Record<ThemeMode, string>> = {
  'dark-blue': { light: '#eef3ff', dark: '#333844' },
  blue: { light: '#e6f4fd', dark: '#2b3941' },
  green: { light: '#eaf9f2', dark: '#273a2f' },
  yellow: { light: '#f9efd8', dark: '#3f3826' },
  pink: { light: '#fdecf4', dark: '#42343a' },
  orange: { light: '#ffeeeb', dark: '#453330' },
  red: { light: '#ffefef', dark: '#453334' }
};
