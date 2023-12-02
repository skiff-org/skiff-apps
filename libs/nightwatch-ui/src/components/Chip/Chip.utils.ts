import { getTextAndBgColors } from '../../utils/colorUtils';
import { IconColor } from '../Icons';

export const getIconTextAndBgColors = (destructive: boolean, customColor?: IconColor): [IconColor, string] => {
  if (destructive) return ['destructive', 'var(--bg-overlay-destructive)'];

  let iconColor: IconColor = 'primary';
  if (!!customColor) iconColor = customColor;

  let bgColor = 'var(--bg-overlay-tertiary)';
  if (iconColor !== 'source') bgColor = getTextAndBgColors(iconColor, false, '')[1];

  return [iconColor, bgColor];
};
