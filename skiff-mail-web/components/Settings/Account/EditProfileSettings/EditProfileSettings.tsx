import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useUserProfile,
  useUpdateDisplayPictureMutation,
  useCreateUploadAvatarLinkMutation
} from 'skiff-front-graphql';
import {
  EditProfile,
  getDisplayPictureDataFromUser,
  TitleActionSection,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { CreateUploadAvatarLinkResponse, DisplayPictureData, RequestStatus } from 'skiff-graphql';

import { useCurrentUserDefinedDisplayName } from '../../../../hooks/useCurrentUserDefinedDisplayName';
import { setDisplayName } from '../../../../utils/userUtils';

/**
 * Component for changing account color and photo (settings modal only)
 */
function EditProfileSettings() {
  const { userID } = useRequiredCurrentUserData();

  const displayName = useCurrentUserDefinedDisplayName();
  /** Request error message */
  const [errorMsg, setErrorMsg] = useState('');
  /** Text content inside text field */
  const [displayNameStateField, setDisplayNameStateField] = useState(displayName || '');
  const { data: userProfileData } = useUserProfile(userID);

  const [createUploadAvatarLinkMutation] = useCreateUploadAvatarLinkMutation();

  const displayPictureData = getDisplayPictureDataFromUser(userProfileData);

  const [setDisplayPictureMutation] = useUpdateDisplayPictureMutation();
  const setDisplayPictureData = useCallback(
    async (updatedDisplayPictureData: DisplayPictureData) => {
      const { profileAccentColor, profileCustomURI, profileIcon } = updatedDisplayPictureData;
      await setDisplayPictureMutation({
        variables: {
          request: {
            profileAccentColor,
            profileCustomURI,
            profileIcon
          }
        }
      });
    },
    [setDisplayPictureMutation]
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // To account for loading from Apollo -- when display name gets filled in,
  // update our local state field
  useEffect(() => setDisplayNameStateField(displayName || ''), [displayName]);

  const setCurrentUserDisplayName = (name: string) => setDisplayName(userID, name);

  const save = async () => {
    if (!setCurrentUserDisplayName) return;
    const status = await setCurrentUserDisplayName(displayNameStateField);
    if (inputRef?.current) inputRef.current.blur();
    if (status !== RequestStatus.Success) setErrorMsg('Invalid character included.');
  };

  const onChange = (evt: { target: { value: string } }) => {
    if (!!errorMsg.length) setErrorMsg('');
    setDisplayNameStateField(evt.target.value);
  };

  const onBlur = () => {
    setTimeout(() => {
      if (document.activeElement?.id === 'edit-profile-btn') {
        return; // ignore save button click
      }
      void save();
    }, 1);
  };

  const onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === 'Enter') {
      void save();
    }
  };

  const createUploadAvatarLink = async (): Promise<CreateUploadAvatarLinkResponse | undefined> => {
    const { data: avatarLink, errors } = await createUploadAvatarLinkMutation();

    if (errors || !avatarLink?.createUploadAvatarLink) {
      console.error('Error creating upload avatar link', errors);
      return;
    }

    return avatarLink?.createUploadAvatarLink;
  };

  return (
    <>
      <EditProfile
        createUploadLink={createUploadAvatarLink}
        displayName={displayName}
        displayPictureData={displayPictureData}
        key='edit-profile'
        setDisplayName={(newDisplayName) => setDisplayName(userID, newDisplayName)}
        setDisplayPictureData={setDisplayPictureData}
        type='inline'
      />
      <TitleActionSection
        actions={[
          {
            innerRef: inputRef,
            dataTest: 'change-display-name-input',
            onChange,
            onBlur,
            onKeyDown,
            errorMsg,
            value: displayNameStateField,
            placeholder: displayNameStateField || 'Display name',
            type: 'input'
          }
        ]}
        subtitle='The name others in your workspace will see you as'
        title='Display name'
      />
    </>
  );
}

export default EditProfileSettings;
