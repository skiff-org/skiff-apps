import { FilledVariant, Size, ThemeMode } from '../../types';
import { Color } from '../../utils/colorUtils';
import { DropdownProps } from '../Dropdown';
import { DropdownItemComponent } from '../DropdownItem';

type SelectSearchProps = {
  enableSearch: boolean;
  customSearchValidator?: (value: string, searchValue: string) => boolean;
};

export type SelectSize = Size.X_SMALL | Size.SMALL | Size.MEDIUM | Size.LARGE;
export type SelectDropdownProps = Pick<DropdownProps, 'fullWidth' | 'zIndex'>;
export interface SelectProps extends SelectDropdownProps {
  children: DropdownItemComponent[];
  onChange: (value: string) => void;
  /** E2E test selector */
  dataTest?: string;
  /** Controls the disabled state */
  disabled?: boolean;
  /** Overrides curr theme */
  forceTheme?: ThemeMode;
  /** Ghost select text and icon color */
  ghostColor?: Color;
  /** Max dropdown height */
  maxHeight?: number | string;
  /** Field placeholder text */
  placeholder?: string;
  /** Search props */
  searchProps?: SelectSearchProps;
  /** Select size */
  size?: SelectSize;
  /** Current selected value */
  value?: string;
  /** Custom width */
  width?: number | string;
  /** Filled or unfilled */
  variant?: FilledVariant;
}
