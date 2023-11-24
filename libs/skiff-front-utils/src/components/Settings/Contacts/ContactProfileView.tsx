import { Dropdown, InputField, ThemeMode } from 'nightwatch-ui';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useCreateUploadContactAvatarLinkMutation } from 'skiff-front-graphql';
import { DisplayPictureData, Maybe, ValueLabel } from 'skiff-graphql';
import { PgpFlag, StorageTypes } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { DateInputFormats } from '../../../constants';
import { useDisplayPictureDataFromAddress, useGetFF, useToast, useUserPreference } from '../../../hooks';
import { isOrgMemberContact } from '../../../hooks/useGetAllContactsWithOrgMembers';
import { copyToClipboardWebAndMobile, dayjs } from '../../../utils';
import { DATE_PICKER_DROPDOWN_CLASSNAME } from '../../DateField';
import DatePicker from '../../DatePicker';
import EditProfile from '../../EditProfile';

import PgpSection from '../../PgpKey/PgpSection';
import ContactProfileViewFooter from './ContactProfileViewFooter';
import { renderFieldGroup } from './Contacts.renderingUtils';
import {
  ContactProfileConfirmModalType,
  ContactWithoutTypename,
  ErrorState,
  FieldGroup,
  FieldType
} from './Contacts.types';
import {
  getContactDisplayNameAndSubtitle,
  getContactDisplayPictureData,
  getValueFromContactOrDecryptedData,
  isEmptyContact,
  isKeyOfDecryptedContactData
} from './Contacts.utils';
import { optionalFields, staticFields } from './Fields.constant';
import { getFormattedBirthdate } from './contactFormatUtils';

const InfoTableRow = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  flex-direction: column;
  box-sizing: border-box;
`;

const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
`;

