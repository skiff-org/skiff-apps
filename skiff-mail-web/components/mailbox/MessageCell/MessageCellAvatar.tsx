import React from 'react';
import { splitEmailToAliasAndDomain, UserAvatar } from 'skiff-front-utils';

import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';

export interface MessageCellAvatarProps {
  senderName: string;
  numAvatars: number;
  key?: string;
  address?: string;
}

export const MessageCellAvatar = ({ key, address, senderName, numAvatars }: MessageCellAvatarProps) => {
  const getMobileSize = () => {
    switch (numAvatars) {
      case 1:
        return 'xmedium';
      case 2:
        return 'medium';
      case 3:
        return 'small';
      case 4:
      default:
        return 'xsmall';
    }
  };
  const displayPictureData = useDisplayPictureDataFromAddress(address);
  const mobileSize = getMobileSize();
  const [senderNameAlias] = splitEmailToAliasAndDomain(senderName);
  return (
    <UserAvatar displayPictureData={displayPictureData} key={key} label={senderNameAlias} size={mobileSize} squared />
  );
};
