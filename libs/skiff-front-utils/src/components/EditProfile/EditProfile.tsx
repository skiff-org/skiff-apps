import {
  AccentColor,
  accentColorToPrimaryColor,
  Button,
  ButtonGroupItem,
  CorrectedColorSelect,
  Dialog,
  DialogTypes,
  Icon,
  IconButton,
  InputField,
  Size,
  stringToColor,
  Type,
  Typography
} from '@skiff-org/skiff-ui';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CreateUploadAvatarLinkResponse, DisplayPictureData, RequestStatus } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { useCurrentUserData } from '../../apollo';
import { useDefaultEmailAlias } from '../../hooks';
import useObjectURL from '../../hooks/useObjectURL';
import { uploadFileToS3 } from '../../utils/avatarUtils/avatarUtils';
import ColorSelector from '../ColorSelector';
import UserAvatar from '../UserAvatar/UserAvatar';

import { CropDisplayPictureDialog } from './CropDisplayPictureDialog';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-height: 154px;
`;

const ScaledAvatar = styled.div`
  & > * {
    border: 6px solid var(--bg-l2-glass);
  }
`;

const HoverIcon = styled.div`
  margin-top: -34px;
  margin-left: 96px;
  margin-bottom: -28px;
  z-index: 9;
  & > div {
    width: 32px !important;
    height: 32px !important;
  }
`;

const ColorBackdrop = styled.div<{ $inline: boolean; $compact?: boolean }>`
  ${(props) =>
    !props.$inline &&
    css`
      width: calc(100% + 50px);
      height: 190px;
      position: relative;
      top: -25px;
      left: -25px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    `}
  ${(props) =>
    props.$inline &&
    css`
      width: 100%;
      height: ${!props.$compact ? '100px' : '88px'};
      ${isMobile &&
      css`
        border-radius: 22px 12px 12px 12px;
      `}
      ${!isMobile &&
      css`
        border-radius: 12px;
      `}
    `}
`;

const AvatarRow = styled.div<{ $inline: boolean; $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  ${(props) =>
    !props.$inline &&
    css`
      width: 100%;
      align-items: center;
      margin-top: -100px;
    `}
  ${(props) =>
    props.$inline &&
    css`
      align-items: flex-start;

      ${isMobile &&
      css`
        margin-top: ${!props.$compact ? '-116px' : '-104px'};
        margin-left: ${!props.$compact ? '12px' : '9px'};
      `}

      ${!isMobile &&
      css`
        margin-top: ${!props.$compact ? '-100px' : '-84px'};
        margin-left: 36px;
      `}
      margin-bottom: ${!props.$compact ? '-42px' : '-66px'};
    `}
`;

const AccentPickerContainer = styled.div<{ $canEditName: boolean; disabled?: boolean; $inline: boolean }>`
  filter: ${(props) => (props.disabled ? 'grayscale(1)' : '')};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};

  ${isMobile &&
  css`
    position: relative;
    top: 34px;
  `}

  ${(props) =>
    !props.$inline &&
    css`
      width: 280px;
      margin-top: ${props.$canEditName ? '36px' : ''};
      align-self: center;
    `}
  ${(props) =>
    props.$inline &&
    css`
      width: 234px;
      align-self: flex-end;
      z-index: 100;

      ${props.$canEditName && 'margin-top: 14px;'}
    `}
`;

const DisplayNameParentContainer = styled.div<{ $canEditDisplayPicture: boolean }>`
  position: relative;

  ${(props) =>
    !props.$canEditDisplayPicture &&
    (!isMobile
      ? css`
          top: -8px;
          left: 180px;
        `
      : css`
          top: -3px;
          left: 136px;
        `)}
`;

