import { Size } from '../../types';
import { Icon } from '../Icons';
import { IconComponent } from '../IconText';

export type DropdownItemColor = 'primary' | 'destructive';
export type DropdownItemSize = Size.MEDIUM | Size.LARGE;

export interface DropdownItemProps {
  /** Text */
  label: React.ReactNode;
  /** Controls the DropdownItem's active state */
  active?: boolean;
  /** Content color */
  color?: DropdownItemColor;
  customLabel?: JSX.Element;
  /** E2E test selector */
  dataTest?: string;
  /** Controls the DropdownItem's disabled state */
  disabled?: boolean;
  endElement?: JSX.Element;
  showEndElement?: boolean;
  hideDivider?: boolean;
  /**
   * Controls the DropdownItem's hover state
   * Used for keyboard navigation
   * Undefined indicates that keyboard navigation is not active
   */
  highlight?: boolean;
  noPadding?: boolean;
  /** Start icon */
  icon?: Icon | IconComponent;
  /** Whether the dropdown item should be scrolled into view */
  scrollIntoView?: boolean;
  size?: DropdownItemSize;
  startElement?: JSX.Element;
  value?: string;
  onClick?: (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void | Promise<void>;
  onHover?: () => void;
}

export type DropdownItemComponent = React.ReactElement<DropdownItemProps>;
