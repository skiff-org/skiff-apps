import { FilledVariant, Size, ThemeMode } from '../../types';
import { Color } from '../../utils/colorUtils';
import { AvatarComponent } from '../Avatar';
import { Icon } from '../Icons';
import { IconComponent } from '../IconText';
import { TypographyWeight } from '../Typography';

export type ChipSize = Size.X_SMALL | Size.SMALL | Size.MEDIUM | Size.LARGE;
export type ChipTypographyWeight = TypographyWeight.REGULAR | TypographyWeight.MEDIUM;

export interface ChipProps {
  /** Start avatar */
  avatar?: AvatarComponent;
  /** Avatar tooltip text */
  avatarTooltip?: string | JSX.Element;
  /** For styled components */
  className?: string;
  /** Chip color */
  color?: Color;
  /** E2E test indicator */
  dataTest?: string;
  /** Chip theme mode */
  forceTheme?: ThemeMode;
  /** Start icon */
  icon?: Icon | IconComponent;
  /** Chip text */
  label?: string | React.ReactNode;
  /** Removes chip border */
  noBorder?: boolean;
  /** Chip size */
  size?: ChipSize;
  /** For chip customization */
  style?: React.CSSProperties;
  /** Chip tooltip text */
  tooltip?: string | JSX.Element;
  /** Text weight */
  typographyWeight?: ChipTypographyWeight;
  /** Filled or unfilled */
  variant?: FilledVariant;
  /** Triggered when any part of the chip is clicked */
  onClick?: (e: React.MouseEvent) => Promise<void> | void;
  /** Triggered when the x icon on an input tag is clicked */
  onDelete?: (e: React.MouseEvent) => Promise<void> | void;
}
