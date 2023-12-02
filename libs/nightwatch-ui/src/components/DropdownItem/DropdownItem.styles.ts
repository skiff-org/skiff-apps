import { css } from 'styled-components';

export const DROPDOWN_ITEM_ICON_CSS = ({ $hovering }: { $hovering: boolean }) => css`
  svg {
    opacity: ${$hovering ? 0.8 : 0.5};
  }
`;
