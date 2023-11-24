import isEqual from 'lodash/isEqual';
import { Contact, DecryptedContactData, DisplayPictureData, Maybe, ValueLabel } from 'skiff-graphql';
import { v4 } from 'uuid';

import { isOrgMemberContact } from '../../../hooks';
import { OrgMemberContact } from '../../../hooks/useGetAllContactsWithOrgMembers';
import { AddressObjectWithDisplayPicture } from '../../../types';
import { getInitialDecryptedMultipleFieldsValue } from '../../../utils/contactsUtils';

import { ContactWithoutTypename } from './Contacts.types';

const combineContactFirstAndLastName = (
  firstName: Maybe<string> | undefined,
  lastName: Maybe<string> | undefined
): string | undefined => {
  if (!firstName && !lastName) return undefined;
  return [firstName, lastName].join(' ').trim();
};

export const getContactDisplayNameAndSubtitle = (
  contact: Contact
): { displayName: string; subtitle: string | undefined } => {
  const { firstName, lastName, emailAddress, decryptedData } = contact;
  const emailAddressFallback = emailAddress;
  const phoneNumberFallback =
    !!decryptedData?.decryptedPhoneNumbers && decryptedData?.decryptedPhoneNumbers.length > 0
      ? decryptedData?.decryptedPhoneNumbers[0].value
      : '';

  const firstAndLast = combineContactFirstAndLastName(firstName, lastName);
  const displayName = firstAndLast ?? emailAddressFallback ?? phoneNumberFallback;

  const subtitle = !!firstAndLast ? emailAddressFallback ?? '' : undefined;

  return { displayName, subtitle };
};

// Since we have duplicate displayPictureData types between Skemail and Editor, need to convert here
export const getContactDisplayPictureData = (contact: Contact): DisplayPictureData | undefined => {
  const { displayPictureData } = contact;

  return displayPictureData
    ? {
        profileAccentColor: displayPictureData.profileAccentColor,
        profileCustomURI: displayPictureData.profileCustomURI,
        profileIcon: displayPictureData.profileIcon
      }
    : undefined;
};

export const getContactWithoutTypename = (contact: Contact | OrgMemberContact): ContactWithoutTypename => ({
  contactID: contact.contactID,
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
  isOrgMember: isOrgMemberContact(contact) ? contact.isOrgMember : undefined,
  decryptedData: {
    decryptedBirthday: contact.decryptedData?.decryptedBirthday,
    decryptedNotes: contact.decryptedData?.decryptedNotes,
    decryptedPhoneNumbers: getInitialDecryptedMultipleFieldsValue(contact.decryptedData?.decryptedPhoneNumbers),
    decryptedAddresses: getInitialDecryptedMultipleFieldsValue(contact.decryptedData?.decryptedAddresses),
    decryptedNickname: contact.decryptedData?.decryptedNickname,
    decryptedCompany: contact.decryptedData?.decryptedNickname,
    decryptedJobTitle: contact.decryptedData?.decryptedJobTitle,
    decryptedURL: contact.decryptedData?.decryptedURL
  }
});

export const contactToAddressObject = (contact: Contact): AddressObjectWithDisplayPicture => {
  const { emailAddress, firstName, lastName } = contact;

  const firstAndLast = combineContactFirstAndLastName(firstName, lastName);

  const displayPictureData = getContactDisplayPictureData(contact);

  return {
    name: firstAndLast,
    address: emailAddress ?? '',
    displayPictureData
  };
};

/**
 * Contact sort comparator
 * Sort by display name first, then subtitle
 */
export const compareContactsDisplayNameAndSubtitle = (contactA: Contact, contactB: Contact): number => {
  // Sort by display name first, then subtitle
  const { displayName: displayNameA, subtitle: subtitleA } = getContactDisplayNameAndSubtitle(contactA);
  const { displayName: displayNameB, subtitle: subtitleB } = getContactDisplayNameAndSubtitle(contactB);
  const displayNameComparison = displayNameA.localeCompare(displayNameB);

  // If display names are equal, sort by subtitle. Else, just return the display name comparison.
  return displayNameComparison === 0 ? (subtitleA ?? '').localeCompare(subtitleB ?? '') : displayNameComparison;
};

