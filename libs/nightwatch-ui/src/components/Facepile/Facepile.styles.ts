import { css } from 'styled-components';

import { Layout } from '../../types';
import { SIZE_STYLES as AVATAR_SIZE_STYLES } from '../Avatar/Avatar.constants';

import { FacepileSize, MAX_STACKED_AVATARS, STACKED_AVATAR_BORDER_WIDTH } from './Facepile.constants';
import { getStackedAvatarPositions, getStackedFacepileWrapperSize } from './Facepile.utils';

/** Inline Facepile wrapper CSS */
const INLINE_FACEPILE_WRAPPER_CSS = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

/** Stacked Facepile wrapper CSS */
const STACKED_FACEPILE_WRAPPER_CSS = ({
  $avatarsOverflow,
  $numOfAvatars,
  $size
}: {
  $avatarsOverflow: boolean;
  $numOfAvatars: number;
  $size: FacepileSize;
}) => {
  const numOfItemsToLayout = $avatarsOverflow ? MAX_STACKED_AVATARS + 1 : $numOfAvatars;
  const { width, height } = getStackedFacepileWrapperSize(numOfItemsToLayout, $size);
  return css`
    position: relative;
    width: ${width}px;
    height: ${height}px;
  `;
};

/** Returns layout-specific styles */
export const FACEPILE_WRAPPER_LAYOUT_CSS = ({ $layout }: { $layout: Layout }) =>
  $layout === Layout.INLINE ? INLINE_FACEPILE_WRAPPER_CSS : STACKED_FACEPILE_WRAPPER_CSS;

/** Stacked Avatar wrapper CSS */
export const STACKED_AVATAR_WRAPPER_CSS = ({
  $index,
  $avatarsOverflow,
  $numOfAvatars,
  $size
}: {
  $index: number;
  $avatarsOverflow: boolean;
  $numOfAvatars: number;
  $size: FacepileSize;
}) => {
  const { borderRadius: avatarBorderRadius } = AVATAR_SIZE_STYLES[$size];
  const innerOffset = STACKED_AVATAR_BORDER_WIDTH;
  // If there's an overflow, factor in an extra slot for the more label
  const numOfItemsToLayout = $avatarsOverflow ? MAX_STACKED_AVATARS + 1 : $numOfAvatars;
  const position = getStackedAvatarPositions($index, numOfItemsToLayout, $size);
  return css`
    z-index: ${$index};
    position: absolute;
    left: ${position.left}px;
    top: ${position.top}px;
    ${$numOfAvatars > 1 &&
    `
      border-radius: ${avatarBorderRadius + innerOffset}px;
      padding: ${innerOffset}px;
    `}
  `;
};

/** Inline Avatar wrapper CSS */
export const INLINE_AVATAR_WRAPPER_CSS = ({
  $index,
  $numOfAvatars,
  $size
}: {
  $index: number;
  $numOfAvatars: number;
  $size: FacepileSize;
}) => {
  const { avatarSize, borderRadius: avatarBorderRadius } = AVATAR_SIZE_STYLES[$size];
  const innerOffset = AVATAR_SIZE_STYLES[$size].borderWidth;
  return css`
    // Each Avatar overlaps a third of the previous Avatar
    margin-left: ${$index > 0 ? `-${avatarSize / 3}` : 0}px;
    // The first Avatar should be the top-most Avatar
    z-index: ${$numOfAvatars - $index};
    ${$numOfAvatars > 1 &&
    `
      border-radius: ${avatarBorderRadius + innerOffset}px;
      padding: ${innerOffset}px;
    `}
  `;
};

/** Returns layout and size-specific styles */
export const AVATAR_WRAPPER_CSS = ({ $layout }: { $layout: Layout }) =>
  $layout === Layout.INLINE ? INLINE_AVATAR_WRAPPER_CSS : STACKED_AVATAR_WRAPPER_CSS;
