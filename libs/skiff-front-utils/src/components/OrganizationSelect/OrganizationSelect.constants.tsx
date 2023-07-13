import { motion } from 'framer-motion';
import { colors, Icon, themeNames } from '@skiff-org/skiff-ui';
import { DisplayPictureData, ProductApp } from 'skiff-graphql';
import styled from 'styled-components';

import { getCurrentUserData } from '../../apollo/localState';
import { calendarIcon, driveIcon, mailIcon, pagesIcon } from '../../assets';
import { EditorAppRoutes, PRODUCT_APP_LABELS } from '../../constants';
import {
  CALENDAR_REDIRECT_KEY,
  getCalendarBasePath,
  MAIL_REDIRECT_KEY,
  storeRedirectInLocalStorage,
  storeLatestUserID
} from '../../utils';
import { getEditorBasePath } from '../../utils/linkToEditorUtils';
import { getEmailBasePath } from '../../utils/linkToEmailUtils';

export const INBOX_WORKSPACE_ID = 'inbox-workspace';

export interface WorkspaceOptionItem {
  // name of the section
  label: string;
  onClick: () => void;
  active: boolean;
  sublabel?: string;
  orgAvatar?: DisplayPictureData;
  userAvatar?: DisplayPictureData;
  warning?: boolean;
  id?: string;
}

export interface SectionAction {
  label: string;
  onClick: () => void;
  icon?: Icon;
  dataTest?: string;
  key?: string;
}

export interface WorkspaceSection {
  workspaces: WorkspaceOptionItem[];
  // plus icon for creating new workspace
  onClick?: () => void;
  // plus icon tooltip
  tooltip?: string;
  // footer onClicks
  actions?: Array<SectionAction>;
}

export interface OrganizationSelectProps {
  anchor?: React.CSSProperties;
  activeApp: ProductApp;
  numBannersOpen?: number;
  section?: WorkspaceSection;
  username: string;
  // header description label
  label: string;
  // footer onClicks
  actions: Array<SectionAction>;
  storeWorkspaceEvent?: () => void;
  loading?: boolean;
  sidepanelOpen?: boolean;
  numUnread?: number;
  // force open for onboard dummy app demo and hide org button
  forceOpen?: boolean;
  // override onClick for onboard dummy app demo
  customOnClicks?: Record<ProductApp, () => void>;
  blockPointerEvents?: boolean;
}

export enum OrgType {
  Personal = 'Personal',
  Workspace = 'Workspace'
}

const openMail = () => {
  // Update latest user ID before switching apps
  const currentUser = getCurrentUserData();
  if (currentUser?.userID) storeLatestUserID(currentUser?.userID);

  storeRedirectInLocalStorage(MAIL_REDIRECT_KEY);
  const emailURL = getEmailBasePath();
  window.open(emailURL, '_blank');
};

const openPages = () => {
  // Update latest user ID before switching apps
  const currentUser = getCurrentUserData();
  if (currentUser?.userID) storeLatestUserID(currentUser?.userID);

  storeRedirectInLocalStorage(undefined);
  const editorBasePath = getEditorBasePath();
  window.open(editorBasePath + EditorAppRoutes.DASHBOARD, '_blank');
};

const openDrive = () => {
  // Update latest user ID before switching apps
  const currentUser = getCurrentUserData();
  if (currentUser?.userID) storeLatestUserID(currentUser?.userID);

  storeRedirectInLocalStorage(undefined);
  // Use Editor base path here rather than drive base path
  // since EditorAppRoutes.DRIVE_FOLDER and EditorAppRoutes.DRIVE_DASHBOARD contain the /drive prefix already
  const editorBasePath = getEditorBasePath();
  window.open(editorBasePath + EditorAppRoutes.DRIVE_DASHBOARD, '_blank');
};