const DisplayNameContainer = styled.div<{ $canEditDisplayPicture: boolean }>`
  position: absolute;
  ${(props) =>
    props.$canEditDisplayPicture
      ? css`
          top: 21px;
          left: 180px;
        `
      : css`
          top: 0px;
          left: 0px;
        `}
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
  // is or is not UD signup
  isUdSignup?: boolean;
  type?: 'default' | 'inline';
  setDisplayName?: (displayName: string) => Promise<RequestStatus> | void;
  setDisplayPictureData?: (displayPictureData: DisplayPictureData) => Promise<void> | void;
  // shorten the height for compact components
  compact?: boolean;
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
    compact,
    sublabel,
    hideDisplayName,
    disabled,
    isUdSignup,
    type,
    setDisplayName,
    setDisplayPictureData
  } = props;

  /** Text content inside text field */
  const [displayNameStateField, setDisplayNameStateField] = useState(displayName || '');
  /** Request error message */
  const [errorMsg, setErrorMsg] = useState('');
  /** Whether user is editing */
  const [isEditing, setIsEditing] = useState(false);
  /** Open delete photo confirm modal */
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** Currently uploaded image file for cropping */
  const { setObject: setUploadedFile, objectURL: uploadedImageSrc } = useObjectURL();

  const userData = useCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(userData?.userID || '');

  const inputRef = useRef<HTMLInputElement>(null);

  // To account for loading from Apollo -- when display name gets filled in,
  // update our local state field
  useEffect(() => setDisplayNameStateField(displayName || ''), [displayName]);
  const closeConfirmDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDelete(false);
  };

  const save = async () => {
    if (!setDisplayName) return;
    const status = await setDisplayName(displayNameStateField);
    if (inputRef?.current) inputRef.current.blur();
    setIsEditing(false);
    if (status !== RequestStatus.Success) setErrorMsg('Invalid character included.');
  };

  const focus = () => {
    if (inputRef?.current) inputRef.current.focus();
  };

  const name = displayNameStateField || displayName || defaultEmailAlias || 'A';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, , defaultAccentColor] = stringToColor(name);
  const accentColor = (displayPictureData?.profileAccentColor ?? defaultAccentColor) as AccentColor;
  const avatarIsPhoto = !!displayPictureData?.profileCustomURI;

  const handleAvatarClick = () => {
    if (avatarIsPhoto) {
      setConfirmDelete(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const canUploadImage = !!setDisplayPictureData && !!createUploadLink;

  const isInline = type === 'inline';
  return (
    <Container>
      <ColorBackdrop
        $compact={compact}
        $inline={isInline}
        style={{
          background: disabled
            ? 'var(--bg-field-default)'
            : CorrectedColorSelect[accentColorToPrimaryColor[accentColor]]
        }}
      />
      <AvatarRow $compact={compact} $inline={isInline}>
        <ScaledAvatar>
          <UserAvatar
            color={disabled ? 'red' : accentColor}
            disabled={disabled}
            displayPictureData={displayPictureData}
            isUdAvatar={isUdSignup}
            label={label ?? name}
            onClick={canUploadImage ? handleAvatarClick : undefined}
            size={Size.X_LARGE}
          />
        </ScaledAvatar>
        {canUploadImage && (
          <HoverIcon>
            <IconButton icon={avatarIsPhoto ? Icon.Trash : Icon.Camera} onClick={handleAvatarClick} size={Size.SMALL} />
          </HoverIcon>
        )}
      </AvatarRow>
      <Dialog onClose={closeConfirmDialog} open={confirmDelete} title='Remove photo' type={DialogTypes.Confirm}>
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
      {!setDisplayName && (
        <DisplayNameParentContainer $canEditDisplayPicture={!!setDisplayPictureData}>
          <DisplayNameContainer $canEditDisplayPicture={!!setDisplayPictureData}>
            {/* Conditional rendering here rather than on parents to maintain relative positioning */}
            {!hideDisplayName && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  mono
                  uppercase
                  color={disabled ? 'disabled' : 'primary'}
                  maxWidth={isMobile ? '180px' : undefined}
                >
                  {displayName}
                </Typography>
                <Typography
                  mono
                  uppercase
                  color={disabled ? 'disabled' : 'secondary'}
                  maxWidth={isMobile ? '180px' : undefined}
                >
                  {sublabel}
                </Typography>
              </div>
            )}
          </DisplayNameContainer>
        </DisplayNameParentContainer>
      )}
      {!!setDisplayPictureData && (
        <AccentPickerContainer $canEditName={!!setDisplayName} $inline={isInline} disabled={disabled}>
          <ColorSelector
            colorToStyling={accentColorToPrimaryColor}
            disabled={disabled}
            handleChange={(profileAccentColor) => {
              if (disabled || !setDisplayPictureData) return;
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
      {!!setDisplayName && !isInline && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
          <InputField
            dataTest='change-display-name-input'
            errorMsg={errorMsg}
            innerRef={inputRef}
            onBlur={() => {
              setTimeout(() => {
                if (document.activeElement?.id === 'edit-profile-btn') {
                  return; // ignore save button click
                }
                void save();
              }, 1);
            }}
            onChange={(evt: { target: { value: string } }) => {
              if (!!errorMsg.length) setErrorMsg('');
              setDisplayNameStateField(evt.target.value);
            }}
            onFocus={() => setIsEditing(true)}
            onKeyDown={(evt: React.KeyboardEvent) => {
              if (evt.key === 'Enter') {
                void save();
              }
            }}
            placeholder={displayNameStateField || 'Display name'}
            value={displayNameStateField}
          />
          <Button id='edit-profile-btn' onClick={isEditing ? save : focus} type={Type.SECONDARY}>
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      )}
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
