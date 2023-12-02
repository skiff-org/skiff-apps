import { Size, ThemeMode } from '../../types';
import { AccentColor, Color } from '../../utils/colorUtils';
import { RequireOnlyOne } from '../../utils/typeUtils';
import { Icon } from '../Icons';
import { IconComponent } from '../IconText';
import { TypographySize } from '../Typography/Typography.constants';

interface BaseAvatarProps {
  /** Whether or not user is online */
  active?: boolean;
  background?: string;
  /** Custom badge color */
  badgeColor?: AccentColor | Color;
  /** Custom badge icon */
  badgeIcon?: Icon;
  /** Override default badge size */
  badgeSize?: number;
  /** Custom border radius */
  customBorderRadius?: number;
  /** Override color */
  color?: AccentColor;
  dataTest?: string;
  disabled?: boolean;
  forceTheme?: ThemeMode;
  /** Avatar icon */
  icon?: Icon | IconComponent;
  iconDataTest?: string;
  imageDataTest?: string;
  imageSrc?: string;
  /** Avatar label */
  label?: string;
  /** Override border radius to be circular */
  rounded?: boolean;
  /** Display user status badge */
  showBadge?: boolean;
  /** Tooltip on badge hover */
  badgeTooltip?: string | JSX.Element;
  /** The size for the Avatar */
  size?: Size;
  /** Avatar in-line style */
  style?: React.CSSProperties;
  /** Card onClick action */
  onClick?: (e: React.MouseEvent) => void;
}

export type AvatarProps = RequireOnlyOne<BaseAvatarProps, 'label' | 'icon'>;
export type AvatarComponent = React.ReactElement<AvatarProps>;

export type SizeStyles = {
  // Avatar width and height value
  avatarSize: number;
  // Avatar inner border radius
  borderRadius: number;
  // Facepile border width
  borderWidth: number;
  // Avatar icon size
  iconSize: Size;
  // Avatar label typography size
  typographySize: TypographySize;
};
