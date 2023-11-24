import { Size, ThemeMode, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { AddressObjectWithDisplayPicture, UserAvatar } from 'skiff-front-utils';
import { formatEmailAddress, getAddrDisplayName } from 'skiff-front-utils';
import styled from 'styled-components';

const AddressRowContainer = styled.div<{ onClick?: React.MouseEventHandler }>`
  display: flex;
  align-items: center;
  padding: 6px 0px;
  cursor: pointer;
  width: 100%;
  border-radius: 8px;
  box-sizing: border-box;
`;

const AddressRowText = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MobileAddressRowContainer = styled.div<{ onClick?: React.MouseEventHandler }>`
  display: flex;
  align-items: center;
  box-sizing: border-box;
`;

type ContactRowOptionProps = {
  address: AddressObjectWithDisplayPicture;
  // Defined in autocomplete dropdown, undefined in contact details on hover
  onClick?: React.MouseEventHandler;
};

/*
 * Component for rendering an email address suggestion for the To/Cc/Bcc fields
 */
const ContactRowOption: FC<ContactRowOptionProps> = ({ address, onClick }) => {
  const { address: emailAddress, displayPictureData } = address;
  const { displayName, formattedDisplayName } = getAddrDisplayName(address);

  if (isMobile) {
    return (
      <MobileAddressRowContainer onClick={onClick}>
        <UserAvatar displayPictureData={displayPictureData} label={displayName} size={Size.LARGE} />
        <AddressRowText>
          <Typography size={TypographySize.LARGE}>{formattedDisplayName}</Typography>
        </AddressRowText>
      </MobileAddressRowContainer>
    );
  }

  return (
    <AddressRowContainer onClick={onClick}>
      <UserAvatar displayPictureData={displayPictureData} forceTheme={ThemeMode.DARK} label={displayName} />
      <AddressRowText>
        <Typography forceTheme={ThemeMode.DARK} size={TypographySize.SMALL} weight={TypographyWeight.MEDIUM}>
          {formattedDisplayName}
        </Typography>
        <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
          {formatEmailAddress(emailAddress)}
        </Typography>
      </AddressRowText>
    </AddressRowContainer>
  );
};

export default ContactRowOption;