const ProfileContainer = styled.div<{ $singleView?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const ListItemContainer = styled.div`
  padding: 16px;
  padding-top: 32px;
  ${isMobile &&
  css`
    padding: 32px 0px;
  `}
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProfileFooter = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
`;

const PgpSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

interface ContactProfileViewProps {
  selectedContact: ContactWithoutTypename | undefined | null;
  onBack: () => void;
  singleView: boolean;
  forceEdit: boolean;
  setIsDatePickerOpen: (isOpen: boolean) => void;
  setPendingContact: (contact: ContactWithoutTypename) => void;
  setSelectedContact: (contact: ContactWithoutTypename | undefined | null) => void;
  pendingContact: ContactWithoutTypename;
  isDatePickerOpen: boolean;
  isDeleting: boolean;
  handleCancelEditing: (contact?: ContactWithoutTypename, goBack?: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  isEditing: boolean;
  handleSave: (contact: ContactWithoutTypename) => void | Promise<void>;
  isSaving: boolean;
  errors: ErrorState;
  setDisplayPictureData: (newDisplayPictureData: DisplayPictureData) => void;
  isValidContact: () => ErrorState;
  setErrors: (errors: ErrorState) => void;
  setActiveConfirmModalType: (activeModal: {
    type: ContactProfileConfirmModalType;
    contact?: ContactWithoutTypename;
  }) => void;
  clearPopulateContactContent?: () => void;
}

function isDateFormatYYYYMMDD(dateStr: Maybe<string> | undefined) {
  if (!dateStr) return false;
  return dateStr === dayjs(dateStr, DateInputFormats.YearMonthDay).format(DateInputFormats.YearMonthDay);
}

const ContactProfileView: React.FC<ContactProfileViewProps> = ({
  selectedContact,
  setIsDatePickerOpen,
  isDatePickerOpen,
  setPendingContact,
  pendingContact,
  onBack,
  setIsEditing,
  handleSave,
  errors,
  isValidContact,
  isSaving,
  setErrors,
  isEditing,
  handleCancelEditing,
  setActiveConfirmModalType,
  singleView,
  forceEdit,
  setDisplayPictureData
}) => {
  // If creating a new contact, go straight into edit mode
  const isNewContact = !selectedContact || forceEdit;
  const hasPgpFlag = useGetFF<PgpFlag>('pgp');

  // Graphql
  const [createUploadContactAvatarLinkMutation] = useCreateUploadContactAvatarLinkMutation();

  const skiffUserDisplayPictureData = useDisplayPictureDataFromAddress(pendingContact.emailAddress ?? undefined);
  const displayPictureData = getContactDisplayPictureData(pendingContact);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { emailAddress, firstName, decryptedData } = pendingContact;
  const [dateFormat] = useUserPreference(StorageTypes.DATE_FORMAT);

  // birthdayValue is the displayed value in the input field
  const birthdayDefaultValue = decryptedData?.decryptedBirthday
    ? dayjs(decryptedData.decryptedBirthday).format(dateFormat)
    : '';
  const [birthdayValue, setBirthdayValue] = useState<string | undefined>(birthdayDefaultValue);
  const [emailErrors, setEmailErrors] = useState<ErrorState>({});
  const [activeFields, setActiveFields] = useState<FieldGroup[]>([]);

  useEffect(() => {
    // if switching to contact with saved birthday value, update birthday value and format based
    // on user setting
    if (isDateFormatYYYYMMDD(decryptedData?.decryptedBirthday) && decryptedData?.decryptedBirthday) {
      const newVal = dayjs(decryptedData.decryptedBirthday).format(dateFormat);
      setBirthdayValue(newVal);
      // if date is not in YYYY-MM-DD format (e.g. before save finishes or just updating date format)
      // or if switching to contact without birthday value set
      // don't call format twice
    } else {
      setBirthdayValue(decryptedData?.decryptedBirthday || '');
    }
  }, [decryptedData?.decryptedBirthday, dateFormat]);

  useEffect(() => {
    if (isEditing) return;
    const newActiveFields = optionalFields.filter((fieldGroup) => {
      const item = fieldGroup.items[0];
      const value = getValueFromContactOrDecryptedData(item.key, pendingContact);
      // Checking for non empty strings and non empty arrays
      return (
        (value && typeof value === 'string' && value !== '') ||
        (Array.isArray(value) && value.filter(({ value: inputValue }) => !!inputValue).length !== 0)
      );
    });
    setActiveFields(newActiveFields);
  }, [isEditing, pendingContact]);

  const fields = [...staticFields, ...optionalFields];

  // Custom hooks
  const { enqueueToast } = useToast();

  const { displayName } = getContactDisplayNameAndSubtitle(pendingContact);

  const isOrgMember: boolean = !!selectedContact && isOrgMemberContact(selectedContact);

  const onCopy = (description: string, value: Maybe<string> | undefined) => {
    if (!value) {
      return;
    }
    copyToClipboardWebAndMobile(value);
    enqueueToast({
      title: `${description} copied`,
      body: `${value} is now in your clipboard.`
    });
  };

  useEffect(() => {
    setErrors({});
  }, [pendingContact]);

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

    if (Object.keys(isValidContact()).length > 0) {
      return;
    }

    // Upload file and return
    const { data: contactAvatarLink, errors: contactErrors } = await createUploadContactAvatarLinkMutation({
      variables: {
        request: {
          contactID: pendingContact.contactID
        }
      }
    });

    if (contactErrors || !contactAvatarLink?.createUploadContactAvatarLink) {
      console.error('Error creating upload contact avatar link', contactErrors);
      return;
    }

    return contactAvatarLink?.createUploadContactAvatarLink;
  };

  // Only show delete for an existing non-org contact while editing
  const showDelete = !isNewContact && !isOrgMember && isEditing;

  const refs = fields.reduce((acc, fieldConfig) => {
    fieldConfig.items.forEach((item) => {
      acc[item.key] =
        item.type === FieldType.textarea
          ? React.useRef<HTMLTextAreaElement>(null)
          : React.useRef<HTMLInputElement>(null);
    });
    return acc;
  }, {} as { [key: string]: React.RefObject<HTMLInputElement | HTMLTextAreaElement> });

  useEffect(() => {
    if (isEmptyContact(pendingContact)) {
      const firstNameRef = refs.firstName;
      firstNameRef.current?.focus();
    }
  }, [firstName]);

  useEffect(() => {
    if (isValidContact) {
      setEmailErrors((isValidContact().email as ErrorState) || {});
    }
  }, [emailAddress]);

  function handleOnChange(key: string, value: string | ValueLabel[]) {
    setIsEditing(true);
    const isDecryptedDataKey = isKeyOfDecryptedContactData(key);
    if (isDecryptedDataKey) {
      const newContact = { ...pendingContact, decryptedData: { ...decryptedData, [key]: value } };
      setPendingContact(newContact);
    } else {
      const newContact = { ...pendingContact, [key]: value };
      setPendingContact(newContact);
    }
  }

  const birthdayRow = (
    <>
      <InputField
        error={errors?.birthday}
        innerRef={refs.decryptedBirthday as React.RefObject<HTMLInputElement>}
        key='birthday-value'
        onBlur={() => {
          const dateInUserFormat = dayjs(getFormattedBirthdate(birthdayValue || null, dateFormat)).format(dateFormat);
          setPendingContact({
            ...pendingContact,
            decryptedData: {
              ...decryptedData,
              decryptedBirthday: dateInUserFormat
            }
          });
        }}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => {
          setIsEditing(true);
          setIsDatePickerOpen(true);
          setBirthdayValue(evt.target.value);
        }}
        onFocus={() => {
          setIsDatePickerOpen(true);
          setIsEditing(true);
        }}
        onKeyPress={(evt: React.KeyboardEvent<HTMLInputElement>) => {
          if (evt.key === 'Enter') {
            evt.preventDefault();
            setIsDatePickerOpen(false);
            const dateInUserFormat = !!birthdayValue
              ? dayjs(getFormattedBirthdate(birthdayValue ?? '', dateFormat)).format(dateFormat)
              : '';
            const notesRef = refs.decryptedNotes;
            notesRef.current?.focus();
            setPendingContact({
              ...pendingContact,
              decryptedData: {
                ...decryptedData,
                decryptedBirthday: dateInUserFormat
              }
            });
          }
        }}
        placeholder={dateFormat}
        value={birthdayValue}
      />
      <Dropdown
        buttonRef={refs.decryptedBirthday as React.RefObject<HTMLInputElement>}
        className={DATE_PICKER_DROPDOWN_CLASSNAME}
        gapFromAnchor={24}
        portal
        setShowDropdown={setIsDatePickerOpen}
        showDropdown={isDatePickerOpen}
      >
        <DatePicker
          forceTheme={ThemeMode.DARK}
          onSelectDate={(newDate: Date | unknown) => {
            setIsEditing(true);
            if (newDate instanceof Date) {
              const formattedDate = dayjs(newDate).format(dateFormat);
              setPendingContact({
                ...pendingContact,
                decryptedData: {
                  ...decryptedData,
                  decryptedBirthday: formattedDate
                }
              });
            }
            setIsDatePickerOpen(false);
          }}
          selectedDate={getFormattedBirthdate(birthdayValue || null, dateFormat)}
        />
      </Dropdown>
    </>
  );
  const pgpRow =
    hasPgpFlag && emailAddress ? (
      <PgpSectionContainer>
        <PgpSection address={emailAddress} />
      </PgpSectionContainer>
    ) : null;

  return (
    <ProfileFooter>
      <ProfileContainer $singleView={singleView} ref={scrollContainerRef}>
        <EditProfile
          createUploadLink={uploadContactAvatarPicture}
          displayName={displayName}
          displayPictureData={displayPictureData || skiffUserDisplayPictureData || undefined}
          hideUpload={Object.keys(emailErrors).length > 0}
          padding={isMobile ? 0 : 8}
          setDisplayPictureData={setDisplayPictureData}
        />
        <ListItemContainer>
          <ListItem>
            <InfoTableRow>
              {staticFields.map((fieldConfig, fieldIndex) =>
                renderFieldGroup(
                  fieldConfig,
                  pendingContact,
                  refs,
                  onCopy,
                  handleOnChange,
                  birthdayRow,
                  pgpRow,
                  staticFields,
                  fieldIndex,
                  errors,
                  false
                )
              )}
              {activeFields.map((fieldConfig, fieldIndex) =>
                renderFieldGroup(
                  fieldConfig,
                  pendingContact,
                  refs,
                  onCopy,
                  handleOnChange,
                  birthdayRow,
                  pgpRow,
                  activeFields,
                  fieldIndex,
                  errors,
                  isEditing
                )
              )}
            </InfoTableRow>
          </ListItem>
        </ListItemContainer>
      </ProfileContainer>
      <ContactProfileViewFooter
        activeOptionalFields={activeFields}
        handleCancelEditing={handleCancelEditing}
        handleSave={() => void handleSave(pendingContact)}
        isEditing={isEditing}
        isSaving={isSaving}
        onBack={onBack}
        optionalFields={optionalFields}
        scrollContainerRef={scrollContainerRef}
        setActiveConfirmModalType={setActiveConfirmModalType}
        setActiveOptionalFieldGroups={(newGroups) => {
          setActiveFields(newGroups);
        }}
        setIsEditing={setIsEditing}
        showBackButton={singleView}
        showDelete={showDelete}
      />
    </ProfileFooter>
  );
};

export default ContactProfileView;
