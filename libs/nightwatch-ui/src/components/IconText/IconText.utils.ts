import { FilledVariant } from '../../types';
import { Color } from '../../utils/colorUtils';
import { IconColor } from '../Icons';

const getInteractiveIconTextColor = (isHovering: boolean, variant: FilledVariant) => {
  if (isHovering) return 'primary';
  return variant === FilledVariant.FILLED ? 'secondary' : 'disabled';
};

export const getTextColor = (
  isClickable: boolean,
  isDisabled: boolean,
  isHovering: boolean,
  variant: FilledVariant,
  customColor?: Color
): Color => {
  if (isDisabled) return 'disabled';
  if (customColor) return customColor;

  if (isClickable) {
    // this is an interactive IconText
    return getInteractiveIconTextColor(isHovering, variant);
  }

  return 'primary';
};

export const getIconColor = (
  isClickable: boolean,
  isDisabled: boolean,
  isHovering: boolean,
  variant: FilledVariant,
  customColor?: IconColor
): IconColor => {
  if (isDisabled) return 'disabled';
  if (customColor) return customColor;

  if (isClickable) {
    // this is an interactive IconText
    return getInteractiveIconTextColor(isHovering, variant);
  }

  return 'primary';
};
