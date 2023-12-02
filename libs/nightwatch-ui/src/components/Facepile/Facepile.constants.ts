import { Layout, Size, ThemeMode } from '../../types';
import { AvatarComponent } from '../Avatar';

export type FacepileSize = Size.X_SMALL | Size.SMALL | Size.MEDIUM | Size.X_MEDIUM | Size.LARGE;
export type StackedAvatarPosition = {
  left: number;
  top: number;
};

export interface FacepileProps {
  children: Array<AvatarComponent>;
  /** Override background color */
  background?: string;
  forceTheme?: ThemeMode;
  layout?: Layout;
  /** Max number of visible Avatars in an inline layout */
  maxDisplayed?: number;
  /** Facepile Avatar size */
  size?: FacepileSize;
  /** Called on clicking the More label */
  onMoreClick?: () => void;
}

/** Maximum number of visible avatars for a stacked layout */
export const MAX_STACKED_AVATARS = 3;

/** Avatar border width in a stacked layout */
export const STACKED_AVATAR_BORDER_WIDTH = 2;
