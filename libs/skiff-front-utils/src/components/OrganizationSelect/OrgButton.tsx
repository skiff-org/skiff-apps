import { Size, ThemeMode, Typography, TypographySize } from '@skiff-org/skiff-ui';
import { useUserProfile } from 'skiff-front-graphql';
import { ProductApp } from 'skiff-graphql';

import { useRequiredCurrentUserData } from '../../apollo';
import { useCurrentOrganization } from '../../hooks';
import { useTheme } from '../../theme/AppThemeProvider';
import { getDisplayPictureDataFromUser, isReactNativeDesktopApp } from '../../utils';
import { UserAvatar } from '../UserAvatar';

import {
  ActiveWorkspaceLabel,
  AppIcon,
  ORG_SELECTOR_ID,
  SidebarButton,
  SidebarButtonContainer,
  SidebarWrapper,
  SKIFF_APPS,
  WorkspaceIcon,
  WorkspaceIconContainer,
  WorkspaceOptionItem
} from './OrganizationSelect.constants';

interface OrgButtonProps {
  activeApp: ProductApp;
  activeWorkspace?: WorkspaceOptionItem;
  sidepanelOpen: boolean;
  toggleDropdown: () => void;
  loading: boolean | undefined;
}

export const OrgButton = (props: OrgButtonProps) => {
  const { activeApp, activeWorkspace, toggleDropdown, sidepanelOpen, loading } = props;
  const { data: orgData, loading: orgDataLoading } = useCurrentOrganization();
  const { theme } = useTheme();
  const { userID } = useRequiredCurrentUserData();
  const { data: userProfileData } = useUserProfile(userID);

  const organization = orgData?.organization;
  const appConfig = SKIFF_APPS[activeApp];
  const orgDisplayPicture = organization?.displayPictureData;
  const userDisplayPicture = getDisplayPictureDataFromUser(userProfileData);
  const displayPicture = orgDisplayPicture || userDisplayPicture;

  return (
    <SidebarWrapper sidepanelOpen={sidepanelOpen}>
      <SidebarButtonContainer
        $macAppMargin={isReactNativeDesktopApp()}
        data-test='organization-selector'
        id={ORG_SELECTOR_ID}
        onClick={toggleDropdown}
      >
        <SidebarButton data-test={sidepanelOpen ? '' : 'org-select-avatar'}>
          {appConfig && (
            <div>
              <AppIcon $size={36} height='36px' src={appConfig.icon} width='36px' />
              {displayPicture?.profileCustomURI && !orgDataLoading && (
                <WorkspaceIconContainer>
                  <WorkspaceIcon $isDarkMode={theme === ThemeMode.DARK}>
                    <UserAvatar displayPictureData={displayPicture} label='' size={Size.X_SMALL} />
                  </WorkspaceIcon>
                </WorkspaceIconContainer>
              )}
            </div>
          )}
          {sidepanelOpen && (
            <>
              <ActiveWorkspaceLabel>
                <Typography mono uppercase>
                  {loading ? '' : `Skiff ${appConfig?.label ?? ''}`}
                </Typography>
                <Typography mono uppercase color='secondary' size={TypographySize.SMALL}>
                  {loading ? '' : activeWorkspace?.label}
                </Typography>
              </ActiveWorkspaceLabel>
            </>
          )}
        </SidebarButton>
      </SidebarButtonContainer>
    </SidebarWrapper>
  );
};
