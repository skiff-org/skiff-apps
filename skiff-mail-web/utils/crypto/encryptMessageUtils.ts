import { generateSymmetricKey } from '../../../../services/skemail/src/crypto/utils';
import client from '../../apollo/client';
import {
  AttachmentMetadata,
  EncryptedAttachmentInput,
  EncryptedDataInput,
  EncryptedSessionKeyOutput,
  PublicKey,
  SendAddressRequest,
  UsersFromEmailAliasDocument,
  UsersFromEmailAliasQuery,
  UsersFromEmailAliasQueryVariables
} from '../../generated/graphql';
import { stringEncryptAsymmetric } from './v1/utils';
import {
  AttachmentDatagram,
  AttachmentMetadataDatagram,
  encryptDatagram,
  MailHtmlDatagram,
  MailSubjectDatagram,
  MailTextAsHTMLDatagram,
  MailTextDatagram
} from './v2/email';

/**
 * Encrypt document session key.
 * @param {string} sessionKey - Document session key to encrypt.
 * @param {string} myPrivateKey - Encryption private key used to encrypt session key.
 * @param {PublicKey} myPublicKey - Current user's encryption public key.
 * @param {PublicKey} theirPublicKey - Other user's encryption public key.
 * @returns {EncryptedKey} Returns the encrypted document session key.
 */
function encryptSessionKey(
  sessionKey: string,
  myPrivateKey: string,
  myPublicKey: PublicKey,
  theirPublicKey: PublicKey
) {
  const newKey = stringEncryptAsymmetric(myPrivateKey, theirPublicKey, sessionKey);
  const encryptedKey = {
    encryptedKey: newKey,
    encryptedBy: myPublicKey
  };
  return encryptedKey;
}

export interface EncryptedMessageData {
  encryptedSubject: EncryptedDataInput;
  encryptedText: EncryptedDataInput;
  encryptedHtml: EncryptedDataInput;
  encryptedTextAsHtml: EncryptedDataInput;
  encryptedAttachments: EncryptedAttachmentInput[];

  fromAddressWithEncryptedKey: SendAddressRequest;
  toAddressesWithEncryptedKeys: SendAddressRequest[];
  ccAddressesWithEncryptedKeys: SendAddressRequest[];
  bccAddressesWithEncryptedKeys: SendAddressRequest[];
  externalEncryptedSessionKey?: EncryptedSessionKeyOutput;
}
export type AttachmentPair = {
  content: string;
  metadata: AttachmentMetadata;
};

export interface EncryptMessageRequest {
  messageSubject: string;
  messageTextBody: string;
  messageHtmlBody: string;
  attachments: AttachmentPair[];
  toAddresses: SendAddressRequest[];
  ccAddresses: SendAddressRequest[];
  bccAddresses: SendAddressRequest[];
  fromAddress: SendAddressRequest;
  privateKey: string;
  publicKey: PublicKey;
  externalPublicKey: PublicKey;
}

type RecipientAndKey = { publicKey: PublicKey | null; recipient: SendAddressRequest };
const getPublicKeysFromEmailAliases = async (recipients: SendAddressRequest[]): Promise<RecipientAndKey[]> => {
  const emailAliases = recipients.map((rec) => rec.address);
  const userFromEmailRes = await client.query<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>({
    query: UsersFromEmailAliasDocument,
    variables: {
      emailAliases
    }
  });
  return userFromEmailRes.data.usersFromEmailAlias.map(
    (user, i): RecipientAndKey => ({
      recipient: recipients[i],
      publicKey: user?.publicKey || null
    })
  );
};

/** Wrapper around the crypto encryptEmailContent */
export const encryptMessageContent = (
  subject: string,
  messageTextBody: string,
  messageHtmlBody: string,
  attachments: AttachmentPair[],
  sessionKey: string
) => {
  const encryptedSubject = encryptDatagram(MailSubjectDatagram, {}, { subject }, sessionKey);

  const encryptedText = encryptDatagram(MailTextDatagram, {}, { text: messageTextBody }, sessionKey);
  const encryptedHtml = encryptDatagram(MailHtmlDatagram, {}, { html: messageHtmlBody }, sessionKey);
  const encryptedTextAsHtml = encryptDatagram(MailTextAsHTMLDatagram, {}, { textAsHTML: messageTextBody }, sessionKey);
  const encryptedAttachments: EncryptedAttachmentInput[] = attachments.map((attachment) => ({
    encryptedContent: {
      // This has to be converted to a blob for the apollo-client-upload library to recognize it and
      // convert the request to a form multipart upload.
      encryptedFile: new Blob([
        encryptDatagram(AttachmentDatagram, {}, { content: attachment.content }, sessionKey).encryptedData
      ])
    },
    encryptedMetadata: encryptDatagram(AttachmentMetadataDatagram, {}, attachment.metadata, sessionKey)
  }));

  return {
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    encryptedAttachments
  };
};

