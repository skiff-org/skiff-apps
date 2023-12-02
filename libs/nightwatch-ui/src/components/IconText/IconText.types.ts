import React from 'react';

import { FilledVariant, Size, ThemeMode } from '../../types';
import { Color } from '../../utils/colorUtils';
import { Icon, IconProps } from '../Icons';
import { TypographyProps, TypographyWeight } from '../Typography';

export type IconComponent = React.ReactElement<IconProps>;
export type IconTextSize = Size.X_SMALL | Size.SMALL | Size.MEDIUM | Size.LARGE;
export type IconSize = Size.X_SMALL | Size.SMALL | Size.MEDIUM | Size.X_MEDIUM;
type IconTextWeight = TypographyWeight.REGULAR | TypographyWeight.MEDIUM;

type IconTextTypographyProps = Pick<TypographyProps, 'capitalize' | 'mono' | 'uppercase' | 'wrap'>;

export interface IconTextProps extends IconTextTypographyProps {
  /** For styled components */
  className?: string;
  /** IconText content color */
  color?: Color | 'source';
  /** Indicator for E2E tests */
  dataTest?: string;
  /** Controlled disabled state */
  disabled?: boolean;
  /** Disable hover state */
  disableHover?: boolean;
  /** Icon after text */
  endIcon?: Icon | IconComponent;
  /** IconText theme */
  forceTheme?: ThemeMode;
  id?: string;
  /** Text */
  label?: string | React.ReactNode;
  /** Disables padding */
  noPadding?: boolean;
  /** IconText size */
  size?: IconTextSize;
  /** Icon before text */
  startIcon?: Icon | IconComponent;
  /** For customization */
  style?: React.CSSProperties;
  /** Tooltip text */
  tooltip?: string | JSX.Element;
  /** Filled or unfilled */
  variant?: FilledVariant;
  /** Text weight */
  weight?: IconTextWeight;
  /** onClick handler */
  onClick?: (e?: React.MouseEvent) => Promise<void> | void;
  /** Full width */
  fullWidth?: boolean;
}
