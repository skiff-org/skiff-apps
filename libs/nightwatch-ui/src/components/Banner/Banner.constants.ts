import { AccentColor } from '../../utils/colorUtils';
import { Icon } from '../Icons';

interface BannerCTA {
  label: string;
  onClick: () => void;
}

export interface BannerProps {
  label: string;
  color?: AccentColor;
  ctas?: BannerCTA[];
  icon?: Icon;
  onClose?: () => void;
}

export const BANNER_HEIGHT = 40;
