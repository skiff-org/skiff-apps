import { HTMLMotionProps } from 'framer-motion';

import { FilledVariant, ThemeMode, Type } from '../../../types';
import { Icon } from '../../Icons';
import { IconComponent } from '../../IconText';
import { ButtonSize } from '../Button.constants';

export type IconButtonType = Type;

export interface IconButtonProps {
  icon: Icon | IconComponent;
  /** On button click */
  onClick: (e: React.MouseEvent) => void | Promise<void>;
  animationProps?: HTMLMotionProps<'div'>;
  /** For styled components */
  className?: string;
  /** Indicator for e2e tests */
  dataTest?: string;
  /** Disable button */
  disabled?: boolean;
  /** IconButton theme */
  forceTheme?: ThemeMode;
  id?: string;
  /** Icon button size */
  size?: ButtonSize;
  /** For customization */
  style?: React.CSSProperties;
  /** IconButton tooltip text */
  tooltip?: string | JSX.Element;
  type?: IconButtonType;
  /** Filled or unfilled */
  variant?: FilledVariant;
  /** If true, the button will be active */
  active?: boolean;
}
