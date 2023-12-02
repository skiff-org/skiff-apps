import { Size, ThemeMode } from '../../types';

export type ToggleSize = Size.SMALL | Size.MEDIUM;

export interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  dataTest?: string;
  disabled?: boolean;
  forceTheme?: ThemeMode;
  size?: ToggleSize;
}
