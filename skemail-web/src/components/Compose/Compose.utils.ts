import { decryptSymmetric, stringDecryptAsymmetric } from 'skiff-crypto';
import {
  PgpPublicKey,
  encryptMessage,
  fetchWKDKey,
  getStringFromStream,
  readArmoredPrivateKey
} from 'skiff-crypto-v2';
import { PgpKeyDatagram } from 'skiff-front-graphql';
import { getBaseProxyURL, getEnvironment } from 'skiff-front-utils';
import { AddressObject, PgpInfo } from 'skiff-graphql';
import { PGP_CONTENT_TYPES, PGP_EXTENSIONS, SENDER_PUBLIC_KEY_FILENAME } from './Compose.constants';


export const addSenderPublicKey = (uploadAttachmentsAsync: (files: File[]) => void, publicKey?: string) => {
  if (!publicKey) return;
  const blob = new Blob([publicKey], { type: 'text/plain' });
  const file = new File([blob], SENDER_PUBLIC_KEY_FILENAME, { type: 'text/plain' });
  uploadAttachmentsAsync([file]);
};

export const isPgpFile = (contentType: string, filename: string) => {
  return PGP_CONTENT_TYPES.includes(contentType) || PGP_EXTENSIONS.includes(filename.split('.').pop() ?? '');
}



export const encryptPgpEmail = async (
  senderKey: PgpInfo,
  messageText: string,
  recipientPublicKeys: Array<PgpPublicKey>, // TODO require
  userPrivateKey: string
) => {

  const decryptedSessionKey = stringDecryptAsymmetric(
    userPrivateKey,
    senderKey.encryptedSessionKey.encryptedBy,
    senderKey.encryptedSessionKey.encryptedSessionKey
  );
  const decryptedPrivateKey = decryptSymmetric(
    senderKey.encryptedPrivateKey.encryptedData,
    decryptedSessionKey,
    PgpKeyDatagram
  );
  const senderPrivateKey = await readArmoredPrivateKey(decryptedPrivateKey);

  const enc = new TextEncoder();
  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(messageText));
      controller.close();
    }
  });
  const recipientFields = await Promise.all(
    recipientPublicKeys.map(async (publicKey) => {
      const publicKeyID = (await publicKey.getEncryptionKey()).getKeyID();

      return {
        name: undefined,
        email: undefined,
        publicKey,
        keyID: publicKeyID
      };
    })
  );

  const senderPrivateKeySigningKey = await senderPrivateKey.getSigningKey();
  const signingKeyID = senderPrivateKeySigningKey.getKeyID();
  try {
    const message = await encryptMessage(
      readableStream,
      {
        name: undefined,
        email: undefined,
        privateKey: senderPrivateKey,
        keyID: signingKeyID
      },
      recipientFields
    );
    // @ts-expect-error(345)
    const encryptedText = await getStringFromStream(message);
    return encryptedText;
  } catch (error) {
    console.log('error', error);
  }
  return '';
};

export const getRecipientPgpInfo = async (addresses: AddressObject[]): Promise<Array<PgpPublicKey>> => {
  // TODO add contact query for PGP field
  const originUrl = new URL(window.location.origin);
  const wkdUrl =
    getEnvironment(originUrl) === 'local' ? new URL('https://resource-proxy.skiff.town') : getBaseProxyURL(originUrl);
  const addressWKDKeys = await Promise.all(
    addresses.map(async (address) => {
      const wkdKey = await fetchWKDKey(address.address, wkdUrl);
      return wkdKey;
    })
  );
  return addressWKDKeys.filter((key) => key !== null) as Array<PgpPublicKey>;
};
