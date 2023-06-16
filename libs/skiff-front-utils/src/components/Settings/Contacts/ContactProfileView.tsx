import {
  Button,
  ButtonComponent,
  ButtonGroupItem,
  ButtonGroupProps,
  FilledVariant,
  Icon,
  IconButton,
  Icons,
  Type
} from 'nightwatch-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useCreateUploadContactAvatarLinkMutation, useDeleteContactMutation } from 'skiff-front-graphql';
import { Contact, DisplayPictureData, DisplayPictureDataSkemail, Maybe } from 'skiff-graphql';
import { OmitStrict } from 'skiff-utils';
import isEmail from 'validator/lib/isEmail';

import { useToast } from '../../../hooks';
import { isOrgMemberContact, OrgMemberContact } from '../../../hooks/useGetAllContactsWithOrgMembers';
import { copyToClipboardWebAndMobile } from '../../../utils';
import { ConfirmModal } from '../../modals';
import { ConfirmModalProps } from '../../modals/ConfirmModal/ConfirmModal';
import UserProfileView, { UserProfileInfoRow } from '../shared/UserProfileView';

import { getContactDisplayNameAndSubtitle, getContactDisplayPictureData } from './Contacts.utils';

const contactIsUnchanged = (existingContact: Contact, pendingContact: Contact): boolean => {
  const { emailAddress, firstName, lastName, displayPictureData } = existingContact;
  const {
    emailAddress: pendingEmailAddress,
    firstName: pendingFirstName,
    lastName: pendingLastName,
    displayPictureData: pendingDisplayPictureData
  } = pendingContact;

  return (
    emailAddress === pendingEmailAddress &&
    firstName === pendingFirstName &&
    lastName === pendingLastName &&
    displayPictureData === pendingDisplayPictureData
  );
};

type DisplayPictureDataSkemailWithoutTypename = OmitStrict<DisplayPictureDataSkemail, '__typename'>;

// Important: Need contact without typename for sending a safe payload back on create/save
export type ContactWithoutTypename = OmitStrict<Contact | OrgMemberContact, '__typename' | 'displayPictureData'> & {
  // Don't use displayPictureData?, that makes it compatible with Contact. Must use explicit undefined
  displayPictureData: DisplayPictureDataSkemailWithoutTypename | null | undefined;
};

export const getContactWithoutTypename = (contact: Contact | OrgMemberContact): ContactWithoutTypename => ({
  emailAddress: contact.emailAddress,
  firstName: contact.firstName,
  lastName: contact.lastName,
  // Preserve null or undefined
  displayPictureData: !contact.displayPictureData
    ? contact.displayPictureData
    : {
        profileAccentColor: contact.displayPictureData.profileAccentColor,
        profileCustomURI: contact.displayPictureData.profileCustomURI,
        profileIcon: contact.displayPictureData.profileIcon
      },
  isOrgMember: isOrgMemberContact(contact) ? contact.isOrgMember : undefined
});

interface ContactProfileViewProps {
  selectedContact: ContactWithoutTypename | undefined;
  orgName: string;
  onSave: (contact: ContactWithoutTypename) => Promise<void>;
  onBack: () => void;
  refetch: () => void;
}

const EMPTY_CONTACT = {
  emailAddress: '',
  firstName: '',
  lastName: '',
  displayPictureData: undefined
};

enum ContactProfileConfirmModalType {
  NONE,
  DISCARD_CHANGES,
  DISCARD_CHANGES_AND_GO_BACK,
  DELETE
}

