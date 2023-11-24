import dayjs from 'dayjs';
import isEqual from 'lodash/isEqual';
import { Icon, IconText, InputField } from 'nightwatch-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { encryptDatagramV2, generateSymmetricKey, stringEncryptAsymmetric } from 'skiff-crypto';
import {
  DisplayPictureData,
  EncryptedContactDataDatagram,
  useCreateOrUpdateContactMutation,
  useDeleteContactMutation,
  useDeleteContactsMutation,
  useGetAllCurrentUserContactsQuery
} from 'skiff-front-graphql';
import { Contact } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';
import { v4 } from 'uuid';
import isEmail from 'validator/lib/isEmail';

import { useRequiredCurrentUserData } from '../../../apollo';
import { DateInputFormats } from '../../../constants';
import { useMediaQuery, useToast, useUserPreference } from '../../../hooks';
import { ConfirmModal } from '../../modals';
import { UserListTableSection } from '../shared/UserListTable';

import ContactConfirmModal from './ContactConfirmModal';
import ContactProfileView from './ContactProfileView';
import ContactRow from './ContactRow';
import {
  ContactProfileConfirmModalType,
  ContactWithoutTypename,
  ErrorState,
  PopulateContactContent
} from './Contacts.types';
import {
  compareContactsDisplayNameAndSubtitle,
  contactIsUnchanged,
  createEmptyContact,
  getContactWithoutTypename,
  isEmptyContact
} from './Contacts.utils';
import ContactUserListTable from './ContactUserListTable';

interface ContactsTableProps {
  showProfileView: boolean;
  setShowProfileView: React.Dispatch<React.SetStateAction<boolean>>;
  populateContactContent?: PopulateContactContent;
  defaultSelectedContact?: ContactWithoutTypename;
  clearPopulateContactContent?: () => void;
}

const TableProfile = styled.div`
  display: flex;
  justify-content: space-between;
  height: 100%;
`;

const ContactRowHeader = styled.div`
  height: 100%;
`;

