import { FieldReadFunction, TypePolicy } from '@apollo/client';
import { decryptDatagramV2, decryptSessionKey } from 'skiff-crypto';
import { EncryptedAliasDataDatagram } from 'skiff-front-graphql';
import { FullAliasInfo } from 'skiff-graphql';

import { memoizeFieldReadFunction } from '../../helpers';
import { requireCurrentUserData } from '../localState';

const DECRYPT_FAILURE_NOTE = '[ERROR] Failed to decrypt alias data';

// Type policy to decrypt an encrypted session field using the user's local private key. Used to decrypt other encrypted fields on the alias
const readDecryptedSessionKey: FieldReadFunction<FullAliasInfo['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedSessionKey = options.readField<FullAliasInfo['encryptedSessionKey']>('encryptedSessionKey');
    if (!encryptedSessionKey) {
      // aliases may have no encrypted data; so if there is no encryptedSessionKey, nothing is amiss
      return {};
    }
    const encryptedByKey = options.readField<FullAliasInfo['encryptedByKey']>('encryptedByKey');
    const currentUser = requireCurrentUserData();
    const alias = options.readField<FullAliasInfo['emailAlias']>('emailAlias');

    return { alias, privateKey: currentUser.privateUserData.privateKey, encryptedSessionKey, encryptedByKey };
  },
  ({ alias, privateKey, encryptedSessionKey, encryptedByKey }) => {
    try {
      if (privateKey && encryptedByKey && encryptedSessionKey) {
        return decryptSessionKey(encryptedSessionKey, privateKey, { key: encryptedByKey });
      }
      return null;
    } catch (e) {
      console.error(`readDecryptedSessionKey: failed to decrypt session key for alias`, { alias, e });
      return null;
    }
  }
);

// These type policies use the decrypted session key to decrypt the encrypted fields of the alias.
const readDecryptedAliasData: FieldReadFunction<FullAliasInfo['decryptedData']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<FullAliasInfo['decryptedSessionKey']>('decryptedSessionKey');
    if (!sessionKey) {
      // aliases may have no encrypted data to decrypt; so if there is no session key, we return undefined for this field
      return {};
    }
    const encryptedAliasData = options.readField<FullAliasInfo['encryptedAliasData']>('encryptedAliasData');
    const alias = options.readField<FullAliasInfo['emailAlias']>('emailAlias');
    return { sessionKey, encryptedAliasData, alias };
  },
  ({ sessionKey, encryptedAliasData, alias }) => {
    try {
      const hasEncryptedAliasData = !!(sessionKey && encryptedAliasData);
      if (!hasEncryptedAliasData) return null;
      const decryptedData = decryptDatagramV2(EncryptedAliasDataDatagram, sessionKey, encryptedAliasData);
      return { note: decryptedData.body.note };
    } catch (e) {
      console.error(`readDecryptedAliasData: failed to decrypt decrypted alias data for alias`, { alias, e });
      return { note: DECRYPT_FAILURE_NOTE };
    }
  }
);

export const aliasTypePolicy: TypePolicy = {
  keyFields: ['emailAlias'],
  fields: {
    decryptedSessionKey: {
      read: readDecryptedSessionKey
    },
    decryptedData: {
      read: readDecryptedAliasData
    }
  }
};