/**
 * Populate the encryptedSessionKey of each recipient with a session key encrypted with their public key.
 * If an external user exists in the array of provided recipients, that recipients encryptedSessionKey will remain undefined
 * and the externalEncryptedSessionKey will be returned in the response object.
 * @param {string} sessionKey - Message session key to encrypt.
 * @param {string} myPrivateKey - Encryption private key used to encrypt session key.
 * @param {PublicKey} myPublicKey - Current user's encryption public key.
 * @param {SendAddressRequest[]} recipients - Address/Names of users who need encrypted session keys.
 * @returns {Promise<{recipientsWithEncryptedKeys: SendAddressRequest[]; externalEncryptedSessionKey?: EncryptedSessionKeyOutput }>} Returns the send address requests with encrypted keys.
 */
export const encryptRecipientSessionKeys = async (
  sessionKey: string,
  myPrivateKey: string,
  myPublicKey: PublicKey,
  recipients: SendAddressRequest[],
  externalPublicKey: PublicKey
): Promise<{
  recipientsWithEncryptedKeys: SendAddressRequest[];
  externalEncryptedSessionKey?: EncryptedSessionKeyOutput;
}> => {
  // Fetch public key for each recipient
  const recipientsWithKeys = await getPublicKeysFromEmailAliases(recipients);
  // Add the external key to the array for skiff -> external
  const hasExternalRecipient = recipientsWithKeys.some((recipient) => !recipient.publicKey);

  let externalEncryptedSessionKey: EncryptedSessionKeyOutput | undefined = undefined;
  if (hasExternalRecipient) {
    const encryptedSessionKey = encryptSessionKey(sessionKey, myPrivateKey, myPublicKey, externalPublicKey);
    externalEncryptedSessionKey = {
      encryptedSessionKey: encryptedSessionKey.encryptedKey,
      encryptedBy: encryptedSessionKey.encryptedBy
    };
  }
  const recipientsWithEncryptedKeys: SendAddressRequest[] = recipientsWithKeys.map(
    (recipWithPublicKey): SendAddressRequest => {
      // For an external user, return the original SendAddressRequest object
      if (!recipWithPublicKey.publicKey) return recipWithPublicKey.recipient;
      // Else, encrypt the key and return along with the original object
      const encryptedSessionKey = encryptSessionKey(
        sessionKey,
        myPrivateKey,
        myPublicKey,
        recipWithPublicKey.publicKey
      );
      return {
        ...recipWithPublicKey.recipient,
        encryptedSessionKey: {
          encryptedBy: encryptedSessionKey.encryptedBy,
          encryptedSessionKey: encryptedSessionKey.encryptedKey
        }
      };
    }
  );

  return { recipientsWithEncryptedKeys, externalEncryptedSessionKey };
};

/**
 * Encrypt an message and return both the encrypted content and encrypted session keys
 * @param {EncryptMessageRequest} request - Addresses, subject, and message body.
 */
export const encryptMessage = async (request: EncryptMessageRequest): Promise<EncryptedMessageData> => {
  const {
    messageSubject,
    messageTextBody,
    messageHtmlBody,
    attachments,
    toAddresses,
    privateKey,
    publicKey,
    externalPublicKey,
    ccAddresses,
    bccAddresses,
    fromAddress
  } = request;
  const decryptedSessionKey = generateSymmetricKey();

  const { encryptedSubject, encryptedText, encryptedHtml, encryptedTextAsHtml, encryptedAttachments } =
    encryptMessageContent(messageSubject, messageTextBody, messageHtmlBody, attachments, decryptedSessionKey);
  const fromAddressEncryptionResult = await encryptRecipientSessionKeys(
    decryptedSessionKey,
    privateKey,
    publicKey,
    [fromAddress],
    externalPublicKey
  );

  const toAddressEncryptionResult = await encryptRecipientSessionKeys(
    decryptedSessionKey,
    privateKey,
    publicKey,
    toAddresses,
    externalPublicKey
  );

  const ccAddressEncryptionResult = await encryptRecipientSessionKeys(
    decryptedSessionKey,
    privateKey,
    publicKey,
    ccAddresses,
    externalPublicKey
  );

  const bccAddressEncryptionResult = await encryptRecipientSessionKeys(
    decryptedSessionKey,
    privateKey,
    publicKey,
    bccAddresses,
    externalPublicKey
  );

  return {
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    encryptedAttachments,
    fromAddressWithEncryptedKey: fromAddressEncryptionResult.recipientsWithEncryptedKeys[0],
    toAddressesWithEncryptedKeys: toAddressEncryptionResult.recipientsWithEncryptedKeys,
    ccAddressesWithEncryptedKeys: ccAddressEncryptionResult.recipientsWithEncryptedKeys,
    bccAddressesWithEncryptedKeys: bccAddressEncryptionResult.recipientsWithEncryptedKeys,
    // If any of the address fields contained an external user, return the populated externalEncryptedSessionKey
    // else this will be undefined
    externalEncryptedSessionKey:
      toAddressEncryptionResult.externalEncryptedSessionKey ||
      ccAddressEncryptionResult.externalEncryptedSessionKey ||
      bccAddressEncryptionResult.externalEncryptedSessionKey
  };
};
