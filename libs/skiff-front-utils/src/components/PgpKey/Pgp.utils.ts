import dayjs from 'dayjs';
import { KeyAlgorithmInfo, PgpPrivateKey } from 'skiff-crypto-v2';
import {
  PgpKeyDatagram
} from 'skiff-front-graphql';

import { encryptSymmetric, generateSymmetricKey, stringEncryptAsymmetric } from 'skiff-crypto';
import { requireCurrentUserData } from '../../apollo';
import { ImportKeyOptions } from './Pgp.types';

export async function getPgpRequest(email: string, pgpPrivateKey: PgpPrivateKey, disablePreviousKey: boolean) {

  const currentUser = requireCurrentUserData();

  const userPrivateKey = currentUser.privateUserData.privateKey;
  const userPublicKey = currentUser.publicKey;

  const decryptedSessionKey = generateSymmetricKey();
  const encryptedUserSessionKey = stringEncryptAsymmetric(userPrivateKey || '', userPublicKey, decryptedSessionKey);

  const encryptedPgpPrivateKey = encryptSymmetric(pgpPrivateKey.armor(), decryptedSessionKey, PgpKeyDatagram);

  return {
    disablePreviousKey,
    emailAlias: email,
    encryptedPrivateKey: {
      encryptedData: encryptedPgpPrivateKey
    },
    encryptionFingerprint: (await pgpPrivateKey.getEncryptionKey()).getFingerprint(),
    publicKey: pgpPrivateKey.toPublic().armor(),
    sessionKey: {
      encryptedBy: userPublicKey,
      encryptedSessionKey: encryptedUserSessionKey
    },
    signingFingerprint: (await pgpPrivateKey.getSigningKey()).getFingerprint(),
  }
}

const ENCRYPTED_KEY_HEADER = '-----BEGIN ENCRYPTED PRIVATE KEY-----';

export function openImportPgpKeyDialog(address: string, ownKey: boolean, alreadyHasPgpKey: boolean, importKey: (options: ImportKeyOptions) => Promise<void>, refetchPgpKey?: () => void,) {
  // only open pgp key files
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.asc,.ggp,.pgp';
  fileInput.onchange = (elementEvent) => {
    const file = (elementEvent.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (progressEvent) => {
      const key = progressEvent.target?.result;
      let passphrase;
      const hasPassphrase = key?.toString().startsWith(ENCRYPTED_KEY_HEADER);
      if (hasPassphrase) {
        passphrase = prompt('Enter passphrase');
      }
      await importKey({ email: address, key, ownKey, alreadyHasPgpKey, passphrase, refetchPgpKey });
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

export function getAlgorithmReadableString(algorithmInfo?: KeyAlgorithmInfo) {
  const algorithmString = algorithmInfo ? `${algorithmInfo?.algorithm} ${algorithmInfo?.bits || algorithmInfo?.curve}` : '';
  return algorithmString;
}

export function formattedPgpDate(date: number | Date) {
  return dayjs(date).format('MMM DD, YYYY')

}
