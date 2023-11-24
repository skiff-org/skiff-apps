import {
  AccentColor,
  Avatar,
  AvatarProps,
  Icon,
  Icons,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight,
  getAvatarIconOrLabel
} from 'nightwatch-ui';
import React from 'react';
import { DisplayPictureData } from 'skiff-graphql';
import { isWalletOrNameServiceAddress } from 'skiff-utils';
import styled from 'styled-components';

import { getWalletIcon } from '../../utils/walletUtils/walletUtils';

interface UserAvatarProps extends Omit<AvatarProps, 'icon'> {
  label: string;
  displayPictureData?: DisplayPictureData | null;
  // whether to show unverified badge
  unverified?: boolean;
  badgeBackground?: string;
}

const TooltipContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const UserAvatarDataTest = {
  userAvatarIcon: 'user-avatar-icon',
  userAvatarImage: 'user-avatar-image'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  label,
  displayPictureData,
  badgeBackground,
  color,
  forceTheme,
  unverified,
  ...avatarProps
}) => {
  const getCustomIcon = () => {
    if (displayPictureData?.profileIcon) return displayPictureData.profileIcon as Icon;
    if (isWalletOrNameServiceAddress(label)) return getWalletIcon(label);
    return undefined;
  };

  // Label and icon are mutually exclusive
  const customIcon = getCustomIcon();
  const customIconComponent = customIcon ? (
    <Icons icon={customIcon} />
  ) : undefined;

  const labelOrIcon = getAvatarIconOrLabel(label, customIconComponent);

  const badgeTooltip = (
    <TooltipContainer>
      <Typography forceTheme={ThemeMode.DARK} size={TypographySize.SMALL} weight={TypographyWeight.MEDIUM}>
        Logo unverified
      </Typography>
      <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
        Image not yet verified
      </Typography>
    </TooltipContainer>
  );

  const unverfiedImageProps = unverified
    ? {
        background: badgeBackground,
        showBadge: true,
        badgeIcon: Icon.Dot,
        badgeColor: 'disabled' as AccentColor,
        badgeSize: 12,
        badgeTooltip: badgeTooltip
      }
    : {};

  return (
    <Avatar
      {...unverfiedImageProps}
      {...avatarProps}
      color={(displayPictureData?.profileAccentColor as AccentColor) ?? color}
      forceTheme={forceTheme}
      iconDataTest={`${UserAvatarDataTest.userAvatarIcon}-${customIcon ?? ''}`}
      imageDataTest={UserAvatarDataTest.userAvatarImage}
      imageSrc={displayPictureData?.profileCustomURI ?? undefined}
      {...labelOrIcon}
    />
  );
};

export default UserAvatar;
