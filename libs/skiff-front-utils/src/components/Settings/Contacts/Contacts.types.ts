import {
  Contact,
  DecryptedContactData,
  DisplayPictureData,
  DisplayPictureDataSkemail,
  ValueLabel
} from 'skiff-graphql';
import { OmitStrict } from 'skiff-utils';

import { OrgMemberContact } from '../../../hooks/useGetAllContactsWithOrgMembers';

export interface PopulateContactContent {
  contactID: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  address: string | undefined;
  displayPictureData: DisplayPictureData | undefined;
  decryptedData?: {
    decryptedPhoneNumbers: ValueLabel[] | undefined;
    decryptedBirthday: string | undefined;
    decryptedNotes: string | undefined;
    decryptedCompany: string | undefined;
    decryptedJobTitle: string | undefined;
    decryptedAddresses: ValueLabel[] | undefined;
    decryptedNickname: string | undefined;
    decryptedURL: string | undefined;
  };
}

export enum FieldLabel {
  Name = 'Name',
  EmailAddress = 'Email address',
  PhoneNumber = 'Phone number',
  Birthday = 'Birthday',
  PgpKey = 'PGP Key',
  Notes = 'Notes',
  Company = 'Company',
  JobTitle = 'Job title',
  Address = 'Address',
  Nickname = 'Nickname',
  URL = 'URL'
}

export type ErrorState = {
  email?: string;
  phone?: string;
  birthday?: string;
};

export enum ContactProfileConfirmModalType {
  NONE,
  DISCARD_CHANGES,
  DISCARD_CHANGES_AND_GO_BACK,
  DELETE
}

export enum FieldType {
  input = 'input',
  textarea = 'textarea',
  multipleInput = 'multipleInput'
}

export type FieldKeys = keyof ContactWithoutTypename | keyof DecryptedContactData | 'pgpKey';

export type FieldItem = {
  type?: FieldType;
  key: FieldKeys;
  placeholder: string;
  labelPlaceholder?: string;
};

export type FieldGroup = {
  label: string;
  isE2EE?: boolean;
  error?: any; // Not sure of the error type here, replace 'any' with the appropriate type.
  copyable?: boolean;
  items: FieldItem[];
};

type DisplayPictureDataSkemailWithoutTypename = OmitStrict<DisplayPictureDataSkemail, '__typename'>;

// Important: Need contact without typename for sending a safe payload back on create/save
export type ContactWithoutTypename = OmitStrict<Contact | OrgMemberContact, '__typename' | 'displayPictureData'> & {
  // Don't use displayPictureData?, that makes it compatible with Contact. Must use explicit undefined
  displayPictureData: DisplayPictureDataSkemailWithoutTypename | null | undefined;
};

// Columns used by Google Contacts and/or Outlook contact export
export interface CsvRowData {
  [key: string]: string | undefined;
  Name?: string;
  'First Name'?: string;
  'Given Name'?: string;
  'Last Name'?: string;
  'Family Name'?: string;
  Nickname?: string;
  'Organization 1 - Name'?: string;
  'Organization 1 - Title'?: string;
  'Website 1 - Value'?: string;
  'Address 1 - Formatted'?: string;
  Email?: string;
  Birthday?: string;
  'Primary Phone'?: string;
  'Mobile Phone'?: string;
  'Phone 1 - Value'?: string;
  'E-mail 1 - Value'?: string;
  'E-mail Address'?: string;
  Note?: string;
  Notes?: string;
}
// Returned data from PapaParse
export interface ReturnedCsvData {
  data: CsvRowData[];
}

export interface VcfKeyData {
  _data?: string;
  type?: string | string[];
  group?: string;
}
