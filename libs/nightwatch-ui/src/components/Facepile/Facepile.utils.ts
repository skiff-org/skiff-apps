import { AvatarComponent } from '../Avatar';
import { SIZE_STYLES as AVATAR_SIZE_STYLES } from '../Avatar/Avatar.constants';

import { FacepileSize, StackedAvatarPosition, STACKED_AVATAR_BORDER_WIDTH } from './Facepile.constants';

/**
 * Used to sort Avatar arrays by putting active Avatars before inactive Avatars
 * Used for inline Facepiles
 */
export function compareInlineAvatars(firstItem: AvatarComponent, secondItem: AvatarComponent) {
  return firstItem.props?.active === secondItem.props?.active ? 0 : firstItem.props?.active ? -1 : 1;
}

/**
 * Used to sort Avatar arrays by putting inactive Avatars before active Avatars
 * Used for stacked Facepiles
 */
export function compareStackedAvatars(firstItem: AvatarComponent, secondItem: AvatarComponent) {
  return firstItem.props?.active === secondItem.props?.active ? 0 : firstItem.props?.active ? 1 : -1;
}

/**
 * Returns a stacked Facepile's dimensions
 * @param {number} numOfItems - Number of visible items including the More label
 * @param {FacepileSize} size - The Avatar's size value
 * @returns {{ width: number, height: number }} - Width and height dimensions of the Facepile
 */
export const getStackedFacepileWrapperSize = (numOfItems: number, size: FacepileSize) => {
  const avatarSize = AVATAR_SIZE_STYLES[size].avatarSize;
  const avatarWrapperSize = numOfItems <= 1 ? avatarSize : avatarSize + STACKED_AVATAR_BORDER_WIDTH * 2;

  let width = avatarWrapperSize;
  let height = avatarWrapperSize;
  if (numOfItems === 2) {
    width = avatarWrapperSize * 1.5;
    height = avatarWrapperSize * 1.5;
  } else if (numOfItems === 3) {
    width = avatarWrapperSize + avatarSize * 0.75;
    height = avatarSize * 2 + STACKED_AVATAR_BORDER_WIDTH * 2;
  } else if (numOfItems === 4) {
    width = avatarWrapperSize * 2;
    height = avatarWrapperSize * 2;
  }

  return { width, height };
};

/**
 * Returns an Avatar's position in a stacked Facepile depending on their order in the pile
 * @param {number} index - The Avatar's order in the Facepile
 * @param {number} numOfItems - Number of visible items including the More label
 * @param {FacepileSize} size
 * @returns {StackedAvatarPosition} - Left and top positioning of the Avatar item
 */
export const getStackedAvatarPositions = (
  index: number,
  numOfItems: number,
  size: FacepileSize
): StackedAvatarPosition => {
  const avatarSize = AVATAR_SIZE_STYLES[size].avatarSize;
  const avatarWrapperSize = avatarSize + STACKED_AVATAR_BORDER_WIDTH * 2;
  switch (numOfItems) {
    case 2: {
      if (index === 1) return { left: avatarWrapperSize * 0.5, top: avatarWrapperSize * 0.5 };
    }
    case 3: {
      if (index === 1) return { left: avatarSize * 0.75, top: avatarSize * 0.5 };
      if (index === 2) return { left: 0, top: avatarSize };
    }
    case 4: {
      if (index === 1) return { left: avatarWrapperSize, top: 0 };
      if (index === 2) return { left: 0, top: avatarWrapperSize };
      if (index === 3) return { left: avatarWrapperSize, top: avatarWrapperSize }; // Position of the More label
    }
    case 1:
    default:
      // The Avatar at index === 0 is always positioned at the top-left
      return { left: 0, top: 0 };
  }
};
