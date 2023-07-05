import { Size, ThemeMode } from '@skiff-org/skiff-ui';
import { UserAvatar, splitEmailToAliasAndDomain } from 'skiff-front-utils';

import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import { useDisplayPictureWithDefaultFallback } from '../../../hooks/useDisplayPictureDataFromAddress';

export interface MessageCellAvatarProps {
  senderName: string;
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
      displayPictureData={displayPictureData}
      badgeBackground={badgeBackground}
      forceTheme={forceTheme}
      unverified={unverified}
      label={contactDisplayName || senderNameAlias}
      size={size}
    />
  );
};
