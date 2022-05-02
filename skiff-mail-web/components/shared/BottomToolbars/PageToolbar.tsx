import { Icon } from '@skiff-org/skiff-ui';
import ToolbarButton from './ToolbarButton';

interface PageToolbarProps {
  onFilterClick: () => void;
  onComposeClick: () => void;
  onSettingsClick: () => void;
}

/**
 * Toolbar component for pages Inbox, Drafts, Sent, etc..
 */
export const PageToolbar = ({ onFilterClick, onComposeClick, onSettingsClick }: PageToolbarProps) => (
  <>
    <ToolbarButton icon={Icon.Settings} onClick={onSettingsClick} />
    <ToolbarButton icon={Icon.Filter} onClick={onFilterClick} />
    <ToolbarButton icon={Icon.Compose} link onClick={onComposeClick} />
  </>
);
