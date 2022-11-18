import { Tooltip, Typography } from 'nightwatch-ui';
import React from 'react';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { UserAvatar } from 'skiff-front-utils';
import { formatEmailAddress, getAddrDisplayName, getAddressTooltipLabel } from 'skiff-front-utils';
import { AddressObject, DisplayPictureData } from 'skiff-graphql';
import styled from 'styled-components';

const AddressRowContainer = styled.div<{ onClick?: React.MouseEventHandler }>`
  display: flex;
  align-items: center;
  padding: 6px 16px;
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
  address: AddressObject;
  // Defined in autocomplete dropdown, undefined in contact details on hover
  onClick?: React.MouseEventHandler;
  displayPictureData?: DisplayPictureData | null;
};

/*
 * Component for rendering an email address suggestion for the To/Cc/Bcc fields
 */
const ContactRowOption: FC<ContactRowOptionProps> = ({ address, onClick, displayPictureData }) => {
  const { address: emailAddress } = address;
  const { displayName, formattedDisplayName } = getAddrDisplayName(address);
  const addressTooltipLabel = getAddressTooltipLabel(emailAddress);

  if (isMobile) {
    return (
      <MobileAddressRowContainer onClick={onClick}>
        <UserAvatar displayPictureData={displayPictureData} label={displayName} size='large' />
        <AddressRowText>
          <Typography level={1}>{formattedDisplayName}</Typography>
        </AddressRowText>
      </MobileAddressRowContainer>
    );
  }

  return (
    <AddressRowContainer onClick={onClick}>
      <UserAvatar displayPictureData={displayPictureData} label={displayName} size='small' />
      <AddressRowText>
        <Typography level={3} type='label'>
          {formattedDisplayName}
        </Typography>
        <Tooltip direction='top' label={addressTooltipLabel}>
          <div>
            <Typography color='secondary' level={3}>
              {formatEmailAddress(emailAddress)}
            </Typography>
          </div>
        </Tooltip>
      </AddressRowText>
    </AddressRowContainer>
  );
};

export default ContactRowOption;
