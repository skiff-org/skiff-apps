import { FieldReadFunction, TypePolicy } from '@apollo/client';
import { decryptDatagramV2, decryptSessionKey } from 'skiff-crypto';
import {
  AttachmentMetadataDatagram,
  MailHtmlDatagram,
  MailSubjectDatagram,
  MailTextAsHTMLDatagram,
  MailTextDatagram
} from 'skiff-front-graphql';
import { memoizeFieldReadFunction, requireCurrentUserData } from 'skiff-front-utils';
import { Email } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { parseAsMemoizedDate } from '../date';

const DECRYPT_FAILURE_SUBJECT = '[ERROR] Failed to Decrypt Email';
const DECRYPT_FAILURE_TEXT = 'This email failed to decrypt properly. Please contact support.';

// Type policy to decrypt an encrypted session field using the user's local private key. Used to decrypt other encrypted fields on the email.
const readDecryptedSessionKey: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedSessionKey = options.readField<Email['encryptedSessionKey']>('encryptedSessionKey');
    const currentUser = requireCurrentUserData();
    const id = options.readField<Email['id']>('id');

    return { id, privateKey: currentUser.privateUserData.privateKey, encryptedSessionKey };
  },
  ({ id, privateKey, encryptedSessionKey }) => {
    try {
      assertExists(privateKey, 'Must provide a private key to decrypt the session key');
      assertExists(encryptedSessionKey, 'Must provide an encrypted session key to decrypt the session key');
      return decryptSessionKey(encryptedSessionKey?.encryptedSessionKey, privateKey, encryptedSessionKey?.encryptedBy);
    } catch (e) {
      console.error(`readDecryptedSessionKey: failed to decrypt session key for email`, { id, e });
      return null;
    }
  }
);

// These type policies use the decrypted session key to decrypt the encrypted fields on the email.
// TODO(easdar) move to a generic function and template.
const readDecryptedSubject: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedSubject = options.readField<Email['encryptedSubject']>('encryptedSubject');
    const id = options.readField<Email['id']>('id');
    return { sessionKey, encryptedSubject, id };
  },
  ({ sessionKey, encryptedSubject, id }) => {
    try {
      assertExists(sessionKey, 'Must provide sessionKey to decrypt the subject');
      assertExists(encryptedSubject, 'Must provide encryptedSubject');
      return decryptDatagramV2(MailSubjectDatagram, sessionKey, encryptedSubject.encryptedData).body.subject;
    } catch (e) {
      console.error(`readDecryptedSubject: failed to decrypt subject for email`, { id, e });
      return DECRYPT_FAILURE_SUBJECT;
    }
  }
);

const readDecryptedText: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedText = options.readField<Email['encryptedText']>('encryptedText');
    const id = options.readField<Email['id']>('id');

    return { sessionKey, encryptedText, id };
  },
  ({ sessionKey, encryptedText, id }) => {
    try {
      assertExists(sessionKey, 'Must provide sessionKey to decrypt the text');
      assertExists(encryptedText, 'Must provide encryptedText');
      return decryptDatagramV2(MailTextDatagram, sessionKey, encryptedText.encryptedData).body.text;
    } catch (e) {
      console.error(`readDecryptedText: failed to decrypt text for email`, { id, e });
      return DECRYPT_FAILURE_TEXT;
    }
  }
);

const readDecryptedHtml: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedHtml = options.readField<Email['encryptedHtml']>('encryptedHtml');
    const id = options.readField<Email['id']>('id');

    return { sessionKey, encryptedHtml, id };
  },
  ({ sessionKey, encryptedHtml, id }) => {
    try {
      assertExists(sessionKey, 'Must provide sessionKey to decrypt the html');
      assertExists(encryptedHtml, 'Must provide encryptedHtml');
      return decryptDatagramV2(MailHtmlDatagram, sessionKey, encryptedHtml.encryptedData).body.html;
    } catch (e) {
      console.error(`readDecryptedHtml: failed to decrypt html for email`, { id, e });
      return null;
    }
  }
);

