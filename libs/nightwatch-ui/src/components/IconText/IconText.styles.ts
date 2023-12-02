import { css } from 'styled-components';

import { FilledVariant, Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

import { IconTextSize } from './IconText.types';


const X_SMALL_CSS = css`
  gap: 4px;
`;

const SMALL_CSS = css`
  gap: 6px;
`;

const MEDIUM_CSS = css`
  gap: 8px;
`;

const LARGE_CSS = css`
  gap: 10px;
`;

export const ICON_TEXT_SIZE_CSS = ({ $size }: { $size: IconTextSize }) => {
  if ($size === Size.X_SMALL) return X_SMALL_CSS;
  if ($size === Size.SMALL) return SMALL_CSS;
  if ($size === Size.LARGE) return LARGE_CSS;
  return MEDIUM_CSS;
};

export const INTERACTIVE_ICON_TEXT_CSS = ({
  $isDestructive,
  $isHovering,
  $forceTheme
}: {
  $isDestructive: boolean;
  $isHovering: boolean;
  $forceTheme?: ThemeMode;
}) => {
  const hoverBg = $isDestructive ? 'var(--bg-overlay-destructive)' : 'var(--bg-overlay-tertiary)';
  return css`
    cursor: pointer;
    ${$isHovering && `background: ${getThemedColor(hoverBg, $forceTheme)};`}
  `;
};

const GHOST_ICON_TEXT_CSS = () => css`
  padding: 4px;
`;

const FILLED_ICON_TEXT_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  padding: 4px 8px;
  height: 27px;
  background: ${getThemedColor('var(--cta-secondary-default)', $forceTheme)};
  border: 1px solid ${getThemedColor('var(--border-secondary)', $forceTheme)};
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.02);
`;

export const ICON_TEXT_TYPE_CSS = ({ $variant }: { $variant: FilledVariant }) => {
  if ($variant === FilledVariant.FILLED) return FILLED_ICON_TEXT_CSS;
  return GHOST_ICON_TEXT_CSS;
};
