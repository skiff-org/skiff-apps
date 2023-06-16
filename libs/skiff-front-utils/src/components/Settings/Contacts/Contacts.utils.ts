import { Contact, DisplayPictureData, Maybe } from 'skiff-graphql';

import { AddressObjectWithDisplayPicture } from '../../../types';

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
  const { firstName, lastName, emailAddress } = contact;

  const firstAndLast = combineContactFirstAndLastName(firstName, lastName);
  const displayName = firstAndLast ?? emailAddress;
  const subtitle = !!firstAndLast ? emailAddress : undefined;

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

export const contactToAddressObject = (contact: Contact): AddressObjectWithDisplayPicture => {
  const { emailAddress, firstName, lastName } = contact;

  const firstAndLast = combineContactFirstAndLastName(firstName, lastName);

  const displayPictureData = getContactDisplayPictureData(contact);

  return {
    name: firstAndLast,
    address: emailAddress,
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
