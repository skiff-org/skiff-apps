import { Icon } from '@skiff-org/skiff-ui';

import ToolbarButton from './ToolbarButton';

interface MobileMenuToolbarProps {
  onComposeClick: () => void;
  unreadCount: number;
  onSettingsClick: () => void;

}
/**
 * Toolbar for the main menu on mobile
 */
export const MobileMenuToolbar = ({ onComposeClick, unreadCount, onSettingsClick }: MobileMenuToolbarProps) => (
  <>
    <ToolbarButton icon={Icon.Settings} onClick={onSettingsClick} />
    <ToolbarButton label={`${unreadCount} unread`} />
    <ToolbarButton icon={Icon.Compose} link onClick={onComposeClick} />
  </>
);
