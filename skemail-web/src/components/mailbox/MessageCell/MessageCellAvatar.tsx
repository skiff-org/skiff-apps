import { Size, ThemeMode } from 'nightwatch-ui';
import { UserAvatar, splitEmailToAliasAndDomain } from 'skiff-front-utils';

import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import { useDisplayPictureWithDefaultFallback } from '../../../hooks/useDisplayPictureDataFromAddress';

export interface MessageCellAvatarProps {
  senderName: string;
  customBorderRadius?: number;
  address?: string;
  /** Needed to allow Facepile size to override Avatar theme and size */
  forceTheme?: ThemeMode;
  size?: Size;
  messageID?: string;
  badgeBackground?: string;
}

export const MessageCellAvatar = ({
  senderName,
  badgeBackground,
  customBorderRadius,
  address,
  forceTheme,
  size,
  messageID
}: MessageCellAvatarProps) => {
  const { displayPictureData, unverified } = useDisplayPictureWithDefaultFallback(address, messageID);
  const contactDisplayName = useDisplayNameFromAddress(address);

  const { alias: senderNameAlias } = splitEmailToAliasAndDomain(senderName);
  return (
    <UserAvatar
      badgeBackground={badgeBackground}
      customBorderRadius={customBorderRadius}
      displayPictureData={{
        profileCustomURI: displayPictureData?.profileCustomURI,
        profileAccentColor: displayPictureData?.profileAccentColor,
        profileIcon: displayPictureData?.profileIcon
      }}
      forceTheme={forceTheme}
      label={contactDisplayName || senderNameAlias}
      size={size}
      unverified={unverified}
    />
  );
};
