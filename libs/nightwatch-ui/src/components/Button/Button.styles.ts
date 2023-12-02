import { css } from 'styled-components';

import { ThemeMode, Type } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

/** Type.PRIMARY CSS */
export const PRIMARY_BUTTON_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  border: 1px solid transparent;
  background: ${getThemedColor('var(--cta-primary-default)', $forceTheme)};
  box-shadow: ${getThemedColor('var(--shadow-l1)', $forceTheme)};

  &:active,
  &.active {
    background: ${getThemedColor(`var(--cta-primary-active)`, $forceTheme)};
  }
  &:hover {
    background: ${getThemedColor(`var(--cta-primary-hover)`, $forceTheme)};
  }
  &.disabled {
    background: ${getThemedColor(`var(--cta-primary-disabled)`, $forceTheme)};
    box-shadow: none;
  }
`;

/** Type.SECONDARY CSS */
export const SECONDARY_BUTTON_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  border: 1px solid ${getThemedColor('var(--border-secondary)', $forceTheme)};
  background: ${getThemedColor(`var(--cta-secondary-default)`, $forceTheme)};

  &:active,
  &.active {
    background: ${getThemedColor(`var(--cta-secondary-active)`, $forceTheme)};
  }
  &:hover {
    background: ${getThemedColor(`var(--cta-secondary-hover)`, $forceTheme)};
  }
  &.disabled {
    background: ${getThemedColor(`var(--cta-secondary-disabled)`, $forceTheme)};
  }
`;

/** Type.TERTIARY CSS */
export const TERTIARY_BUTTON_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  border: 1px solid transparent;
  background: ${getThemedColor(`var(--cta-tertiary-default)`, $forceTheme)};

  &:active,
  &.active {
    background: ${getThemedColor(`var(--bg-overlay-secondary)`, $forceTheme)};
  }
  &:hover {
    background: ${getThemedColor(`var(--bg-overlay-tertiary)`, $forceTheme)};
  }
  &.disabled {
    background: ${getThemedColor(`var(--cta-tertiary-disabled)`, $forceTheme)};
  }
`;

/** Type.DESTRUCTIVE CSS */
export const DESTRUCTIVE_BUTTON_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  border: 1px solid ${getThemedColor('var(--border-destructive)', $forceTheme)};
  background: ${getThemedColor(`var(--cta-destructive-default)`, $forceTheme)};

  &:active,
  &.active {
    background: ${getThemedColor(`var(--cta-destructive-active)`, $forceTheme)};
  }
  &:hover {
    background: ${getThemedColor(`var(--cta-destructive-hover)`, $forceTheme)};
  }
  &.disabled {
    background: ${getThemedColor(`var(--cta-destructive-disabled)`, $forceTheme)};
  }
`;

/** Type-specific button styles */
export const BUTTON_TYPE_CONTAINER_CSS = ({ $type }: { $type: Type; $forceTheme?: ThemeMode }) => {
  switch ($type) {
    case Type.SECONDARY:
      return SECONDARY_BUTTON_CSS;
    case Type.TERTIARY:
      return TERTIARY_BUTTON_CSS;
    case Type.DESTRUCTIVE:
      return DESTRUCTIVE_BUTTON_CSS;
    case Type.PRIMARY:
    default:
      return PRIMARY_BUTTON_CSS;
  }
};