const readDecryptedTextAsHtml: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedTextAsHtml = options.readField<Email['encryptedTextAsHtml']>('encryptedTextAsHtml');
    const id = options.readField<Email['id']>('id');

    return { sessionKey, encryptedTextAsHtml, id };
  },
  ({ sessionKey, encryptedTextAsHtml, id }) => {
    try {
      assertExists(sessionKey, 'Must provide sessionKey to decrypt the text as html');
      assertExists(encryptedTextAsHtml, 'Must provide encryptedTextAsHtml');
      return decryptDatagramV2(MailTextAsHTMLDatagram, sessionKey, encryptedTextAsHtml.encryptedData).body.textAsHTML;
    } catch (e) {
      console.error(`readDecryptedTextAsHtml: failed to decrypt textAsHtml for email`, { id, e });
      return null;
    }
  }
);

const readDecryptedTextSnippet: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedTextSnippet = options.readField<Email['encryptedTextSnippet']>('encryptedTextSnippet');
    const id = options.readField<Email['id']>('id');

    return { sessionKey, encryptedTextSnippet, id };
  },
  ({ sessionKey, encryptedTextSnippet, id }) => {
    try {
      assertExists(sessionKey, 'Must provide sessionKey to decrypt the text as html');
      if (encryptedTextSnippet) {
        return decryptDatagramV2(MailTextDatagram, sessionKey, encryptedTextSnippet.encryptedData).body.text;
      }
      return null;
    } catch (e) {
      console.error(`readDecryptedTextSnippet: failed to decrypt textAsHtml for email`, { id, e });
      return null;
    }
  }
);

const readDecryptedAttachmentMetadata: FieldReadFunction<Email['decryptedAttachmentMetadata']> =
  memoizeFieldReadFunction(
    (_, options) => {
      const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
      const attachmentMetadata = options.readField<Email['attachmentMetadata']>('attachmentMetadata');
      const id = options.readField<Email['id']>('id');

      return { sessionKey, attachmentMetadata, id };
    },
    ({ sessionKey, attachmentMetadata, id }) => {
      try {
        assertExists(sessionKey, 'Must provide sessionKey to decrypt attachment metadata');
        assertExists(attachmentMetadata, 'Must provide attachmentMetadata');
        const decryptedAttachments = attachmentMetadata.map((attachment) => {
          try {
            return {
              attachmentID: attachment.attachmentID,
              decryptedMetadata: decryptDatagramV2(
                AttachmentMetadataDatagram,
                sessionKey,
                attachment.encryptedData.encryptedData
              ).body
            };
          } catch (e) {
            console.error(
              `readDecryptedAttachmentMetadata: failed to decrypt attachment ${attachment.attachmentID} for email`,
              { id, e }
            );
            return {
              attachmentID: attachment.attachmentID,
              decryptedMetadata: null
            };
          }
        });
        return decryptedAttachments;
      } catch (e) {
        console.error(`readDecryptedAttachmentMetadata: failed to decrypt attachments for email`, { id, e });
        return null;
      }
    }
  );

export const emailTypePolicy: TypePolicy = {
  fields: {
    decryptedSessionKey: {
      read: readDecryptedSessionKey
    },
    decryptedSubject: {
      read: readDecryptedSubject
    },
    decryptedText: {
      read: readDecryptedText
    },
    decryptedHtml: {
      read: readDecryptedHtml
    },
    decryptedTextAsHtml: {
      read: readDecryptedTextAsHtml
    },
    decryptedTextSnippet: {
      read: readDecryptedTextSnippet
    },
    createdAt: {
      read: parseAsMemoizedDate
    },
    decryptedAttachmentMetadata: {
      read: readDecryptedAttachmentMetadata
    },
    encryptedRawMimeUrl: {
      read: (existing: string) => existing
    }
  }
};
