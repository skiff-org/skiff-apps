import { Size, ThemeMode } from '../../types';
import { Icon } from '../Icons';
import { TypographySize } from '../Typography';

export const SLIDER_ANIMATION_DURATION = 0.25;

export type TabsSize = Size.SMALL | Size.MEDIUM | Size.LARGE;
export interface TabsProps {
  tabs: { active: boolean; label?: string; onClick?: () => void, icon?: Icon }[];
  forceTheme?: ThemeMode;
  fullWidth?: boolean;
  size?: TabsSize;
}

/** Maps tab size to typography size */
export const TYPOGRAPHY_SIZE: Record<TabsSize, TypographySize> = {
  small: TypographySize.SMALL,
  medium: TypographySize.MEDIUM,
  large: TypographySize.LARGE
};
