import { Icon, Icons, Typography } from 'nightwatch-ui';
import React from 'react';
import { Contact } from 'skiff-graphql';
import styled from 'styled-components';

import { useDisplayPictureDataFromAddress } from '../../../hooks';
import { isOrgMemberContact, OrgMemberContact } from '../../../hooks/useGetAllContactsWithOrgMembers';
import UserListRow from '../shared/UserListRow';

import { getContactDisplayNameAndSubtitle, getContactDisplayPictureData } from './Contacts.utils';

const ForwardIconContainer = styled.div`
  margin-left: auto;
  margin-right: 9px;
`;

const OrgName = styled.span`
  padding-left: 6px;
`;

interface ContactRowProps {
  contact: Contact | OrgMemberContact;
  isLast: boolean;
  orgName: string;
  onClick: () => void;
}

const ContactRow: React.FC<ContactRowProps> = ({ contact, isLast, orgName, onClick }) => {
  const [isHovering, setIsHovering] = React.useState<boolean>(false);

  const { displayName, subtitle } = getContactDisplayNameAndSubtitle(contact);
  const skiffUserDisplayPictureData = useDisplayPictureDataFromAddress(contact.emailAddress);
  const displayPictureData = getContactDisplayPictureData(contact);

  return (
    <UserListRow
      // fallback to contact's user's display picture if contact doesn't have one
      avatarDisplayData={displayPictureData || skiffUserDisplayPictureData || undefined}
      displayName={displayName}
      isLast={isLast}
      onClick={onClick}
      setIsHovering={setIsHovering}
      subtitle={subtitle}
    >
      <>
        {isOrgMemberContact(contact) && (
          <OrgName>
            <Typography color='secondary'>{orgName}</Typography>
          </OrgName>
        )}
        <ForwardIconContainer>
          <Icons color={isHovering ? 'secondary' : 'disabled'} icon={Icon.Forward} onClick={() => {}} />
        </ForwardIconContainer>
      </>
    </UserListRow>
  );
};

export default ContactRow;
