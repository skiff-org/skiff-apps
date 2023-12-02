import { css } from 'styled-components';

import { FilledVariant, ThemeMode, Type } from '../../../types';
import { getThemedColor } from '../../../utils/colorUtils';
import { BUTTON_TYPE_CONTAINER_CSS, TERTIARY_BUTTON_CSS } from '../Button.styles';

import { IconButtonType } from './IconButton.types';

export const GHOST_ICON_BUTTON_CSS = ({
  $type,
  $forceTheme
}: {
  $type: IconButtonType;
  $forceTheme?: ThemeMode;
}) => css`
  ${TERTIARY_BUTTON_CSS}
  ${$type === Type.DESTRUCTIVE &&
  css`
    &:active,
    &.active {
      background: ${getThemedColor('var(--cta-destructive-active)', $forceTheme)};
    }
    &:hover {
      background: ${getThemedColor('var(--cta-destructive-hover)', $forceTheme)};
    }
    &.disabled {
      background: transparent;
    }
  `}
`;

export const ICON_BUTTON_VARIANT_CSS = ({ $variant }: { $variant: FilledVariant }) =>
  $variant === FilledVariant.FILLED ? BUTTON_TYPE_CONTAINER_CSS : GHOST_ICON_BUTTON_CSS;