const filterEmptyValues = (values?: Maybe<ValueLabel[]>) => {
  return values?.filter(({ value }) => !!value);
};

export const contactIsUnchanged = (existingContact: Contact, pendingContact: Contact): boolean => {
  const { emailAddress, firstName, lastName, displayPictureData, decryptedData } = existingContact;
  const {
    emailAddress: pendingEmailAddress,
    firstName: pendingFirstName,
    lastName: pendingLastName,
    displayPictureData: pendingDisplayPictureData,
    decryptedData: pendingDecryptedData
  } = pendingContact;

  return (
    emailAddress === pendingEmailAddress &&
    firstName === pendingFirstName &&
    lastName === pendingLastName &&
    displayPictureData === pendingDisplayPictureData &&
    decryptedData?.decryptedBirthday === pendingDecryptedData?.decryptedBirthday &&
    decryptedData?.decryptedNotes === pendingDecryptedData?.decryptedNotes &&
    isEqual(
      filterEmptyValues(decryptedData?.decryptedPhoneNumbers),
      filterEmptyValues(pendingDecryptedData?.decryptedPhoneNumbers)
    ) &&
    decryptedData?.decryptedCompany === pendingDecryptedData?.decryptedCompany &&
    decryptedData?.decryptedJobTitle === pendingDecryptedData?.decryptedJobTitle &&
    isEqual(
      filterEmptyValues(decryptedData?.decryptedAddresses as Maybe<ValueLabel[]>),
      filterEmptyValues(pendingDecryptedData?.decryptedAddresses as Maybe<ValueLabel[]>)
    ) &&
    decryptedData?.decryptedNickname === pendingDecryptedData?.decryptedNickname &&
    decryptedData?.decryptedURL === pendingDecryptedData?.decryptedURL
  );
};

export function isKeyOfContact(key: string, obj: object): key is keyof typeof obj {
  return Object.keys(obj).includes(key);
}

const dummyDecryptedContactDataInstance: DecryptedContactData = {
  decryptedBirthday: '',
  decryptedCompany: '',
  decryptedJobTitle: '',
  decryptedNotes: '',
  decryptedPhoneNumbers: [],
  decryptedAddresses: [],
  decryptedNickname: '',
  decryptedURL: ''
};

export function isKeyOfDecryptedContactData(key: string): key is keyof DecryptedContactData {
  return key in dummyDecryptedContactDataInstance;
}

export function getKeyOfDecryptedContactDataDefaultValue(key: keyof DecryptedContactData) {
  return dummyDecryptedContactDataInstance[key] ?? '';
}

export function getValueFromContactOrDecryptedData(key: string, pendingContact: ContactWithoutTypename) {
  if (isKeyOfContact(key, pendingContact)) {
    return pendingContact[key] || '';
  } else if (isKeyOfDecryptedContactData(key) && pendingContact.decryptedData) {
    return pendingContact.decryptedData[key] || getKeyOfDecryptedContactDataDefaultValue(key);
  } else if (isKeyOfDecryptedContactData(key) && !pendingContact.decryptedData) {
    return getKeyOfDecryptedContactDataDefaultValue(key);
  }
  return '';
}

export function createEmptyContact() {
  return {
    contactID: v4(),
    emailAddress: '',
    firstName: '',
    lastName: '',
    displayPictureData: undefined,
    decryptedData: {
      decryptedPhoneNumbers: [{ value: '', label: '' }],
      decryptedAddresses: [{ value: '', label: '' }]
    }
  };
}

export function isEmptyContact(contact: Partial<Contact>) {
  const emptyContact = createEmptyContact();

  const { contactID, ...restOfEmptyContact } = emptyContact;
  const { contactID: cID, ...restOfContact } = contact;

  return isEqual(restOfContact, restOfEmptyContact);
}
