import { css } from 'styled-components';

import { FilledVariant, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';

const FILLED_CSS = ({
  $clickable,
  $destructive,
  $forceTheme
}: {
  $clickable: boolean;
  $destructive: boolean;
  $forceTheme?: ThemeMode;
}) => css`
  background: ${getThemedColor(
  $destructive ? 'var(--bg-overlay-destructive)' : 'var(--bg-overlay-tertiary)',
  $forceTheme
)};
  ${$clickable &&
  `
    &:hover {
      background: ${getThemedColor(
    $destructive ? 'var(--bg-overlay-destructive)' : 'var(--bg-overlay-secondary)',
    $forceTheme
  )};
    }
  `}
`;

const UNFILLED_CSS = ({
  $clickable,
  $destructive,
  $forceTheme
}: {
  $clickable: boolean;
  $destructive: boolean;
  $forceTheme?: ThemeMode;
}) => css`
  background: transparent;
  ${$clickable &&
  `
      &:hover {
        background: ${getThemedColor(
    $destructive ? 'var(--bg-overlay-destructive)' : 'var(--bg-overlay-tertiary)',
    $forceTheme
  )};
      }
    `}
`;

export const CHIP_TYPE_CSS = ({ $variant }: { $variant: FilledVariant }) =>
  $variant === FilledVariant.FILLED ? FILLED_CSS : UNFILLED_CSS;