const openCalendar = () => {
  // Update latest user ID before switching apps
  const currentUser = getCurrentUserData();
  if (currentUser?.userID) storeLatestUserID(currentUser?.userID);

  storeRedirectInLocalStorage(CALENDAR_REDIRECT_KEY);
  const calendarURL = getCalendarBasePath();
  window.open(calendarURL, '_blank');
};

export interface AppIconInfo {
  productApp: ProductApp;
  icon: string;
  label: string;
  onClick: () => void;
}

export const AppShadow = styled.div`
  position: relative;
  float: left;
  border-radius: 14px;
  height: 55px;
`;

export const AppIcon = styled.img<{ $size?: number; $active?: boolean; $inSwitcher?: boolean }>`
  width: ${(props) => props.$size || 54}px;
  height: ${(props) => props.$size || 54}px;
  border: 1px solid
    ${({ $inSwitcher, $active }) => $inSwitcher && `${$active ? themeNames.dark['--border-active'] : 'transparent'}`}
    ${({ $inSwitcher }) => !$inSwitcher && 'transparent'};
  display: block;
  border-radius: ${(props) => (props.$inSwitcher ? '14px' : '10px')};
  position: relative;
  z-index: -1;
`;

export const SKIFF_APPS: Record<ProductApp, AppIconInfo> = {
  [ProductApp.Mail]: {
    productApp: ProductApp.Mail,
    label: PRODUCT_APP_LABELS[ProductApp.Mail],
    icon: mailIcon,
    onClick: openMail
  },
  [ProductApp.Drive]: {
    productApp: ProductApp.Drive,
    label: PRODUCT_APP_LABELS[ProductApp.Drive],
    icon: driveIcon,
    onClick: openDrive
  },
  [ProductApp.Pages]: {
    productApp: ProductApp.Pages,
    label: PRODUCT_APP_LABELS[ProductApp.Pages],
    icon: pagesIcon,
    onClick: openPages
  },
  [ProductApp.Calendar]: {
    productApp: ProductApp.Calendar,
    label: PRODUCT_APP_LABELS[ProductApp.Calendar],
    icon: calendarIcon,
    onClick: openCalendar
  }
};

export const DROPDOWN_OFFSET = 64;

export const AppButtons = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px;
  gap: 16px;
`;

export const NameSection = styled.div<{ $disabled?: boolean }>`
  padding: 0px 8px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
`;

export const AppContainer = styled.div<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;
  cursor: pointer;
  opacity: ${(props) => (props.$active ? 1.0 : 0.8)};
  z-index: 1;
  :hover {
    opacity: 1;
  }
`;

export const Badge = styled.div`
  padding: 3px 6px 4px;
  border-radius: 20px;
  box-sizing: border-box;
  width: fit-content;
  height: 19px;
  position: absolute;
  align-items: center;
  justify-content: center;
  display: flex;
  color: ${themeNames.dark['--text-primary']};
  background: #d72828;
  border: 2px solid #1f1f1f;
`;

export const BadgeContainer = styled.div<{ $offset: number }>`
  position: relative;
  left: ${(props) => props.$offset}px;
  top: 2px;
  height: 0px;
  margin-top: -8px;
  z-index: 999;
`;

export const ActionLabel = styled.div<{ $disabled?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover > * {
    color: ${(props) => (props.$disabled ? '' : 'var(--text-always-white) !important')};
    fill: ${(props) => (props.$disabled ? '' : 'var(--icon-always-white) !important')};
  }
`;

export const ReferenceContainer = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 6px;
`;

export const SidebarButton = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  z-index: 1;
`;

export const BlockPointerWindow = styled.div`
  position: fixed;
  inset: 0px;
  z-index: 400;
`;

export const ActiveWorkspaceLabel = styled.div`
  min-width: 0;
`;

export const SidebarButtonContainer = styled.div<{ $macAppMargin: boolean }>`
  flex: 1;
  display: flex;
  margin-top: ${(props) => (props.$macAppMargin ? '16px' : '')};
  align-items: center;
  cursor: pointer;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 6px;
  gap: 4px;
  user-select: none;
  height: 100%;

  &:hover {
    background: var(--bg-cell-hover);
  }
`;

export const Sections = styled.div`
  max-height: calc(100vh - 300px);
  overflow: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  color: transparent;
  padding: 8px;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
    box-shadow: inset 0 0 0 10px;
  }

  &:hover {
    color: var(--bg-emphasis);
  }

  &::-webkit-scrollbar-thumb:hover {
    color: var(--bg-emphasis);
  }
