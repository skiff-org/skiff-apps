import React from 'react';

import { ConfirmModal } from '../../modals';
import { ConfirmModalProps } from '../../modals/ConfirmModal/ConfirmModal';

import { ContactProfileConfirmModalType, ContactWithoutTypename } from './Contacts.types';
import { createEmptyContact } from './Contacts.utils';

interface ContactConfirmModalProps {
  selectedContact: ContactWithoutTypename | undefined | null;
  isNewContact: boolean;
  setIsEditing: (isEditing: boolean) => void;
  setPendingContact: (contact: ContactWithoutTypename) => void;
  activeConfirmModalType: { type: ContactProfileConfirmModalType; contact?: ContactWithoutTypename };
  setSelectedContact: (contact: ContactWithoutTypename | undefined | null) => void;
  handleDelete: () => void | Promise<void>;
  setActiveConfirmModalType: (activeModal: {
    type: ContactProfileConfirmModalType;
    contact?: ContactWithoutTypename;
  }) => void;
  onBack: () => void;
}

const ContactConfirmModal: React.FC<ContactConfirmModalProps> = ({
  activeConfirmModalType,
  isNewContact,
  selectedContact,
  setIsEditing,
  setPendingContact,
  setActiveConfirmModalType,
  handleDelete,
  setSelectedContact,
  onBack
}) => {
  const getConfirmModalProps = (): ConfirmModalProps => {
    const closeConfirmModal = () => {
      setIsEditing(true);
      setActiveConfirmModalType({ type: ContactProfileConfirmModalType.NONE, contact: undefined });
    };
    let confirmModalProps: ConfirmModalProps;

    switch (activeConfirmModalType.type) {
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
            setSelectedContact(activeConfirmModalType.contact ?? selectedContact);
            setPendingContact(activeConfirmModalType.contact ?? selectedContact ?? createEmptyContact());
            setActiveConfirmModalType({ type: ContactProfileConfirmModalType.NONE, contact: undefined });
            if (activeConfirmModalType.type === ContactProfileConfirmModalType.DISCARD_CHANGES_AND_GO_BACK) {
              onBack();
            }
          },
          onClose: closeConfirmModal,
          open: true
        };
        break;
      case ContactProfileConfirmModalType.DELETE:
        confirmModalProps = {
          title: 'Delete contact?',
          description: 'All contact information will be permanently deleted.',
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

    return confirmModalProps;
  };

  return <ConfirmModal {...getConfirmModalProps()} />;
};

export default ContactConfirmModal;
