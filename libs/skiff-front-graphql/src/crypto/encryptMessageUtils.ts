import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import partition from 'lodash/partition';
import { generateSymmetricKey, stringEncryptAsymmetric } from 'skiff-crypto';
import { encryptDatagramV2 } from 'skiff-crypto';
import {
  PublicKey,
  EncryptedDataInput,
  EncryptedAttachmentInput,
  SendAddressRequest,
  EncryptedSessionKeyOutput,
  AttachmentMetadata
} from 'skiff-graphql';
import { OmitStrict, getContentSnippet } from 'skiff-utils';

import {
  UsersFromEmailAliasWithCatchallDocument,
  UsersFromEmailAliasWithCatchallQuery,
  UsersFromEmailAliasWithCatchallQueryVariables
} from '../../generated/graphql';

import {
  AttachmentDatagram,
  AttachmentMetadataDatagram,
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
  encryptedTextSnippet: EncryptedDataInput;

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

type RecipientAndKey = {
  publicKey: PublicKey | null;
  recipient: SendAddressRequest;
};

const COMMON_CONSUMER_MAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];

const getPublicKeysFromEmailAliases = async (
  recipients: SendAddressRequest[],
  client: ApolloClient<NormalizedCacheObject>
): Promise<RecipientAndKey[]> => {
  const allAddresses = recipients.map((rec) => rec.address);
  // note - important to have the @, because someone could have an email like @myicloud.com
  const [consumerEmailsToSkip, emailAliases] = partition(allAddresses, (email: string) =>
    COMMON_CONSUMER_MAIL_DOMAINS.some((domain) => email.endsWith('@' + domain))
  );

  const userFromEmailRes =
    emailAliases.length === 0
      ? undefined
      : await client.query<UsersFromEmailAliasWithCatchallQuery, UsersFromEmailAliasWithCatchallQueryVariables>({
          query: UsersFromEmailAliasWithCatchallDocument,
          variables: {
            emailAliases
          },
          fetchPolicy: 'no-cache'
        });
  const returnedData =
    userFromEmailRes?.data.usersFromEmailAliasWithCatchall.map(
      (user, i): RecipientAndKey => ({
        recipient: recipients[allAddresses.indexOf(emailAliases[i])],
        publicKey: user?.publicKey || null
      })
    ) || [];
  const consumerEmails = consumerEmailsToSkip.map((email) => ({
    recipient: recipients[allAddresses.indexOf(email)],
    publicKey: null
  }));
  return [...returnedData, ...consumerEmails];
};

/** Wrapper around the crypto encryptEmailContent */
export const encryptMessageContent = (
  subject: string,
  messageTextBody: string,
  messageHtmlBody: string,
  attachments: AttachmentPair[],
  sessionKey: string,
  customAttachmentTransformer?: (data: string, i: number) => Blob | File,
  messageTextAsHtmlBody?: string
) => {
  const encryptedSubject = encryptDatagramV2(MailSubjectDatagram, {}, { subject }, sessionKey);

  const encryptedText = encryptDatagramV2(MailTextDatagram, {}, { text: messageTextBody }, sessionKey);
  const encryptedHtml = encryptDatagramV2(MailHtmlDatagram, {}, { html: messageHtmlBody }, sessionKey);
  const encryptedTextAsHtml = encryptDatagramV2(
    MailTextAsHTMLDatagram,
    {},
    // On native we use encryptMessageContent to re-encrypt local skemails that have textAsHtml
    { textAsHTML: messageTextAsHtmlBody ? messageTextAsHtmlBody : messageTextBody },
    sessionKey
  );
  const encryptedTextSnippet = encryptDatagramV2(
    MailTextDatagram,
    {},
    { text: getContentSnippet(messageTextBody) },
    sessionKey
  );
  const encryptedAttachments: EncryptedAttachmentInput[] = attachments.map((attachment, i) => {
    const { encryptedData } = encryptDatagramV2(AttachmentDatagram, {}, { content: attachment.content }, sessionKey);
    return {
      encryptedContent: {
        // This has to be converted to a blob for the apollo-client-upload library to recognize it and
        // convert the request to a form multipart upload.
        encryptedFile: !customAttachmentTransformer
          ? new Blob([encryptedData])
          : customAttachmentTransformer(encryptedData, i)
      },
      encryptedMetadata: encryptDatagramV2(AttachmentMetadataDatagram, {}, attachment.metadata, sessionKey)
    };
  });

  return {
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    encryptedTextSnippet,
    encryptedAttachments
  };
};

