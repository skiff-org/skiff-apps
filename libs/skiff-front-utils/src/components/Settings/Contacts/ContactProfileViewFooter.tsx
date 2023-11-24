import { Button, Dropdown, DropdownItem, FilledVariant, Icon, IconText, Type } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import Drawer from '../../Drawer';

import { ContactProfileConfirmModalType, ContactWithoutTypename, FieldGroup } from './Contacts.types';

const FooterGroup = styled.div`
  display: flex;
  padding: 16px;
  bottom: 0px;
  width: 100%;
  flex-direction: ${isMobile ? 'column' : 'row'};
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
`;

const RightButtonGroup = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  width: ${isMobile ? '100%' : ''};
  gap: 8px;
  flex-direction: ${isMobile ? 'column' : 'row'};
`;

interface ContactUserProfileViewFooterProps {
  onBack: () => void;
  showBackButton: boolean;
  handleCancelEditing: (contact?: ContactWithoutTypename, goBack?: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  isEditing: boolean;
  handleSave: () => void;
  isSaving: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  optionalFields: FieldGroup[];
  setActiveConfirmModalType: (activeModal: {
    type: ContactProfileConfirmModalType;
    contact?: ContactWithoutTypename;
  }) => void;
  showDelete: boolean;
  activeOptionalFields: FieldGroup[];
  setActiveOptionalFieldGroups: (activeOptionalFieldGroups: FieldGroup[]) => void;
}

const ContactUserProfileViewFooter: React.FC<ContactUserProfileViewFooterProps> = ({
  onBack,
  setIsEditing,
  handleSave,
  isSaving,
  isEditing,
  handleCancelEditing,
  setActiveConfirmModalType,
  showBackButton,
  optionalFields,
  scrollContainerRef,
  showDelete,
  activeOptionalFields,
  setActiveOptionalFieldGroups
}) => {
  const [isAddFieldDropdownOpen, setIsAddFieldDropdownOpen] = useState(false);
  const openAddFieldDropdown = () => setIsAddFieldDropdownOpen(true);
  const addFieldRef = useRef<HTMLDivElement>(null);

  function handleAddField(fieldGroup: FieldGroup) {
    setActiveOptionalFieldGroups([...activeOptionalFields, fieldGroup]);
    setIsEditing(true);

    if (scrollContainerRef.current) {
      // scroll to bottom
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current?.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }

  const renderOptions = () => {
    return (
      <>
        {optionalFields.map((fieldGroup) => (
          <DropdownItem
            disabled={activeOptionalFields.includes(fieldGroup)}
            label={fieldGroup.label}
            onClick={() => {
              setIsAddFieldDropdownOpen(false);
              handleAddField(fieldGroup);
            }}
            value={fieldGroup.label}
          />
        ))}
      </>
    );
  };

  return (
    <FooterGroup>
      {isEditing && isMobile && (
        <>
          <Button fullWidth key='contact-save-button' loading={isSaving} onClick={handleSave}>
            Save
          </Button>
          <Button fullWidth onClick={() => handleCancelEditing()} type={Type.SECONDARY}>
            Cancel
          </Button>
        </>
      )}
      {!isEditing && isMobile && (
        <Button fullWidth onClick={() => setIsEditing(true)} type={Type.SECONDARY}>
          Edit
        </Button>
      )}
      {showBackButton && !isMobile && (
        <IconText
          color={Type.SECONDARY}
          key='contact-back-button'
          label='Back'
          onClick={onBack}
          variant={FilledVariant.FILLED}
        />
      )}
      {showBackButton && isMobile && !isEditing && (
        <Button fullWidth key='contact-back-button' onClick={onBack} type={Type.SECONDARY}>
          Back
        </Button>
      )}
      {!isMobile && (
        <IconText
          color={Type.SECONDARY}
          disabled={optionalFields.length === activeOptionalFields.length}
          key='contact-add-field-button'
          onClick={openAddFieldDropdown}
          ref={addFieldRef}
          startIcon={Icon.Plus}
          tooltip='Add field'
          variant={FilledVariant.FILLED}
        />
      )}
      {isMobile && optionalFields.length !== activeOptionalFields.length && (
        <Button fullWidth key='contact-add-field-button' onClick={openAddFieldDropdown} type={Type.SECONDARY}>
          Add field
        </Button>
      )}
      {!isMobile && (
        <Dropdown
          buttonRef={addFieldRef}
          gapFromAnchor={8}
          portal
          setShowDropdown={setIsAddFieldDropdownOpen}
          showDropdown={isAddFieldDropdownOpen}
          width={175}
        >
          {renderOptions()}
        </Dropdown>
      )}
      {isMobile && (
        <Drawer hideDrawer={() => setIsAddFieldDropdownOpen(false)} show={isAddFieldDropdownOpen}>
          {renderOptions()}
        </Drawer>
      )}
      {showDelete && !isMobile && (
        <IconText
          color={Type.DESTRUCTIVE}
          key='contact-delete-button'
          onClick={() => setActiveConfirmModalType({ type: ContactProfileConfirmModalType.DELETE, contact: undefined })}
          startIcon={Icon.Trash}
          variant={FilledVariant.FILLED}
        />
      )}
      {showDelete && isMobile && (
        <Button
          fullWidth
          key='contact-delete-button'
          onClick={() => setActiveConfirmModalType({ type: ContactProfileConfirmModalType.DELETE, contact: undefined })}
          type={Type.DESTRUCTIVE}
        >
          Delete
        </Button>
      )}
      <RightButtonGroup>
        {!isEditing && !isMobile && (
          <IconText
            color={Type.SECONDARY}
            label='Edit'
            onClick={() => setIsEditing(true)}
            variant={FilledVariant.FILLED}
          />
        )}
        {isEditing && !isMobile && (
          <>
            <IconText
              color={Type.SECONDARY}
              label='Cancel'
              onClick={() => handleCancelEditing()}
              variant={FilledVariant.FILLED}
            />
            <Button compact key='contact-save-button' loading={isSaving} onClick={handleSave}>
              Save
            </Button>
          </>
        )}
      </RightButtonGroup>
    </FooterGroup>
  );
};

export default ContactUserProfileViewFooter;
