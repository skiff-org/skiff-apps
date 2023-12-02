import * as React from 'react';

import { Type } from '../../types';
import { Icon } from '../Icons';
import { IconComponent } from '../IconText';

export interface ButtonGroupItemProps {
  /** Gets called when the user clicks on the button */
  onClick: (e: React.MouseEvent) => void | Promise<void>;
  /** Button text */
  label: string;
  /** For styled components */
  className?: string;
  /** E2E test indicator */
  dataTest?: string;
  /** Disable button */
  disabled?: boolean;
  /** Whether or not the button is hidden */
  hidden?: boolean;
  /** Start icon */
  icon?: Icon | IconComponent;
  id?: string;
  /** Loading state */
  loading?: boolean;
  ref?: React.MutableRefObject<HTMLDivElement | null>;
  /** For customization */
  style?: React.CSSProperties;
  /** Button type */
  type?: Type;
}

export type ButtonGroupItemComponent = React.ReactElement<ButtonGroupItemProps>;