interface EncryptRecipientSessionKeysParams {
  /**
   * Message session key to encrypt.
   */
  sessionKey: string;
  /**
   * Encryption private key used to encrypt session key.
   */
  myPrivateKey: string;
  /**
   * Current user's encryption public key.
   */
  myPublicKey: PublicKey;
  /**
   * Address/names of users who need encrypted session keys.
   */
  recipients: SendAddressRequest[];
  externalPublicKey: PublicKey;
  client: ApolloClient<NormalizedCacheObject>;
  isEncryptingToSelf?: boolean;
}

interface EncryptRecipientSessionKeysResult {
  recipientsWithEncryptedKeys: SendAddressRequest[];
  externalEncryptedSessionKey: EncryptedSessionKeyOutput | undefined;
}

/**
 * Populate the encryptedSessionKey of each recipient with a session key encrypted with their public key.
 * If an external user exists in the array of provided recipients, that recipient's encryptedSessionKey will remain undefined
 * and the externalEncryptedSessionKey will be returned in the response object.
 */
export const encryptRecipientSessionKeys = async ({
  sessionKey,
  myPrivateKey,
  myPublicKey,
  recipients,
  externalPublicKey,
  client,
  isEncryptingToSelf
}: EncryptRecipientSessionKeysParams): Promise<EncryptRecipientSessionKeysResult> => {
  if (recipients.length === 0) {
    return {
      recipientsWithEncryptedKeys: [],
      externalEncryptedSessionKey: undefined
    };
  }

  // Fetch public key for each recipient
  const recipientsWithKeys =
    isEncryptingToSelf && recipients.length === 1
      ? [{ publicKey: myPublicKey, recipient: recipients[0] }]
      : await getPublicKeysFromEmailAliases(recipients, client);
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
 * @param customAttachmentTransformer - A function to apply transformation to an attachment after encryption.
 *  Used to normalize files that needs to be processed by different libraries, such as react native.
 * @todo Support non-text message body (html)
 */
export const encryptMessage = async (
  request: EncryptMessageRequest,
  client: ApolloClient<NormalizedCacheObject>,
  customAttachmentTransformer?: (data: string, i: number) => Blob | File
): Promise<EncryptedMessageData> => {
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

  const {
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    encryptedTextSnippet,
    encryptedAttachments
  } = encryptMessageContent(
    messageSubject,
    messageTextBody,
    messageHtmlBody,
    attachments,
    decryptedSessionKey,
    customAttachmentTransformer
  );

  const sharedEncryptRecipientSessionKeysParams: OmitStrict<EncryptRecipientSessionKeysParams, 'recipients'> = {
    sessionKey: decryptedSessionKey,
    myPrivateKey: privateKey,
    myPublicKey: publicKey,
    externalPublicKey,
    client
  };

  const [
    fromAddressEncryptionResult,
    toAddressEncryptionResult,
    ccAddressEncryptionResult,
    bccAddressEncryptionResult
  ] = await Promise.all([
    encryptRecipientSessionKeys({
      ...sharedEncryptRecipientSessionKeysParams,
      recipients: [fromAddress],
      isEncryptingToSelf: true
    }),
    encryptRecipientSessionKeys({ ...sharedEncryptRecipientSessionKeysParams, recipients: toAddresses }),
    encryptRecipientSessionKeys({ ...sharedEncryptRecipientSessionKeysParams, recipients: ccAddresses }),
    encryptRecipientSessionKeys({ ...sharedEncryptRecipientSessionKeysParams, recipients: bccAddresses })
  ]);

  return {
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    encryptedAttachments,
    encryptedTextSnippet,
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
