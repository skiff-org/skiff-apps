import { ThemeMode } from '../../types';

export type SkeletonColor = 'primary' | 'secondary' | 'tertiary';

export interface SkeletonProps {
  /** Custom height */
  height: string | number;
  /** Custom width */
  width: string | number;
  /** Border radius */
  borderRadius?: string | number;
  /** Background color */
  color?: SkeletonColor;
  /** Forced theme */
  forceTheme?: ThemeMode;
}
