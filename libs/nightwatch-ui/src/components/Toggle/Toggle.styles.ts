import { css } from 'styled-components';

import { Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

import { ToggleSize } from './Toggle.types';

const TOGGLE_CONTAINER_SMALL_CSS = css`
  width: 20px;
  height: 12px;
  padding: 2px;
`;

const TOGGLE_CONTAINER_MEDIUM_CSS = css`
  width: 38px;
  height: 22px;
  padding: 3px;
`;

export const TOGGLE_CONTAINER_SIZE_CSS = ({ $size }: { $size: ToggleSize }) =>
  $size === Size.SMALL ? TOGGLE_CONTAINER_SMALL_CSS : TOGGLE_CONTAINER_MEDIUM_CSS;

const TOGGLE_CONTAINER_CHECKED_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  background: ${getThemedColor('var(--accent-green-primary)', $forceTheme)};
`;

const TOGGLE_CONTAINER_UNCHECKED_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  background: ${getThemedColor('var(--bg-overlay-secondary)', $forceTheme)};
`;

export const TOGGLE_CONTAINER_STATE_CSS = ({ $checked }: { $checked: boolean }) =>
  $checked ? TOGGLE_CONTAINER_CHECKED_CSS : TOGGLE_CONTAINER_UNCHECKED_CSS;
