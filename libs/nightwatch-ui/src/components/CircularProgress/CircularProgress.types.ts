import { Size, ThemeMode } from '../../types';
import { Color } from '../../utils/colorUtils';

export type CircularProgressSize = Size.SMALL | Size.MEDIUM | Size.X_MEDIUM | Size.LARGE | Size.X_LARGE;

export type CircularProgressSizeStyles = {
  rootSize: number;
  trackThickness: number;
  progressThickness: number;
  borderWidth: number;
};

export interface CircularProgressProps {
  /** For styled components */
  className?: string;
  dataTest?: string;
  forceTheme?: ThemeMode;
  progress?: number;
  progressColor?: Color | string;
  size?: CircularProgressSize;
  /** Spinners visualize an unspecified wait time */
  spinner?: boolean;
  /** For customization */
  style?: React.CSSProperties;
  /** Tooltip label */
  tooltip?: string;
  trackColor?: Color | string;
  /** Thickness of the track and progress bars */
  thickness?: number;
}
