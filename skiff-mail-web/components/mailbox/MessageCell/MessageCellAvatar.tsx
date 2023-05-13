import { Size, ThemeMode } from 'nightwatch-ui';
import { UserAvatar, splitEmailToAliasAndDomain } from 'skiff-front-utils';

import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';

export interface MessageCellAvatarProps {
  senderName: string;
  address?: string;
  /** Needed to allow Facepile size to override Avatar theme and size */
  forceTheme?: ThemeMode;
  size?: Size;
}

export const MessageCellAvatar = ({ senderName, address, forceTheme, size }: MessageCellAvatarProps) => {
  const displayPictureData = useDisplayPictureDataFromAddress(address);
  const contactDisplayName = useDisplayNameFromAddress(address);

  const { alias: senderNameAlias } = splitEmailToAliasAndDomain(senderName);
  return (
    <UserAvatar
      displayPictureData={displayPictureData}
      forceTheme={forceTheme}
      label={contactDisplayName || senderNameAlias}
      size={size}
    />
  );
};
