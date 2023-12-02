import { Layout, Size, ThemeMode } from '../../types';
import { ButtonGroupItemComponent } from '../ButtonGroupItem';

export type ButtonGroupSize = Size.SMALL | Size.MEDIUM | Size.LARGE;

export interface ButtonGroupProps {
  /** Children button group elements */
  children: ButtonGroupItemComponent[];
  /** ButtonGroup theme */
  forceTheme?: ThemeMode;
  /** Buttons should take the full width of the container */
  fullWidth?: boolean;
  /** Only display the icon for secondary buttons */
  iconOnly?: boolean;
  /** The placement of the Buttons */
  layout?: Layout;
  /** The size of the Buttons */
  size?: ButtonGroupSize;
}
