import { DividerColor } from './Divider.types';

export const getDividerColor = (color: DividerColor | string) => {
  switch (color) {
    case 'primary':
      return 'var(--border-primary)';
    case 'secondary':
      return 'var(--border-secondary)';
    case 'tertiary':
      return 'var(--border-tertiary)';
    default:
      return color;
  }
};