const ContactProfileView: React.FC<ContactProfileViewProps> = ({
  selectedContact,
  orgName,
  onSave,
  onBack,
  refetch
}) => {
  // State
  const [pendingContact, setPendingContact] = useState<ContactWithoutTypename>(selectedContact ?? EMPTY_CONTACT);
  const [activeConfirmModalType, setActiveConfirmModalType] = useState<ContactProfileConfirmModalType>(
    ContactProfileConfirmModalType.NONE
  );

  // If creating a new contact, go straight into edit mode
  const isNewContact = !selectedContact;
  const [isEditing, setIsEditing] = React.useState<boolean>(isNewContact);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  // Graphql
  const [deleteContactMutation] = useDeleteContactMutation();
  const [createUploadContactAvatarLinkMutation] = useCreateUploadContactAvatarLinkMutation();

  // Custom hooks
  const { enqueueToast } = useToast();

  const { emailAddress, firstName, lastName } = pendingContact;

  const { displayName, subtitle } = getContactDisplayNameAndSubtitle(pendingContact);
  const displayPictureData = getContactDisplayPictureData(pendingContact);

  const isOrgMember: boolean = !!selectedContact && isOrgMemberContact(selectedContact);

  /**
   * Returns true if contact is valid and can be saved
   * Enqueues error toast if not
   */
  const isValidContact = (): boolean => {
    if (!pendingContact.emailAddress || !isEmail(pendingContact.emailAddress)) {
      enqueueToast({ title: 'Email address is required' });
      return false;
    }

    return true;
  };

  // Accept contact as arg to avoid race condition with state
  const handleSaveClick = async (newContact: ContactWithoutTypename) => {
    if (selectedContact && contactIsUnchanged(selectedContact, newContact)) {
      setIsEditing(false);
      return;
    }

    if (!isValidContact) {
      return;
    }

    setIsSaving(true);
    await onSave(newContact);
    setIsSaving(false);
    setIsEditing(false);
  };

  const renderCopyButton = (description: string, value: Maybe<string> | undefined) =>
    !isEditing &&
    !!value && (
      <IconButton
        icon={<Icons color='disabled' icon={Icon.Copy} />}
        onClick={() => {
          copyToClipboardWebAndMobile(value);
          enqueueToast({
            title: `${description} copied`,
            body: `${value} is now in your clipboard.`
          });
        }}
        variant={FilledVariant.UNFILLED}
      />
    );

  // Note: If we add more rows and it starts to clutter the component, break these out into a const file
  const firstNameRow: UserProfileInfoRow = {
    columns: [
      // Description (key) column
      {
        value: 'First name',
        color: 'secondary',
        key: 'first-name-header'
      },
      //   Value column
      {
        value: firstName ?? '',
        setValue: (value: string) => {
          setPendingContact({ ...pendingContact, firstName: value });
        },
        key: 'first-name-value',
        autoFocus: isNewContact
      }
    ],
    key: 'first-name-row',
    actions: renderCopyButton('First name', firstName)
  };

  const lastNameRow: UserProfileInfoRow = {
    columns: [
      {
        value: 'Last name',
        color: 'secondary',
        key: 'last-name-header'
      },
      {
        value: lastName ?? '',
        setValue: (value: string) => {
          setPendingContact({ ...pendingContact, lastName: value });
        },
        key: 'last-name-value'
      }
    ],
    key: 'last-name-row',
    actions: renderCopyButton('Last name', lastName)
  };

  const emailRow: UserProfileInfoRow = {
    columns: [
      {
        value: 'Email',
        color: 'secondary',
        key: 'email-header'
      },
      {
        value: emailAddress ?? '',
        setValue: (value: string) => {
          setPendingContact({ ...pendingContact, emailAddress: value });
        },
        onEnter: () => {
          if (!!emailAddress) {
            void handleSaveClick(pendingContact);
          }
        },
        key: 'email-value'
      }
    ],
    key: 'email-row',
    actions: renderCopyButton('Email address', emailAddress)
  };

  const infoRows: UserProfileInfoRow[] = [firstNameRow, lastNameRow, emailRow];

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

    setPendingContact(contactWithUpdatedDisplayPicture);

    // IMPORTANT: We need to save after a display picture is uploaded to avoid edge cases where the S3 path (which relies on email address) does not match
    if (uploadedNewPicture) void handleSaveClick(contactWithUpdatedDisplayPicture);
  };

  /**
   * This function gets passed down to EditProfile, and is used to upload the image and return the new link
   *
   * IMPORTANT: We need to save after a display picture is uploaded to avoid edge cases where the S3 path (which relies on email address) does not match.
   * Saving will be handled above in the setDisplayPictureData function
   *
   * Because of this, we should ONLY upload the file if we have performed validation that we can save.
   */
  const uploadContactAvatarPicture = async () => {
    // Perform validation that the contact is ready to be saved
    if (!isValidContact()) {
      return;
    }

    // Upload file and return
    const { data: contactAvatarLink, errors: contactErrors } = await createUploadContactAvatarLinkMutation({
      variables: {
        request: {
          contactEmail: pendingContact.emailAddress
        }
      }
    });

    if (contactErrors || !contactAvatarLink?.createUploadContactAvatarLink) {
      console.error('Error creating upload contact avatar link', contactErrors);
      return;
    }

    return contactAvatarLink?.createUploadContactAvatarLink;
  };

  const handleCancelEditing = (goBack?: boolean) => {
    const isDiscardingChanges =
      (isNewContact && pendingContact !== EMPTY_CONTACT) ||
      (selectedContact && !contactIsUnchanged(selectedContact, pendingContact));
    const shouldGoBack = goBack || isNewContact;

    // If user has inputted something, confirm they want to discard
    if (isDiscardingChanges) {
      const confirmModalType = shouldGoBack
        ? ContactProfileConfirmModalType.DISCARD_CHANGES_AND_GO_BACK
        : ContactProfileConfirmModalType.DISCARD_CHANGES;
      setActiveConfirmModalType(confirmModalType);
      return;
    }

    setIsEditing(false);

    // Either revert to original contact, or clear all fields
    setPendingContact(selectedContact ?? EMPTY_CONTACT);

    if (shouldGoBack) onBack();
    return;
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

    const { errors } = await deleteContactMutation({
      variables: {
        request: {
          emailAddress: selectedContact.emailAddress
        }
      }
    });

    if (errors) {
      console.error('Failed to delete contact', errors);
      enqueueDeleteErrorToast();
      return;
    }

    void refetch();
    setIsDeleting(false);
    enqueueToast({ title: 'Contact deleted', body: 'Contact deleted successfully' });
    onBack();
  };

  const getConfirmModalProps = (): ConfirmModalProps => {
    const closeConfirmModal = () => setActiveConfirmModalType(ContactProfileConfirmModalType.NONE);
    let confirmModalProps: ConfirmModalProps;

    switch (activeConfirmModalType) {
      case ContactProfileConfirmModalType.DISCARD_CHANGES:
      case ContactProfileConfirmModalType.DISCARD_CHANGES_AND_GO_BACK:
        confirmModalProps = {
          title: isNewContact ? 'Discard new contact?' : 'Discard changes?',
          description: `${
            isNewContact ? 'All information for this new contact' : 'All changes to this contact since the last save'
          } will be discarded.`,
          confirmName: 'Discard',
          destructive: true,
          onConfirm: () => {
            setIsEditing(false);
            setPendingContact(selectedContact ?? EMPTY_CONTACT);
            setActiveConfirmModalType(ContactProfileConfirmModalType.NONE);
          },
          onClose: closeConfirmModal,
          open: true
        };
        break;

      case ContactProfileConfirmModalType.DELETE:
        confirmModalProps = {
          title: 'Delete contact?',
          description: 'Deleting a contact is permanent and all contact information will be lost.',
          confirmName: 'Delete',
          destructive: true,
          onConfirm: handleDelete,
          onClose: closeConfirmModal,
          open: true
        };
        break;

      case ContactProfileConfirmModalType.NONE:
      default:
        confirmModalProps = {
          open: false,
          confirmName: '',
          onClose: () => {},
          onConfirm: () => {},
          title: ''
        };
    }

    if (activeConfirmModalType === ContactProfileConfirmModalType.DISCARD_CHANGES_AND_GO_BACK) {
      confirmModalProps = {
        ...confirmModalProps,
        onConfirm: onBack
      };
    }

    return confirmModalProps;
  };

  const getSubtitle = (): string | undefined => {
    switch (true) {
      case isMobile:
        return undefined;
      case isOrgMember:
        return `in ${orgName}`;
      default:
        return subtitle;
    }
  };

  // Only show delete for an existing non-org contact while editing
  const showDelete = isEditing && !isNewContact && !isOrgMember;

  const footerButton: ButtonComponent | undefined = showDelete ? (
    <Button
      floatRight
      key='contact-delete-button'
      loading={isDeleting}
      onClick={() => setActiveConfirmModalType(ContactProfileConfirmModalType.DELETE)}
      type={Type.DESTRUCTIVE}
    >
      Delete
    </Button>
  ) : undefined;

  const headerButtons: ButtonComponent | ButtonGroupProps['children'] = isEditing ? (
    [
      <ButtonGroupItem
        key='contact-save-button'
        label='Save'
        loading={isSaving}
        onClick={() => handleSaveClick(pendingContact)}
      />,
      <ButtonGroupItem key='contact-cancel-button' label='Cancel' onClick={() => handleCancelEditing()} />
    ]
  ) : (
    <Button onClick={() => setIsEditing(true)} type={Type.SECONDARY}>
      Edit
    </Button>
  );

  return (
    <>
      <UserProfileView
        createUploadLink={uploadContactAvatarPicture}
        displayName={displayName}
        displayPictureData={displayPictureData}
        editModeProps={{
          isEditing,
          setIsEditing
        }}
        footerButtons={footerButton}
        headerButtons={headerButtons}
        hideDisplayName={isMobile}
        onBackClick={() => (isEditing ? handleCancelEditing(true) : onBack())}
        setDisplayPictureData={isEditing ? setDisplayPictureData : undefined}
        subtitle={getSubtitle()}
        userProfileInfoRows={infoRows}
      />
      <ConfirmModal {...getConfirmModalProps()} />
    </>
  );
};

export default ContactProfileView;
