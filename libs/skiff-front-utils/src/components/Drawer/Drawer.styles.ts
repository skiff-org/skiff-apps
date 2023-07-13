import isNumber from 'lodash/isNumber';
import { css } from 'styled-components';

import { ThemeMode, getThemedColor } from '@skiff-org/skiff-ui';

export const DRAWER_PAPER_CSS = ({
  $forceTheme,
  $verticalScroll,
  $borderRadius
}: {
  $forceTheme: ThemeMode;
  $verticalScroll: boolean;
  $borderRadius?: string | number;
}) => {
  let borderRadius = '16px';
  if (!!$borderRadius) {
    borderRadius = isNumber($borderRadius) ? `${$borderRadius}px` : $borderRadius;
  }

  return css`
    border-radius: ${borderRadius} ${borderRadius} 0 0;
    background: ${getThemedColor('var(--bg-l3-solid)', $forceTheme)} !important;
    box-shadow: ${getThemedColor('var(--skiff-drawer-shadow)', $forceTheme)};
    overflow-y: ${$verticalScroll ? 'visible' : 'hidden'};
  `;
};

export const TITLE_CSS = css`
  padding: 4px 8px 8px 8px;
  text-transform: uppercase;
`;
