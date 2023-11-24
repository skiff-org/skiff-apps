import { Avatar, AvatarProps, getAvatarIconOrLabel } from 'nightwatch-ui';
import React from 'react';
import { getWalletIcon } from 'skiff-front-utils';
import { isWalletOrNameServiceAddress } from 'skiff-utils';

export const UserAvatar: React.FC<Omit<AvatarProps, 'icon'>> = ({ label, ...avatarProps }) => {
  // With the requireOnlyOne typing in AvatarProps label will be required, but we need this check to resolve ts
  if (!label) return null;

  const getCustomIcon = () => {
    if (isWalletOrNameServiceAddress(label)) return getWalletIcon(label);
    return undefined;
  };

  // Label and icon are mutually exclusive
  const customIcon = getCustomIcon();

  const labelOrIcon = getAvatarIconOrLabel(label, customIcon);

  return <Avatar {...avatarProps} {...labelOrIcon} />;
};
