import { RefObject } from 'react';

import { KeyboardNavControls } from '../../hooks';
import { MouseClickEvents } from '../../types';
import { DropdownItemComponent } from '../DropdownItem';
import { InputComponent } from '../InputField';

export type SurfaceRect = Pick<DOMRect, 'width' | 'height' | 'x' | 'y'>;
export type DropdownAnchor = { top?: number; bottom?: number; left?: number; right?: number };

export interface DropdownProps {
  children: React.ReactNode | DropdownItemComponent[];
  buttonRef?: React.MutableRefObject<HTMLDivElement | null>;
  className?: string;
  clickOutsideWebListener?: MouseClickEvents;
  /** Custom dropdown position */
  customAnchor?: { x: number; y: number };
  /** Custom position of background blocker */
  customBackgroundBlockerPos?: { top?: number; left?: number };
  /** E2E test indicator */
  dataTest?: string;
  /** Whether the dropdown should take the full width of the dropdown anchor */
  fullWidth?: boolean;
  /** Created a gap of the specified of px between the anchor and the dropdown */
  gapFromAnchor?: number;
  id?: string;
  /** Input field rendered at the top of the dropdown */
  inputField?: InputComponent;
  /**
   * Whether the dropdown is a sub-menu
   * Important for controlling the direction in which the sub-menu will open
   */
  isSubmenu?: boolean;
  /** Required for keyboard navigation */
  keyboardNavControls?: KeyboardNavControls;
  /**
   * Max dropdown height
   * Enables overflow
   */
  maxHeight?: number | string;
  /** Custom maximum width */
  maxWidth?: number | string;
  /** Custom minimum width */
  minWidth?: number | string;
  noPadding?: boolean;
  portal?: boolean;
  showDropdown?: boolean;
  /** Custom width */
  width?: number | string;
  /** Custom z-index */
  zIndex?: number;
  /** Updates the dropdown opened / closed state */
  setShowDropdown: (open: boolean) => void;
}

export interface MouseSafeAreaProps {
  /** Whether the submenu is opening to the right or to the left of the parent dropdown */
  openRight: boolean;
  /** Reference to the parent submenu */
  parentRef: RefObject<HTMLDivElement>;
}
