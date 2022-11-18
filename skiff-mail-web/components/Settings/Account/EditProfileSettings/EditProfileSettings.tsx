import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditProfile, getDisplayPictureDataFromUser, TitleActionSection } from 'skiff-front-utils';
import { DisplayPictureData, RequestStatus } from 'skiff-graphql';
import { useCreateUploadAvatarLinkMutation, useUpdateDisplayPictureMutation } from 'skiff-mail-graphql';

import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';
import { useCurrentUserDefinedDisplayName } from '../../../../hooks/useCurrentUserDefinedDisplayName';
import { useUserProfile } from '../../../../hooks/useUserProfile';
import { setDisplayName } from '../../../../utils/userUtils';

/**
 * Component for changing account color and photo (settings modal only)
 */
function EditProfileSettings() {
  const { userID } = useRequiredCurrentUserData();

  const displayName = useCurrentUserDefinedDisplayName();
  /** Whether error occurred in request */
  const [hasError, setHasError] = useState(false);
  /** Text content inside text field */
  const [displayNameStateField, setDisplayNameStateField] = useState(displayName || '');
  const { data: userProfileData } = useUserProfile(userID);

  const displayPictureData = getDisplayPictureDataFromUser(userProfileData);

  const [createUploadAvatarLinkMutation] = useCreateUploadAvatarLinkMutation();
  const [setDisplayPictureMutation] = useUpdateDisplayPictureMutation();

  // Handlers for EditProfile
  const createUploadAvatarLink = useCallback(async () => {
    const { data, errors } = await createUploadAvatarLinkMutation();
    if (!data?.createUploadAvatarLink || !!errors?.length) {
      throw new Error('Error creating upload avatar link');
    }
    return data.createUploadAvatarLink;
  }, [createUploadAvatarLinkMutation]);

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
    setHasError(status !== RequestStatus.Success);
  };

  const onChange = (evt: { target: { value: string } }) => setDisplayNameStateField(evt.target.value);

  const errorMsg = hasError
    ? 'Could not set display name, try limiting punctuation to ,.`&apos;-_ and no double spaces.'
    : '';
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

  return (
    <>
      <EditProfile
        createUploadAvatarLink={createUploadAvatarLink}
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
            errorMsg: errorMsg,
            value: displayNameStateField,
            placeholder: displayNameStateField || 'Display name',
            type: 'input'
          }
        ]}
        subtitle='The name others in your workspace will see you as.'
        title='Display name'
      />
    </>
  );
}

export default EditProfileSettings;
