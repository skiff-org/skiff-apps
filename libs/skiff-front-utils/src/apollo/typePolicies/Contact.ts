import { FieldReadFunction, TypePolicy } from '@apollo/client';
import { decryptSessionKey, decryptDatagramV2 } from 'skiff-crypto';
import { EncryptedContactDataDatagram } from 'skiff-front-graphql';
import { Contact } from 'skiff-graphql';

import { memoizeFieldReadFunction } from '../../helpers';
import { getInitialDecryptedMultipleFieldsValue } from '../../utils/contactsUtils';
import { getCurrentUserData } from '../localState';

const readDecryptedSessionKey: FieldReadFunction<Contact['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedSessionKey = options.readField<Contact['encryptedSessionKey']>('encryptedSessionKey');
    const encryptedByKey = options.readField<Contact['encryptedByKey']>('encryptedByKey');
    const currentUser = getCurrentUserData();
    return {
      encryptedSessionKey,
      encryptedByKey,
      privateKey: currentUser?.privateUserData.privateKey
    };
  },
  ({ encryptedByKey, encryptedSessionKey, privateKey }) => {
    if (!encryptedSessionKey || !encryptedByKey || !privateKey) {
      return null;
    }
    try {
      return decryptSessionKey(encryptedSessionKey, privateKey, { key: encryptedByKey });
    } catch (error) {
      console.error(`readDecryptedSessionKey: failed to decrypt session key for contact`, { error });
      return null;
    }
  }
);

const readContactDecryptedData = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedContactData = options.readField<Contact['encryptedContactData']>('encryptedContactData');
    const sessionKey = options.readField<Contact['decryptedSessionKey']>('decryptedSessionKey');
    const currentUser = getCurrentUserData();
    return {
      sessionKey,
      privateKey: currentUser?.privateUserData.privateKey,
      encryptedContactData
    };
  },
  ({ sessionKey, encryptedContactData, privateKey }) => {
    if (!sessionKey || !encryptedContactData || !privateKey) {
      return null;
    }
    try {
      const contactData = decryptDatagramV2(EncryptedContactDataDatagram, sessionKey, encryptedContactData);
      return {
        decryptedPhoneNumbers: getInitialDecryptedMultipleFieldsValue(
          contactData.body.decryptedPhoneNumbers,
          contactData.body.decryptedPhoneNumber
        ),
        decryptedBirthday: contactData.body.decryptedBirthday ?? '',
        decryptedNotes: contactData.body.decryptedNotes ?? '',
        decryptedCompany: contactData.body.decryptedCompany ?? '',
        decryptedJobTitle: contactData.body.decryptedJobTitle ?? '',
        decryptedAddresses: getInitialDecryptedMultipleFieldsValue(
          contactData.body.decryptedAddresses,
          contactData.body.decryptedAddress
        ),
        decryptedNickname: contactData.body.decryptedNickname ?? '',
        decryptedURL: contactData.body.decryptedURL ?? ''
      };
    } catch (error) {
      console.error(`readContactEncryptedField: failed to decrypt encrypted data for contact`, { error });
      return null;
    }
  }
);

export const contactTypePolicy: TypePolicy = {
  keyFields: ['contactID'],
  fields: {
    decryptedData: {
      read: readContactDecryptedData
    },
    decryptedSessionKey: {
      read: readDecryptedSessionKey
    }
  }
};
