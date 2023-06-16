import { Avatar, AvatarProps, Icon, getAvatarIconOrLabel, AccentColor, ThemeMode } from 'nightwatch-ui';
import React from 'react';
import { DisplayPictureData } from 'skiff-graphql';
import { isWalletOrNameServiceAddress } from 'skiff-utils';

import { getWalletIcon } from '../../utils/walletUtils/walletUtils';

interface UserAvatarProps extends Omit<AvatarProps, 'icon'> {
  label: string;
  displayPictureData?: DisplayPictureData | null;
  // whether it's a UD avatar
  isUdAvatar?: boolean;
}

export const UserAvatarDataTest = {
  userAvatarIcon: 'user-avatar-icon',
  userAvatarImage: 'user-avatar-image'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  label,
  displayPictureData,
  isUdAvatar,
  color,
  forceTheme,
  ...avatarProps
}) => {
  const getCustomIcon = () => {
    if (displayPictureData?.profileIcon) return displayPictureData.profileIcon as Icon;
    if (isUdAvatar) return forceTheme === ThemeMode.DARK ? Icon.UnstoppableDark : Icon.Unstoppable;
    if (isWalletOrNameServiceAddress(label)) return getWalletIcon(label);
    return undefined;
  };

  // Label and icon are mutually exclusive
  const customIcon = getCustomIcon();

  const labelOrIcon = getAvatarIconOrLabel(label, customIcon);

  return (
    <Avatar
      {...avatarProps}
      color={(displayPictureData?.profileAccentColor as AccentColor) ?? color}
      iconDataTest={`${UserAvatarDataTest.userAvatarIcon}-${customIcon ?? ''}`}
      imageDataTest={UserAvatarDataTest.userAvatarImage}
      imageSrc={displayPictureData?.profileCustomURI ?? undefined}
      {...labelOrIcon}
      forceTheme={forceTheme}
      showIconSource={isUdAvatar}
    />
  );
};

export default UserAvatar;
