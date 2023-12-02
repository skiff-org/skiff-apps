import { ThemeMode } from 'nightwatch-ui';

export const EVENT_WITH_BG_HOVER_OPACITY = 0.52;
export const EVENT_WITHOUT_BG_HOVER_OPACITY = 0.16;

export const HOVER_EFFECT_CLASS_NAME = 'event-card-hover-effect';

export const CALENDAR_BG_COLOR: Record<ThemeMode, { default: string; faded: string }> = {
  light: { default: 'var(--bg-l3-solid)', faded: 'var(--bg-l1-solid)' },
  dark: { default: 'var(--bg-l2-solid)', faded: 'var(--bg-l3-solid)' }
};
