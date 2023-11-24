import React from 'react';
import { useCreateUploadAliasAvatarLinkMutation } from 'skiff-front-graphql';
import { CreateUploadAvatarLinkResponse } from 'skiff-graphql';

import EditProfile from '../../EditProfile';

import { DisplayPictureSectionProps } from './AliasProfileModal.types';

function DisplayPictureSection({
  alias,
  displayedDisplayName,
  displayedDisplayPictureData,
  setNewDisplayPictureData,
  forceTheme
}: DisplayPictureSectionProps) {
  const [createUploadAliasAvatarLinkMutation] = useCreateUploadAliasAvatarLinkMutation();

  const createUploadAliasAvatarLink = async (): Promise<CreateUploadAvatarLinkResponse | undefined> => {
    const { data: avatarLink, errors } = await createUploadAliasAvatarLinkMutation({
      variables: { emailAlias: alias }
    });

    if (errors || !avatarLink?.createUploadAliasAvatarLink) return;

    return avatarLink?.createUploadAliasAvatarLink;
  };

  return (
    <EditProfile
      createUploadLink={createUploadAliasAvatarLink}
      displayName={displayedDisplayName}
      displayPictureData={displayedDisplayPictureData}
      forceTheme={forceTheme}
      setDisplayPictureData={setNewDisplayPictureData}
      label={alias}
    />
  );
}

export default DisplayPictureSection;
