import { ThemeMode } from '../../types';

export enum DividerType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

export type DividerColor = 'primary' | 'secondary' | 'tertiary';

export interface DividerProps {
  /** For styled components */
  className?: string;
  /** Divider color */
  color?: DividerColor | string;
  /** Forced theme */
  forceTheme?: ThemeMode;
  /** Custom height */
  height?: number | string;
  /** For customization */
  style?: React.CSSProperties;
  /** Whether it's a horizontal or a vertical divider */
  type?: DividerType;
  /** Custom width */
  width?: number | string;
}