const ContactsTable = (props: ContactsTableProps) => {
  const {
    showProfileView,
    setShowProfileView,
    populateContactContent,
    defaultSelectedContact,
    clearPopulateContactContent
  } = props;
  const [hoverRowIndex, setHoverRowIndex] = useState<number | null>(0);
  const [navigatedByArrow, setNavigatedByArrow] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [selectedContactsIDs, setSelectedContactsIDs] = useState<string[]>([]);
  const [lastSelectedContactIDIndex, setLastSelectedContactIDIndex] = useState<number | null>(null);
  const [showDeleteContacts, setShowDeleteContacts] = useState(false);

  const userData = useRequiredCurrentUserData();
  const [createOrUpdateContact] = useCreateOrUpdateContactMutation();
  const [errors, setErrors] = useState<ErrorState>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);

  const [activeConfirmModalType, setActiveConfirmModalType] = useState<{
    type: ContactProfileConfirmModalType;
    contact?: ContactWithoutTypename;
  }>({ type: ContactProfileConfirmModalType.NONE, contact: undefined });

  const showProfileViewBreakpoint = useMediaQuery(`(min-width:1024px)`, { noSsr: true });

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // State
  const [searchValue, setSearchValue] = useState<string>('');
  const {
    contactID: populatedContactID,
    firstName: populatedFirstName,
    lastName: populatedLastName,
    address: populatedAddress,
    displayPictureData: populatedDisplayPictureData,
    decryptedData: populatedDecryptedData
  } = populateContactContent || {};
  const newContact: ContactWithoutTypename = {
    contactID: populatedContactID || v4(),
    firstName: populatedFirstName,
    lastName: populatedLastName,
    emailAddress: populatedAddress,
    displayPictureData: populatedDisplayPictureData,
    decryptedData: {
      decryptedBirthday: populatedDecryptedData?.decryptedBirthday,
      decryptedNotes: populatedDecryptedData?.decryptedNotes,
      decryptedPhoneNumbers: populatedDecryptedData?.decryptedPhoneNumbers,
      decryptedCompany: populatedDecryptedData?.decryptedCompany,
      decryptedJobTitle: populatedDecryptedData?.decryptedJobTitle,
      decryptedAddresses: populatedDecryptedData?.decryptedAddresses,
      decryptedNickname: populatedDecryptedData?.decryptedNickname,
      decryptedURL: populatedDecryptedData?.decryptedURL
    }
  };
  useEffect(() => {
    if (navigatedByArrow && hoverRowIndex !== null) {
      const activeRow = rowRefs.current[hoverRowIndex];
      if (activeRow) {
        activeRow.scrollIntoView({
          block: 'nearest'
        });
      }
    }
  }, [navigatedByArrow, hoverRowIndex]);

  // Custom hooks
  const { enqueueToast } = useToast();

  // Graphql
  const {
    data: contactsData,
    loading,
    error,
    refetch
  } = useGetAllCurrentUserContactsQuery({
    onError: (err) => {
      console.error('Failed to load contacts', err);
    }
  });

  const contacts = contactsData?.allContacts ?? [];

  const [deleteContactMutation] = useDeleteContactMutation();
  const [deleteContactsMutation] = useDeleteContactsMutation();

  const filteredContacts = !!searchValue
    ? contacts.filter((contact) => {
        const { firstName, lastName, emailAddress, decryptedData } = contact;
        const name = [firstName, lastName].join(' ');
        return (
          name.toLowerCase().includes(searchValue.toLowerCase()) ||
          emailAddress?.toLowerCase().includes(searchValue.toLowerCase()) ||
          decryptedData?.decryptedNickname?.toLowerCase().includes(searchValue.toLowerCase())
        );
      })
    : contacts;
  const sortedContacts = [...filteredContacts].sort(compareContactsDisplayNameAndSubtitle);
  // use null for new contact empty state, undefined for initial state
  const [selectedContact, setSelectedContact] = useState<ContactWithoutTypename | undefined | null>(
    !!populateContactContent ? newContact : defaultSelectedContact ?? undefined
  );
  const [pendingContact, setPendingContact] = useState<ContactWithoutTypename>(
    !!populateContactContent ? newContact : defaultSelectedContact ?? createEmptyContact()
  );
  const isNewContact = !selectedContact || !!populateContactContent;
  const [isEditing, setIsEditing] = React.useState<boolean>(isNewContact);

  const onBackReturn = () => {
    setShowProfileView(false);
    setSelectedContact(null);
    setPendingContact(createEmptyContact());
    // clear populated content
    if (clearPopulateContactContent) clearPopulateContactContent();
  };

  useEffect(() => {
    // If sortedContacts is not empty and selectedContact is not yet set, update the state
    if (sortedContacts.length > 0 && selectedContact === undefined && !populateContactContent) {
      setSelectedContact(getContactWithoutTypename(sortedContacts[0]));
      setPendingContact(getContactWithoutTypename(sortedContacts[0]) || createEmptyContact());
      setIsEditing(false);
    }
  }, [sortedContacts]);

  const handleCancelEditing = (contact?: ContactWithoutTypename, goBack?: boolean) => {
    const isDiscardingChanges =
      (isNewContact && !isEmptyContact(pendingContact)) ||
      (selectedContact && !contactIsUnchanged(selectedContact, pendingContact));
    const shouldGoBack = goBack;

    // If user has inputted something, confirm they want to discard
    if (isDiscardingChanges) {
      const confirmModalType = shouldGoBack
        ? ContactProfileConfirmModalType.DISCARD_CHANGES_AND_GO_BACK
        : ContactProfileConfirmModalType.DISCARD_CHANGES;
      setActiveConfirmModalType({ type: confirmModalType, contact: contact });
      return;
    }

    setIsEditing(false);

    // Either revert to original contact, or clear all fields
    setPendingContact(selectedContact ?? createEmptyContact());

    if (shouldGoBack) {
      onBackReturn();
    }
    return;
  };

  const updateContact = (contact: ContactWithoutTypename, fromNextAfterDelete?: boolean) => {
    const isDiscardingChanges =
      (pendingContact && selectedContact && !contactIsUnchanged(pendingContact, selectedContact)) ||
      (!!selectedContact && isNewContact && !isEmptyContact(selectedContact));

    setIsEditing(false);
    if (isDiscardingChanges && !fromNextAfterDelete) {
      handleCancelEditing(contact);
    } else {
      setPendingContact(contact);
      setSelectedContact(contact);
    }
  };

  const onSelectContact = useCallback(
    (contactID: string) => {
      setSelectedContactsIDs((prevState) => {
        // Check if the contactId is already in the selectedContactsIDs array
        const isAlreadySelected = prevState.includes(contactID);

        // If it is already selected, filter it out
        if (isAlreadySelected) {
          return prevState.filter((id) => id !== contactID);
        }

        // Otherwise, add it to the selected contacts
        return [...prevState, contactID];
      });
    },
    [setSelectedContactsIDs]
  );

  const onShiftSelectContacts = useCallback(
    (currentIndex: number) => {
      if (typeof lastSelectedContactIDIndex !== 'number' || lastSelectedContactIDIndex === currentIndex) return;

      const startIndex = Math.min(lastSelectedContactIDIndex, currentIndex);
      const endIndex = Math.max(lastSelectedContactIDIndex, currentIndex);

      const multiSelectedContactIDs = sortedContacts.slice(startIndex, endIndex + 1).map((c) => c.contactID);
      const isCurrentContactSelected = selectedContactsIDs.includes(sortedContacts[currentIndex]?.contactID ?? '');

      setSelectedContactsIDs((prevState) => {
        if (isCurrentContactSelected) {
          return prevState.filter((id) => !multiSelectedContactIDs.includes(id));
        } else {
          return [...prevState, ...multiSelectedContactIDs.filter((id) => !prevState.includes(id))];
        }
      });
    },
    [lastSelectedContactIDIndex, selectedContactsIDs, sortedContacts]
  );

  const onToggleSelectedContact = useCallback(
    (contactID: string, index: number, isShiftPressed: boolean) => {
      if (isShiftPressed && lastSelectedContactIDIndex !== null) {
        onShiftSelectContacts(index);
      } else {
        onSelectContact(contactID);
      }
      setLastSelectedContactIDIndex(index);
    },
    [lastSelectedContactIDIndex, onSelectContact, onShiftSelectContacts]
  );

  const onClearAllSelectedContacts = () => {
    setSelectedContactsIDs([]);
    setLastSelectedContactIDIndex(null);
  };

  const onSelectAllContacts = () => {
    setSelectedContactsIDs(contacts.map(({ contactID }) => contactID));
    setLastSelectedContactIDIndex(null);
  };

  const inputField = (
    <div>
      <InputField
        endAdornment={
          searchValue.length > 0 ? <IconText onClick={() => setSearchValue('')} startIcon={Icon.Close} /> : null
        }
        onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
          setSearchValue(evt.target.value);
        }}
        placeholder='Search by name or email'
        value={searchValue}
      />
    </div>
  );

  const goToContact = (nextContact: Contact, fromNextAfterDelete?: boolean) => {
    if (nextContact) {
      void updateContact(getContactWithoutTypename(nextContact), fromNextAfterDelete);
    }
    setShowProfileView(false);
    if (clearPopulateContactContent) {
      clearPopulateContactContent();
    }
  };

  const onNext = (contactID: string, fromNextAfterDelete?: boolean) => {
    const selectedIndex = sortedContacts.findIndex((contact) => contact.contactID === contactID);
    const nextContact = sortedContacts[selectedIndex + 1] || sortedContacts[0];
    goToContact(nextContact, fromNextAfterDelete);
  };

  const onNextNotDeletedContact = () => {
    const selectedIndex = sortedContacts.findIndex((contact) => !selectedContactsIDs.includes(contact.contactID));
    const nextContact = sortedContacts[selectedIndex];
    goToContact(nextContact, true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (hoverRowIndex === null) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setNavigatedByArrow(true);
          if ((hoverRowIndex || 0) < sortedContacts.length - 1) {
            setHoverRowIndex((prevIndex) => (prevIndex !== null ? prevIndex + 1 : 0));
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          setNavigatedByArrow(true);
          if ((hoverRowIndex || 0) > 0) {
            setHoverRowIndex((prevIndex) => (prevIndex !== null ? prevIndex - 1 : 0));
          }
          break;
        case 'Enter':
          if (isDatePickerOpen) {
            setIsDatePickerOpen(false);
            return;
          }
          if (hoverRowIndex !== null) {
            void updateContact(getContactWithoutTypename(sortedContacts[hoverRowIndex]));
          }
          break;
      }
    };

    const handleMouseMove = () => {
      setNavigatedByArrow(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
    };
  }, [sortedContacts]);

  // Function called setDisplayPicture data that takes in DisplayPictureData and updates pendingContact
  const setDisplayPictureData = (newDisplayPictureData: DisplayPictureData): void => {
    const uploadedNewPicture =
      newDisplayPictureData.profileCustomURI !== pendingContact.displayPictureData?.profileCustomURI;

    const contactWithUpdatedDisplayPicture = {
      ...pendingContact,
      displayPictureData: {
        profileAccentColor: newDisplayPictureData.profileAccentColor,
        profileCustomURI: newDisplayPictureData.profileCustomURI,
        profileIcon: newDisplayPictureData.profileIcon
      }
    };
    setIsEditing(true);
    setPendingContact(contactWithUpdatedDisplayPicture);

    // IMPORTANT: We need to save after a display picture is uploaded to avoid edge cases where the S3 path (which relies on email address) does not match
    if (uploadedNewPicture) void handleSave(contactWithUpdatedDisplayPicture);
  };

  const handleDelete = async () => {
    const enqueueDeleteErrorToast = () =>
      enqueueToast({ title: 'Failed to delete contact', body: 'Please try again later' });

    if (!selectedContact) {
      console.error('Failed to delete contact, no contact selected');
      enqueueDeleteErrorToast();
      return;
    }

    setIsDeleting(true);
    try {
      if (!!setDisplayPictureData) {
        // clear display picture data
        await setDisplayPictureData({
          profileAccentColor: undefined,
          profileCustomURI: undefined,
          profileIcon: undefined
        });
      }
      // remove anything pending
      setIsEditing(false);
      setSelectedContact(activeConfirmModalType.contact ?? selectedContact);
      setPendingContact(activeConfirmModalType.contact ?? selectedContact ?? createEmptyContact());
      setActiveConfirmModalType({ type: ContactProfileConfirmModalType.NONE, contact: undefined });
      await deleteContactMutation({
        variables: {
          request: {
            contactID: selectedContact.contactID
          }
        }
      });
    } catch (error) {
      console.error('Failed to delete contact', errors);
      enqueueDeleteErrorToast();
      return;
    }
    void refetch();
    setIsDeleting(false);
    enqueueToast({ title: 'Contact deleted', body: 'Contact deleted successfully' });
    setActiveConfirmModalType({ type: ContactProfileConfirmModalType.NONE, contact: undefined });
    onNext(selectedContact.contactID, true);
    onClearAllSelectedContacts();
  };

  const handleBulkDelete = async () => {
    const enqueueDeleteErrorToast = () =>
      enqueueToast({ title: 'Failed to delete contacts', body: 'Please try again later' });

    if (selectedContactsIDs.length === 0) {
      console.error('Failed to delete contact, no contact selected');
      enqueueDeleteErrorToast();
      return;
    }

    setIsBulkDeleting(true);

    const { errors } = await deleteContactsMutation({
      variables: {
        request: {
          contactIDs: selectedContactsIDs
        }
      }
    });

    if (errors) {
      console.error('Failed to delete contacts', errors);
      enqueueDeleteErrorToast();
      return;
    }

    void refetch();
    setIsBulkDeleting(false);
    enqueueToast({ title: 'Contacts deleted', body: 'Contacts deleted successfully' });
    onClearAllSelectedContacts();
    setShowDeleteContacts(false);
    onNextNotDeletedContact();
  };

  const handleAddButtonClick = () => {
    setSelectedContact(null);
    setPendingContact(createEmptyContact());
    if (isMobile || !showProfileViewBreakpoint) {
      setShowProfileView(true);
    }
  };

  /**
   * Returns true if contact is valid and can be saved
   * Enqueues error toast if not
   */
  const isValidContact = (): ErrorState => {
    const errors: ErrorState = {};

    if (isEmptyContact(pendingContact)) {
      errors.email = 'Unable to save';
    } else if (!!pendingContact.emailAddress && !isEmail(pendingContact.emailAddress)) {
      errors.email = 'Email address is invalid';
    }

    return errors;
  };

  const handleSave = async (contact: ContactWithoutTypename) => {
    const isValidResult = isValidContact();
    if (Object.keys(isValidResult).length > 0) {
      setErrors(isValidResult);
      return;
    }
    setIsSaving(true);
    const { firstName, lastName, emailAddress, displayPictureData, decryptedData, decryptedSessionKey } = contact;
    const formattedBirthday = decryptedData?.decryptedBirthday
      ? dayjs(decryptedData?.decryptedBirthday, dateFormat).format(DateInputFormats.YearMonthDay)
      : '';
    const contactSessionKey = !!decryptedSessionKey ? decryptedSessionKey : generateSymmetricKey();
    const contactEncryptedData = !!decryptedData
      ? encryptDatagramV2(
          EncryptedContactDataDatagram,
          {},
          {
            decryptedBirthday: formattedBirthday,
            decryptedNotes: decryptedData.decryptedNotes ?? '',
            decryptedPhoneNumbers: decryptedData.decryptedPhoneNumbers?.filter(({ value }) => !!value) ?? [],
            decryptedPhoneNumber: '',
            decryptedCompany: decryptedData.decryptedCompany ?? '',
            decryptedJobTitle: decryptedData.decryptedJobTitle ?? '',
            decryptedAddress: '',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            decryptedAddresses: decryptedData.decryptedAddresses?.filter(({ value }) => !!value) ?? [],
            decryptedNickname: decryptedData.decryptedNickname ?? '',
            decryptedURL: decryptedData.decryptedURL ?? ''
          },
          contactSessionKey
        )
      : null;
    const encryptedKey = contactEncryptedData
      ? stringEncryptAsymmetric(userData.privateUserData.privateKey || '', userData.publicKey, contactSessionKey)
      : null;

    const enqueueSaveErrorToast = () => enqueueToast({ title: 'Failed to save contact' });

    // Set values to null if they're empty or undefined
    // IMPORTANT: Undefined leads to no value being changed, so this MUST be null
    const newFirstName = !firstName ? null : firstName;
    const newLastName = !lastName ? null : lastName;
    const newDisplayPictureData = !displayPictureData ? null : displayPictureData;

    try {
      await createOrUpdateContact({
        variables: {
          request: {
            contactID: contact.contactID,
            emailAddress,
            firstName: newFirstName,
            lastName: newLastName,
            displayPictureData: newDisplayPictureData,
            encryptedContactData: contactEncryptedData?.encryptedData,
            encryptedSessionKey: encryptedKey,
            encryptedByKey: contactEncryptedData ? userData.publicKey.key : null
          }
        }
      });
      void refetch();
      setIsSaving(false);
      setIsEditing(false);
      setSelectedContact(contact);
      setPendingContact(contact);
      // clear populated content
      if (clearPopulateContactContent) {
        clearPopulateContactContent();
      }
    } catch (err) {
      console.error(err);
      enqueueSaveErrorToast();
      if (clearPopulateContactContent) {
        clearPopulateContactContent();
      }
    }
  };

  // if populateContactContent is passed in, then add a new contact automatically with its content passed into values
  useEffect(() => {
    if (populateContactContent) {
      setShowProfileView(true);
      void handleSave(newContact);
      setIsEditing(true);
    }
    return () => {
      if (clearPopulateContactContent) {
        clearPopulateContactContent();
      }
    };
  }, [populateContactContent]);

  const getEmptyText = () => {
    switch (true) {
      case !!error:
        return 'Failed to load contacts';
      case !!searchValue && !!contacts.length:
        return 'No contacts matching your search.';
      default:
        return 'No contacts yet.';
    }
  };

  const contactRowSection: UserListTableSection = {
    columnHeaders: ['CONTACT', 'ORGANIZATION'],
    rows: sortedContacts.map((contact, index) => {
      return (
        <ContactRowHeader
          key={`${contact?.contactID}-${contact?.emailAddress ?? ''}`}
          onMouseEnter={() => {
            if (!navigatedByArrow) {
              setHoverRowIndex(index);
            }
          }}
          onMouseLeave={() => {
            if (hoverRowIndex === index) {
              setHoverRowIndex(null);
            }
          }}
          ref={(ref) => (rowRefs.current[index] = ref)}
        >
          <ContactRow
            active={isEqual(getContactWithoutTypename(contact), selectedContact) && !isMobile}
            contact={contact}
            hover={index === hoverRowIndex && !isMobile}
            isLast={index === contacts.length - 1}
            key={`${contact?.contactID}-${contact?.emailAddress ?? ''}`}
            onClick={() => {
              setShowProfileView(true);
              void updateContact(getContactWithoutTypename(contact));
              if (!hoverRowIndex) {
                setHoverRowIndex(index);
              }
            }}
            onToggleSelectedContact={(isShiftKey: boolean) => {
              onToggleSelectedContact(contact?.contactID, index, isShiftKey);
            }}
            selectedContactsIDs={selectedContactsIDs}
          />
        </ContactRowHeader>
      );
    }),
    emptyText: getEmptyText()
  };

  const showContactProfileView = showProfileViewBreakpoint || showProfileView;

  return (
    <TableProfile>
      {((!showProfileViewBreakpoint && !showProfileView) || showProfileViewBreakpoint) && (
        <ContactUserListTable
          addButtonLabel='Add contact'
          header='Contacts'
          headerNumber={contacts.length}
          inputField={inputField}
          isAllContactsSelected={selectedContactsIDs.length === contacts.length}
          isBulkDeleting={isBulkDeleting}
          isSelectingContacts={selectedContactsIDs.length > 0}
          loading={loading}
          onAddButtonClick={handleAddButtonClick}
          onClearAllSelectedContacts={onClearAllSelectedContacts}
          onSelectAllContacts={onSelectAllContacts}
          openDeleteContactsConfirmation={() => {
            setShowDeleteContacts(true);
          }}
          sections={[contactRowSection]}
          showContactProfileView={showContactProfileView}
        />
      )}
      {showContactProfileView && (
        <ContactProfileView
          clearPopulateContactContent={clearPopulateContactContent}
          errors={errors}
          forceEdit={!!populateContactContent}
          handleCancelEditing={handleCancelEditing}
          handleSave={handleSave}
          isDatePickerOpen={isDatePickerOpen}
          isDeleting={isDeleting}
          isEditing={isEditing}
          isSaving={isSaving}
          isValidContact={isValidContact}
          onBack={() => handleCancelEditing(undefined, true)}
          pendingContact={pendingContact}
          selectedContact={selectedContact}
          setActiveConfirmModalType={setActiveConfirmModalType}
          setDisplayPictureData={setDisplayPictureData}
          setErrors={setErrors}
          setIsDatePickerOpen={setIsDatePickerOpen}
          setIsEditing={setIsEditing}
          setPendingContact={setPendingContact}
          setSelectedContact={setSelectedContact}
          singleView={!showProfileViewBreakpoint}
        />
      )}
      <ContactConfirmModal
        activeConfirmModalType={activeConfirmModalType}
        handleDelete={handleDelete}
        isNewContact={isNewContact}
        onBack={onBackReturn}
        selectedContact={selectedContact}
        setActiveConfirmModalType={setActiveConfirmModalType}
        setIsEditing={setIsEditing}
        setPendingContact={setPendingContact}
        setSelectedContact={setSelectedContact}
      />
      <ConfirmModal
        confirmName='Delete'
        description='All contact information will be permanently deleted.'
        destructive
        onClose={() => {
          setShowDeleteContacts(false);
        }}
        onConfirm={handleBulkDelete}
        open={showDeleteContacts}
        title={`Delete ${selectedContactsIDs.length} contact(s)?`}
      />
    </TableProfile>
  );
};

export default ContactsTable;
