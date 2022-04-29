// Type policy to decrypt attachment content.

import { FieldReadFunction, TypePolicy } from '@apollo/client';

import { Attachment } from '../../generated/graphql';
import { decryptSessionKey } from '../../utils/crypto/v2/email';
import { assertExists } from '../../utils/typeUtils';
import { requireCurrentUserData } from '../currentUser';
import memoizeFieldReadFunction from './helpers/memoizingHelpers';

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
  fields: {
    decryptedSessionKey: {
      read: readDecryptedSessionKey
    }
  }
};
