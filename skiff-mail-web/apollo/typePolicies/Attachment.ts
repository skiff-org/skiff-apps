// Type policy to decrypt attachment content.

import { FieldReadFunction, TypePolicy } from '@apollo/client';
import { decryptSessionKey } from 'skiff-crypto-v2';
import { memoizeFieldReadFunction, requireCurrentUserData } from 'skiff-front-utils';
import { Attachment } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

const readDecryptedSessionKey: FieldReadFunction<Attachment['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedSessionKey = options.readField<Attachment['encryptedSessionKey']>('encryptedSessionKey');
    const currentUser = requireCurrentUserData();
    const id = options.readField<Attachment['attachmentID']>('attachmentID');

    return { id, privateKey: currentUser.privateUserData.privateKey, encryptedSessionKey };
  },
  ({ id, privateKey, encryptedSessionKey }) => {
    assertExists(privateKey, `Must provide a private key to decrypt the session key for attachment ${id}`);
    assertExists(
      encryptedSessionKey,
      `Must provide an encrypted session key to decrypt the session key for attachment ${id}`
    );
    try {
      return decryptSessionKey(encryptedSessionKey.encryptedSessionKey, privateKey, encryptedSessionKey?.encryptedBy);
    } catch (e) {
      console.error(`readDecryptedSessionKey: failed to decrypt session key for attachment ${id}`, e);
      return null;
    }
  }
);

export const attachmentTypePolicy: TypePolicy = {
  keyFields: ['attachmentID'],
  fields: {
    decryptedSessionKey: {
      read: readDecryptedSessionKey
    }
  }
};
