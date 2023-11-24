import React from 'react';
import { Contact } from 'skiff-graphql';

import { useDisplayPictureDataFromAddress } from '../../../hooks';
import UserListRow from '../shared/UserListRow';

import { getContactDisplayNameAndSubtitle, getContactDisplayPictureData } from './Contacts.utils';

interface ContactRowProps {
  active: boolean;
  hover: boolean;
  contact: Contact;
  isLast: boolean;
  selectedContactsIDs: string[];
  onClick: () => void;
  onToggleSelectedContact: (isShiftKey: boolean) => void;
}

const ContactRow: React.FC<ContactRowProps> = ({
  active,
  hover,
  contact,
  isLast,
  selectedContactsIDs,
  onClick,
  onToggleSelectedContact
}) => {
  const { displayName, subtitle } = getContactDisplayNameAndSubtitle(contact);
  const skiffUserDisplayPictureData = useDisplayPictureDataFromAddress(contact.emailAddress ?? undefined);
  const displayPictureData = getContactDisplayPictureData(contact);

  return (
    <UserListRow
      displayName={displayName}
      fullHeight
      hover={hover}
      isLast={isLast}
      isSelected={selectedContactsIDs.includes(contact.contactID)}
      onClick={onClick}
      showCheckbox
      subtitle={subtitle}
      toggleSelectedContact={onToggleSelectedContact}
      active={active}
      // fallback to contact's user's display picture if contact doesn't have one
      avatarDisplayData={displayPictureData || skiffUserDisplayPictureData || undefined}
    />
  );
};

export default ContactRow;
