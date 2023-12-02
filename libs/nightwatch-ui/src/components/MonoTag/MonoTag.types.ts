import { ThemeMode } from '../../types';
import { Color } from '../../utils/colorUtils';
import { Icon } from '../Icons';

export interface MonoTagProps {
  /** Tag text */
  label: string;
  /** Overrides bg color */
  bgColor?: string;
  /** Single tone color for text and bg */
  color?: Color;
  /** Force box shadow theme mode */
  forceBoxShadowTheme?: ThemeMode;
  /** Force tag theme mode */
  forceTheme?: ThemeMode;
  /** Tag start icon */
  icon?: Icon;
  /** Overrides text color */
  textColor?: Color;
  /** For styled components */
  className?: string;
}