`;

export const DropdownSublabel = styled.div`
  padding: 8px;
`;

export const OrgSelectDropdown = styled(motion.div)`
  position: absolute;
  z-index: 999;
  display: flex;
  flex-direction: column;
  padding: 0px;
  background: ${themeNames.dark['--bg-l3-solid']};
  border: 1px solid ${themeNames.dark['--border-secondary']};
  box-sizing: border-box;
  box-shadow: var(--shadow-l3);
  border-radius: 10px;
  width: 312px;
  margin-left: 6px;
  overflow: hidden;
`;

export const AppSectionContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  gap: 12px;
  background: ${themeNames.dark['--bg-l2-solid']};
  border: 1px solid ${themeNames.light['--border-primary']};
  border-radius: 0px 0px 24px 24px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const ActionIconWrapper = styled.div<{ $active?: boolean }>`
  opacity: ${(props) => (props?.$active ? 1.0 : 0.8)};

  display: flex;
  border-radius: 8px;
  width: 24px;
  height: 24px;
  flex-direction: column;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  border: 1px solid ${themeNames.dark['--border-secondary']};
`;

export const WorkspaceItemContainer = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: ${(props) => (props?.$disabled ? 'default' : 'pointer')};
  padding: 8px;
  gap: 8px;
  height: 40px;
  box-sizing: border-box;
  border-radius: 8px;

  // To highlight a section for the onboarding joyride
  &.highlight {
    animation: Pulsate 2s linear infinite;

    @keyframes Pulsate {
      from {
        background: rgba(${colors['--white']}, 0.2);
      }
      50% {
        background: rgba(${colors['--white']}, 0.08);
      }
      to {
        background: rgba(${colors['--white']}, 0.2);
      }
    }
  }
`;

export const WorkspaceAvatar = styled.div<{ $active?: boolean }>`
  opacity: ${(props) => (props?.$active ? 1.0 : 0.8)};
`;

export const WorkspaceLabels = styled.div`
  display: flex;
  flex-direction: column;
  width: 70%;
`;

export const WorkspaceAction = styled.div`
  padding: 8px 16px;
  border-radius: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const ActiveCheck = styled.div`
  margin-left: auto;
`;

export const Actions = styled.div<{ $disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px 0px 8px;
  box-sizing: border-box;
  cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
`;

export const ActionItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 4px 8px;
  height: fit-content;
  width: 100%;
  box-sizing: border-box;
  &:hover > * {
    color: var(--text-always-white) !important;
  }
`;

export const WorkspaceIconContainer = styled.div`
  position: relative;
`;

export const WorkspaceIcon = styled.div<{ $isDarkMode?: boolean }>`
  position: absolute;
  width: 16px;
  height: 16px;
  top: -18px;
  right: -5px;
  border: 1px solid ${({ $isDarkMode }) => ($isDarkMode ? '#1a1a1a' : '#f5f5f5')};
  background: ${({ $isDarkMode }) => ($isDarkMode ? '#1a1a1a' : '#f5f5f5')};
  border-radius: 5px;
`;

export const SidebarWrapper = styled.div<{ sidepanelOpen?: boolean }>`
  align-items: center;
  ${(props) => {
    if (props.sidepanelOpen) {
      return `
        height: 100%;
      `;
    }
    return `
      align-self: center;
      flex: 1;
      display: flex;
      align-items: center;
    `;
  }}
`;

export const ORG_SELECTOR_ID = 'organization-selector';
