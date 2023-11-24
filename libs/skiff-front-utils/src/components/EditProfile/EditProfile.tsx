import {
  AccentColor,
  ButtonGroupItem,
  CorrectedColorSelect,
  Dialog,
  DialogType,
  Icon,
  IconButton,
  Size,
  ThemeMode,
  Type,
  accentColorToPrimaryColor,
  getThemedColor
} from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CreateUploadAvatarLinkResponse, DisplayPictureData } from 'skiff-graphql';
import styled from 'styled-components';

import { useCurrentUserData } from '../../apollo';
import { useDefaultEmailAlias } from '../../hooks';
import useObjectURL from '../../hooks/useObjectURL';
import { uploadFileToS3 } from '../../utils/avatarUtils/avatarUtils';
import ColorSelector from '../ColorSelector';
import { UserAvatar } from '../UserAvatar';

import { CropDisplayPictureDialog } from './CropDisplayPictureDialog';

const Container = styled.div<{ $padding?: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  padding: ${({ $padding }) => $padding || 0}px;
`;

const ScaledAvatar = styled.div<{ $forceTheme?: ThemeMode }>`
  & > * {
    box-shadow: ${({ $forceTheme }) => getThemedColor('var(--l1-shadow)', $forceTheme)};

    border: 2.5px solid ${({ $forceTheme }) => getThemedColor('var(--bg-l2-glass)', $forceTheme)};
  }
`;

const HoverContainer = styled.div`
  position: relative;
`;

const HoverIcon = styled.div`
  position: absolute;
  margin-top: -34px;
  margin-left: 56px;
  margin-bottom: -28px;
  z-index: 9;
  & > div {
    width: 32px !important;
    height: 32px !important;
  }
  border-radius: 100px;
  overflow: hidden;
`;

const ColorBackdrop = styled.div<{
  $accentColor: AccentColor;
  $disabled?: boolean;
  $forceTheme?: ThemeMode;
}>`
  background: ${({ $accentColor, $disabled, $forceTheme }) =>
    $disabled
      ? getThemedColor('var(--bg-overlay-tertiary)', $forceTheme)
      : CorrectedColorSelect[accentColorToPrimaryColor[$accentColor]]};
  width: 100%;
  height: 64px;
  border-radius: 8px;
`;

const AvatarRow = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  align-items: flex-start;
  margin: -50px 0 -28px 14px;

  ${isMobile && `margin-left: 12px;`}
`;

const AccentPickerContainer = styled.div<{ $disabled?: boolean }>`
  width: 234px;
  align-self: flex-end;
  z-index: 100;

  ${({ $disabled }) => `
    filter: ${$disabled ? 'grayscale(1)' : ''};
    opacity: ${$disabled ? 0.6 : 1};
  `}
`;

const NameColor = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: auto;
  flex-wrap: nowrap;
  text-overflow: ellipsis;
`;

export type EditProfileIsContactProp =
  | false
  | { isContact: true; createUploadContactAvatar: () => Promise<CreateUploadAvatarLinkResponse | undefined> };

interface EditProfileProps {
  displayName: string | null | undefined;
  displayPictureData: DisplayPictureData | null | undefined;
  // For different types of avatars (user, contact, org), we use a different upload mutation
  // We want this prop to be mandatory to ensure we always use the correct mutation
  createUploadLink: (() => Promise<CreateUploadAvatarLinkResponse | undefined>) | undefined;
  // Custom label for the avatar
  label?: string;
  sublabel?: string;
  hideDisplayName?: boolean;
  disabled?: boolean;
  /** Runs when the user attempts to update the display picture */
  onUpdateDisplayPicture?: () => void;
  setDisplayPictureData?: (displayPictureData: DisplayPictureData) => Promise<void> | void;
  padding?: number;
  hideUpload?: boolean;
  forceTheme?: ThemeMode;
}

/**
 * Component for rendering the change display name section in AccountSettings.
 * This should be extended to include further profile personalization as it is added.
 */
function EditProfile(props: EditProfileProps) {
  const {
    displayName,
    displayPictureData,
    createUploadLink,
    label,
    padding,
    disabled,
    onUpdateDisplayPicture,
    hideUpload = false,
    setDisplayPictureData,
    forceTheme
  } = props;

  /** Text content inside text field */
  const [displayNameStateField, setDisplayNameStateField] = useState(displayName || '');
  /** Open delete photo confirm modal */
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Currently uploaded image file for cropping */
  const { setObject: setUploadedFile, objectURL: uploadedImageSrc } = useObjectURL();

  const userData = useCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(userData?.userID || '');

  // To account for loading from Apollo -- when display name gets filled in,
  // update our local state field
  useEffect(() => setDisplayNameStateField(displayName || ''), [displayName]);
  const closeConfirmDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDelete(false);
  };

  const name = displayNameStateField || displayName || defaultEmailAlias || 'A';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAccentColor = 'orange';
  const accentColor = (displayPictureData?.profileAccentColor ?? defaultAccentColor) as AccentColor;
  const avatarIsPhoto = !!displayPictureData?.profileCustomURI;
  const canUploadImage = !hideUpload && !!setDisplayPictureData && !!createUploadLink;

  const handleAvatarClick = () => {
    if (onUpdateDisplayPicture) {
      onUpdateDisplayPicture();
      return;
    }

    if (avatarIsPhoto) setConfirmDelete(true);
    else fileInputRef.current?.click();
  };

  return (
    <Container $padding={padding}>
      <ColorBackdrop $accentColor={accentColor} $disabled={disabled} $forceTheme={forceTheme} />
      <AvatarRow>
        <ScaledAvatar $forceTheme={forceTheme}>
          <UserAvatar
            color={disabled ? 'red' : accentColor}
            disabled={disabled}
            displayPictureData={displayPictureData}
            forceTheme={forceTheme}
            label={label ?? name}
            onClick={canUploadImage ? handleAvatarClick : undefined}
            size={Size.X_LARGE}
          />
        </ScaledAvatar>
        {canUploadImage && (
          <HoverContainer>
            <HoverIcon>
              <IconButton
                forceTheme={forceTheme}
                icon={avatarIsPhoto ? Icon.Trash : Icon.Camera}
                onClick={handleAvatarClick}
                size={Size.SMALL}
              />
            </HoverIcon>
          </HoverContainer>
        )}
      </AvatarRow>
      <Dialog
        forceTheme={forceTheme}
        onClose={closeConfirmDialog}
        open={confirmDelete}
        title='Remove photo'
        type={DialogType.CONFIRM}
      >
        <ButtonGroupItem
          label='Delete'
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (!!setDisplayPictureData) {
              void setDisplayPictureData({
                ...displayPictureData,
                profileCustomURI: undefined
              });
            }
            closeConfirmDialog(e);
          }}
          type={Type.DESTRUCTIVE}
        />
        <ButtonGroupItem label='Cancel' onClick={closeConfirmDialog} />
      </Dialog>
      <input
        accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif'].join(', ')}
        multiple
        onChange={(event) => {
          const uploadedFiles = event.target.files;
          if (!uploadedFiles?.length) return;
          const file = uploadedFiles[0];
          setUploadedFile(file);
        }}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        value={''}
      />
      <NameColor>
        {!!setDisplayPictureData && (
          <AccentPickerContainer $disabled={disabled}>
            <ColorSelector
              colorToStyling={accentColorToPrimaryColor}
              disabled={disabled}
              handleChange={(profileAccentColor) => {
                if (disabled || !setDisplayPictureData) return;

                if (onUpdateDisplayPicture) {
                  onUpdateDisplayPicture();
                  return;
                }

                void setDisplayPictureData({
                  ...displayPictureData,
                  profileAccentColor
                });
              }}
              hideSelected={disabled}
              value={accentColor}
            />
          </AccentPickerContainer>
        )}
      </NameColor>
      {uploadedImageSrc && !!createUploadLink && (
        <CropDisplayPictureDialog
          handleClose={(e?: React.MouseEvent) => {
            e?.stopPropagation();
            setUploadedFile(null);
          }}
          imageSrc={uploadedImageSrc}
          onSubmit={async (file) => {
            const { writeUrl, profileCustomURI } = (await createUploadLink()) ?? {};
            if (!writeUrl || !profileCustomURI) return;

            await uploadFileToS3(writeUrl, file);
            if (!setDisplayPictureData) return;
            await setDisplayPictureData({
              ...displayPictureData,
              profileCustomURI
            });
          }}
        />
      )}
    </Container>
  );
}

export default EditProfile;
