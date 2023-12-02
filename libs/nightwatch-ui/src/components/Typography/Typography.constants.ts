import { Alignment, ThemeMode } from '../../types';
import { Color } from '../../utils/colorUtils';

export enum TypographyOverflow {
  VISIBLE = 'visible',
  HIDDEN = 'hidden'
}

export enum TypographySize {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  LARGE = 'large',
  MEDIUM = 'medium',
  SMALL = 'small',
  CAPTION = 'caption'
}

export enum TypographyWeight {
  BOLD = 560,
  MEDIUM = 470,
  REGULAR = 380
}

export enum TextDecoration {
  UNDERLINE = 'underline',
  LINE_THROUGH = 'line-through'
}

export interface TypographyProps {
  align?: Alignment;
  /** Capitalize text */
  capitalize?: boolean;
  children?: React.ReactNode;
  className?: string;
  /** Text color */
  color?: Color;
  /** Indicator for e2e tests */
  dataTest?: string;
  forceTheme?: ThemeMode;
  hideOverflow?: boolean;
  id?: string;
  /** Make Typography component an inline element */
  inline?: boolean;
  /** Overrides CSS max-width property */
  maxWidth?: number | string;
  /** Overrides CSS min-width property */
  minWidth?: number | string;
  mono?: boolean;
  /** CSS overflow property */
  overflow?: TypographyOverflow;
  selectable?: boolean;
  size?: TypographySize;
  /** Underline or strike-through text */
  textDecoration?: TextDecoration;
  /** CSS transition property */
  transition?: string;
  /** Uppercase text */
  uppercase?: boolean;
  /** The type of text */
  weight?: TypographyWeight;
  /** Overrides CSS width property */
  width?: number | string;
  /** Whether text lines may wrap at soft-wrap opportunities */
  wrap?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}
