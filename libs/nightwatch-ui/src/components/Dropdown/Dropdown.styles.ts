import { css } from 'styled-components';

export const HIDE_MOUSE_CSS = css`
  * {
    // Needed to disable hover interactions when keyboard navigation is active
    pointer-events: none;
  }
`;

export const NON_ANCHORED_DROPDOWN_CSS = css`
  position: static;
`;

export const ANCHORED_DROPDOWN_CSS = ({
  $anchor,
  $defaultLeft,
  $defaultTop
}: {
  $anchor: { top?: number; bottom?: number; left?: number; right?: number };
  $defaultLeft?: number;
  $defaultTop?: number;
}) => {
  const hasTopAnchor = $anchor.top !== undefined;
  const hasBottomAnchor = $anchor.bottom !== undefined;
  const hasLeftAnchor = $anchor.left !== undefined;
  const hasRightAnchor = $anchor.right !== undefined;

  // A dropdown is either anchored from the top-left or from the bottom-right,
  // so if a dropdown does not have a 'top' anchor, but has a 'bottom' anchor,
  // then we don't need to assign the default top value
  // Same goes to the 'left' property
  const top = !hasTopAnchor && !hasBottomAnchor ? $defaultTop : $anchor.top;
  const bottom = $anchor.bottom;
  const left = !hasLeftAnchor && !hasRightAnchor ? $defaultLeft : $anchor.left;
  const right = $anchor.right;

  return css`
    position: absolute;
    ${top !== undefined && `top: ${top}px;`}
    ${bottom !== undefined && `bottom: ${bottom}px;`}
    ${left !== undefined && `left: ${left}px;`}
    ${right !== undefined && `right: ${right}px;`}

    // If the anchor hasn't been set yet, hide the dropdown
    // to avoid visible reposition if the dropdown overflows
    visibility: ${hasTopAnchor || hasBottomAnchor || hasLeftAnchor || hasRightAnchor ? 'visible' : 'hidden'};
  `;
};
