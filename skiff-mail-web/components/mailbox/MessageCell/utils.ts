import { Size } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { formatName } from 'skiff-front-utils';

import { getFirstNameOrEmail } from '../../../utils/userUtils';

import { MULT_SELECT_TRANSITION_DURATION, MULT_SELECT_TRANSLATE } from './constants';

const waitFor = (duration: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};

const getBoxWidth = (isSwiping: boolean | number, isSwipeComplete: boolean, touchLength: number) => {
  if (isSwipeComplete) return '100%';
  return isSwiping ? `${touchLength}px` : '0';
};

const getCheckBoxWrapperTransform = (
  isLeftSwiping: boolean | number,
  isRightSwiping: boolean | number,
  isLeftSwipeComplete: boolean,
  touchLength: number
) => {
  if (isLeftSwipeComplete) return 'translateX(-100%)';
  return isLeftSwiping || isRightSwiping ? `translateX(${(isLeftSwiping ? -1 : 1) * touchLength}px)` : undefined;
};

const getMultiSelectCellTransition = (transition: boolean) => {
  if (transition) {
    // Open
    return `
      transition: transform ${MULT_SELECT_TRANSITION_DURATION / 2 + 'ms'};
      transform: translateX(${MULT_SELECT_TRANSLATE}px);
    `;
  } else if (isMobile) {
    // Close
    return `
      transition: transform ${MULT_SELECT_TRANSITION_DURATION + 'ms'};
      transform: translateX(0px);
    `;
  }
};

const getStackedFacepileSize = (numAvatars: number) => {
  switch (numAvatars) {
    case 1:
      return Size.X_MEDIUM;
    case 2:
      return Size.MEDIUM;
    case 3:
      return Size.SMALL;
    case 4:
    default:
      return Size.X_SMALL;
  }
};

export const getSenders = (displayNames: string[]) => {
  if (!displayNames.length) return '';
  if (displayNames.length === 1) {
    return formatName(displayNames[0]);
  }
  const firstDisplayName = getFirstNameOrEmail(displayNames[0]);
  if (displayNames.length === 2) {
    const secondDisplayName = getFirstNameOrEmail(displayNames[1]);
    return `${formatName(firstDisplayName)}, ${formatName(secondDisplayName)}`;
  }
  // More than three senders in the thread
  const lastDisplayName = getFirstNameOrEmail(displayNames[displayNames.length - 1]);
  return `${formatName(firstDisplayName)} ... ${formatName(lastDisplayName)}`;
};

export { waitFor, getBoxWidth, getCheckBoxWrapperTransform, getMultiSelectCellTransition, getStackedFacepileSize };
