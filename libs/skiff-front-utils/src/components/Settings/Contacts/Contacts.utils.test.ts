import { Contact } from 'skiff-graphql';

import { contactToAddressObject, getContactDisplayNameAndSubtitle } from './Contacts.utils';

describe('Contact List utils', () => {
  it('converts a contact list to an address object with display name', () => {
    const TEST_CONTACT: Contact = {
      emailAddress: 'test@skiff.com',
      firstName: 'Test',
      lastName: 'User',
      displayPictureData: {
        profileAccentColor: 'testAccentColor',
        profileCustomURI: 'testURI',
        profileIcon: 'testIcon'
      }
    };

    const addressObj = contactToAddressObject(TEST_CONTACT);

    expect(addressObj.address).toEqual(TEST_CONTACT.emailAddress);
    expect(addressObj.name).toEqual(`${TEST_CONTACT.firstName ?? ''} ${TEST_CONTACT.lastName ?? ''}`);
    expect(addressObj.displayPictureData).toEqual(TEST_CONTACT.displayPictureData);
  });

  it('converts a contact list to an address object without display name', () => {
    const TEST_CONTACT: Contact = {
      emailAddress: 'test@skiff.com'
    };

    const addressObj = contactToAddressObject(TEST_CONTACT);

    expect(addressObj.address).toEqual(TEST_CONTACT.emailAddress);
    expect(addressObj.name).toBeUndefined();
  });

  it('converts a contact list to an address object with just a first or last name', () => {
    const TEST_CONTACT_1: Contact = {
      emailAddress: 'test@skiff.com',
      firstName: 'Test'
    };

    const TEST_CONTACT_2: Contact = {
      emailAddress: 'test@skiff.com',
      lastName: 'User'
    };

    const addressObj1 = contactToAddressObject(TEST_CONTACT_1);
    const addressObj2 = contactToAddressObject(TEST_CONTACT_2);

    expect(addressObj1.name).toBe(TEST_CONTACT_1.firstName);
    expect(addressObj2.name).toBe(TEST_CONTACT_2.lastName);
  });

  it('correctly gets a display name and subtitle with first and last name', () => {
    const TEST_CONTACT: Contact & { firstName: string; lastName: string } = {
      emailAddress: 'test@skiff.com',
      firstName: 'Test',
      lastName: 'User'
    };

    const { displayName, subtitle } = getContactDisplayNameAndSubtitle(TEST_CONTACT);

    expect(displayName).toEqual(`${TEST_CONTACT.firstName} ${TEST_CONTACT.lastName}`);
    expect(subtitle).toEqual(TEST_CONTACT.emailAddress);
  });

  it('correctly gets a display name and subtitle with only first name', () => {
    const TEST_CONTACT: Contact = {
      emailAddress: 'test@skiff.com',
      firstName: 'Test'
    };

    const { displayName, subtitle } = getContactDisplayNameAndSubtitle(TEST_CONTACT);

    expect(displayName).toEqual(TEST_CONTACT.firstName);
    expect(subtitle).toEqual(TEST_CONTACT.emailAddress);
  });

  it('correctly gets a display name and subtitle with only last name', () => {
    const TEST_CONTACT: Contact = {
      emailAddress: 'test@skiff.com',
      lastName: 'Test'
    };

    const { displayName, subtitle } = getContactDisplayNameAndSubtitle(TEST_CONTACT);

    expect(displayName).toEqual(TEST_CONTACT.lastName);
    expect(subtitle).toEqual(TEST_CONTACT.emailAddress);
  });

  it('correctly gets a display name with only email address', () => {
    const TEST_CONTACT: Contact = {
      emailAddress: 'test@skiff.com'
    };

    const { displayName, subtitle } = getContactDisplayNameAndSubtitle(TEST_CONTACT);

    expect(displayName).toEqual(TEST_CONTACT.emailAddress);
    expect(subtitle).toBeUndefined();
  });
});
