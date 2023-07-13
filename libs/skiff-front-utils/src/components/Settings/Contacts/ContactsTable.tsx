import { InputField } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import {
  useCreateOrUpdateContactMutation,
  useDeleteContactMutation,
  useUpdateUploadContactAvatarLinkMutation
} from 'skiff-front-graphql';

import { useCurrentOrganization, useToast } from '../../../hooks';
import useGetAllContactsWithOrgMembers from '../../../hooks/useGetAllContactsWithOrgMembers';
import UserListTable, { UserListTableSection } from '../shared/UserListTable';

import ContactProfileView, { ContactWithoutTypename, getContactWithoutTypename } from './ContactProfileView';
import ContactsRow from './ContactRow';
import { compareContactsDisplayNameAndSubtitle } from './Contacts.utils';

interface ContactsTableProps {
  showProfileView: boolean;
  setShowProfileView: React.Dispatch<React.SetStateAction<boolean>>;
}

const ContactsTable = (props: ContactsTableProps) => {
  const { showProfileView, setShowProfileView } = props;
  // State
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<ContactWithoutTypename | undefined>(undefined);

  // Custom hooks
  const { enqueueToast } = useToast();

  // Graphql
  const { contactsWithOrgMembers, loading, error, refetch } = useGetAllContactsWithOrgMembers({
    onError: (err) => {
      console.error('Failed to load contacts', err);
    }
  });

  const [createOrUpdateContact] = useCreateOrUpdateContactMutation();
  const [deleteContactMutation] = useDeleteContactMutation();
  const [updateUploadContactAvatarUrl] = useUpdateUploadContactAvatarLinkMutation();
  const { data: orgData } = useCurrentOrganization();
  const orgName = orgData?.organization.name ?? '';

  const filteredContacts = !!searchValue
    ? contactsWithOrgMembers.filter((contact) => {
        const { firstName, lastName, emailAddress } = contact;
        const name = [firstName, lastName].join(' ');
        return (
          name.toLowerCase().includes(searchValue.toLowerCase()) ||
          emailAddress.toLowerCase().includes(searchValue.toLowerCase())
        );
      })
    : contactsWithOrgMembers;
  const sortedContacts = [...filteredContacts].sort(compareContactsDisplayNameAndSubtitle);

  const inputField = (
    <InputField
      onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(evt.target.value);
      }}
      placeholder='Search by name or email'
      value={searchValue}
    />
  );

  const handleSave = async (contact: ContactWithoutTypename) => {
    const { firstName, lastName, emailAddress, displayPictureData } = contact;

    const enqueueSaveErrorToast = () => enqueueToast({ title: 'Failed to save contact' });

    // Set values to null if they're empty or undefined
    // IMPORTANT: Undefined leads to no value being changed, so this MUST be null
    const newFirstName = !firstName ? null : firstName;
    const newLastName = !lastName ? null : lastName;
    const newDisplayPictureData = !displayPictureData ? null : displayPictureData;

    try {
      const originalEmailAddress = selectedContact?.emailAddress;

      // If email address has changed, we need to delete the old contact since a new one will be created
      if (originalEmailAddress && originalEmailAddress !== emailAddress) {
        /**
         * If the original contact has a display picture (and it hasn't been removed), we need to
         *  1. Delete the old s3 object
         *  2. Create a new s3 object
         *  3. Update the contact with the new s3 object url
         */
        if (selectedContact.displayPictureData?.profileCustomURI && newDisplayPictureData?.profileCustomURI) {
          const { data: updateContactAvatarData, errors } = await updateUploadContactAvatarUrl({
            variables: {
              request: {
                oldContactEmail: originalEmailAddress,
                newContactEmail: emailAddress
              }
            }
          });

          if (errors || !updateContactAvatarData?.updateUploadContactAvatarLink) {
            console.error(errors);
            enqueueSaveErrorToast();
            return;
          }

          newDisplayPictureData.profileCustomURI =
            updateContactAvatarData?.updateUploadContactAvatarLink.newProfileCustomURI;
        }

        await deleteContactMutation({
          variables: {
            request: {
              emailAddress: originalEmailAddress
            }
          }
        });
      }

      await createOrUpdateContact({
        variables: {
          request: {
            emailAddress,
            firstName: newFirstName,
            lastName: newLastName,
            displayPictureData: newDisplayPictureData
          }
        }
      });
      void refetch();
      setSelectedContact(contact);
      enqueueToast({ title: 'Contact saved' });
    } catch (err) {
      console.error(err);
      enqueueSaveErrorToast();
    }
  };

  const handleAddButtonClick = () => {
    setShowProfileView(true);
  };

  const getEmptyText = () => {
    switch (true) {
      case !!error:
        return 'Failed to load contacts';
      case !!searchValue && !!contactsWithOrgMembers.length:
        return 'No contacts matching your search.';
      default:
        return 'No contacts yet.';
    }
  };

  const contactRowSection: UserListTableSection = {
    columnHeaders: ['CONTACT', 'ORGANIZATION'],
    rows: sortedContacts.map((contact, index) => (
      <ContactsRow
        contact={contact}
        isLast={index === contactsWithOrgMembers.length - 1}
        key={contact?.emailAddress}
        onClick={() => {
          setShowProfileView(true);
          setSelectedContact(getContactWithoutTypename(contact));
        }}
        orgName={orgName}
      />
    )),
    emptyText: getEmptyText()
  };

  return (
    <>
      {!showProfileView && (
        <UserListTable
          addButtonLabel='Add contact'
          header='Contacts'
          headerNumber={contactsWithOrgMembers.length}
          inputField={inputField}
          loading={loading}
          onAddButtonClick={handleAddButtonClick}
          sections={[contactRowSection]}
          showAddButton
        />
      )}
      {showProfileView && (
        <ContactProfileView
          onBack={() => {
            setShowProfileView(false);
            setSelectedContact(undefined);
          }}
          onSave={handleSave}
          orgName={orgName}
          refetch={() => void refetch()}
          selectedContact={selectedContact}
        />
      )}
    </>
  );
};

export default ContactsTable;
