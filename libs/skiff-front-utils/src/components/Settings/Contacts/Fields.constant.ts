import { FieldGroup, FieldLabel, FieldType } from './Contacts.types';

export const staticFields: FieldGroup[] = [
  {
    label: FieldLabel.Name,
    items: [
      {
        key: 'firstName',
        placeholder: 'First'
      },
      {
        key: 'lastName',
        placeholder: 'Last'
      }
    ]
  },
  {
    label: FieldLabel.EmailAddress,
    copyable: true,
    items: [
      {
        key: 'emailAddress',
        placeholder: 'Email address'
      }
    ]
  },
  {
    label: FieldLabel.PhoneNumber,
    isE2EE: true,
    copyable: true,
    items: [
      {
        key: 'decryptedPhoneNumbers',
        type: FieldType.multipleInput,
        placeholder: 'XXX-XXX-XXXX',
        labelPlaceholder: 'Mobile'
      }
    ]
  },
  {
    label: FieldLabel.Birthday,
    isE2EE: true,
    items: [
      {
        key: 'decryptedBirthday',
        placeholder: 'Birthday'
      }
    ]
  },
  {
    label: FieldLabel.PgpKey,
    isE2EE: false,
    items: [{
      key: 'pgpKey',
      placeholder: 'PGP'
    }
    ]
  },
  {
    label: FieldLabel.Notes,
    isE2EE: true,
    items: [
      {
        type: FieldType.textarea,
        key: 'decryptedNotes',
        placeholder: 'Notes'
      }
    ]
  }
];

export const optionalFields: FieldGroup[] = [
  {
    label: FieldLabel.Company,
    isE2EE: true,
    items: [
      {
        key: 'decryptedCompany',
        placeholder: 'Company name'
      }
    ]
  },
  {
    label: FieldLabel.JobTitle,
    isE2EE: true,
    items: [
      {
        key: 'decryptedJobTitle',
        placeholder: 'Job title'
      }
    ]
  },
  {
    label: FieldLabel.Address,
    isE2EE: true,
    items: [
      {
        key: 'decryptedAddresses',
        type: FieldType.multipleInput,
        placeholder: 'Location or address',
        labelPlaceholder: 'Home'
      }
    ]
  },
  {
    label: FieldLabel.Nickname,
    isE2EE: true,
    items: [
      {
        key: 'decryptedNickname',
        placeholder: 'Nickname'
      }
    ]
  },
  {
    label: FieldLabel.URL,
    isE2EE: true,
    items: [
      {
        key: 'decryptedURL',
        placeholder: 'Website or URL'
      }
    ]
  }
];
