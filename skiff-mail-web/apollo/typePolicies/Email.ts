import { FieldReadFunction, TypePolicy } from '@apollo/client';
import { decryptDatagram, decryptSessionKey } from 'skiff-crypto-v2';
import { memoizeFieldReadFunction } from 'skiff-front-utils';
import { Email } from 'skiff-graphql';
import {
  AttachmentMetadataDatagram,
  MailHtmlDatagram,
  MailSubjectDatagram,
  MailTextAsHTMLDatagram,
  MailTextDatagram
} from 'skiff-mail-graphql';
import { assertExists } from 'skiff-utils';

import { requireCurrentUserData } from '../currentUser';
import { parseAsMemoizedDate } from '../date';

// Type policy to decrypt an encrypted session field using the user's local private key. Used to decrypt other encrypted fields on the email.
const readDecryptedSessionKey: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const encryptedSessionKey = options.readField<Email['encryptedSessionKey']>('encryptedSessionKey');
    const currentUser = requireCurrentUserData();
    const id = options.readField<Email['id']>('id');

    return { id, privateKey: currentUser.privateUserData.privateKey, encryptedSessionKey };
  },
  ({ id, privateKey, encryptedSessionKey }) => {
    assertExists(privateKey, 'Must provide a private key to decrypt the session key');
    assertExists(encryptedSessionKey, 'Must provide an encrypted session key to decrypt the session key');
    try {
      return decryptSessionKey(encryptedSessionKey?.encryptedSessionKey, privateKey, encryptedSessionKey?.encryptedBy);
    } catch (e) {
      console.error(`readDecryptedSessionKey: failed to decrypt session key for email ${id}`, e);
      return null;
    }
  }
);

// These type policies use the decrypted session key to decrypt the encrypted fields on the email.
const readDecryptedSubject: FieldReadFunction<Email['decryptedSessionKey']> = memoizeFieldReadFunction(
  (_, options) => {
    const sessionKey = options.readField<Email['decryptedSessionKey']>('decryptedSessionKey');
    const encryptedSubject = options.readField<Email['encryptedSubject']>('encryptedSubject');
    const id = options.readField<Email['id']>('id');
    return { sessionKey, encryptedSubject, id };
  },
  ({ sessionKey, encryptedSubject, id }) => {
    assertExists(sessionKey, 'Must provide sessionKey to decrypt the subject');
    assertExists(encryptedSubject, 'Must provide encryptedSubject');
    try {
      return decryptDatagram(MailSubjectDatagram, sessionKey, encryptedSubject.encryptedData).body.subject;
    } catch (e) {
      console.error(`readDecryptedSubject: failed to decrypt subject for email ${id}`, e);
      return null;
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
    assertExists(sessionKey, 'Must provide sessionKey to decrypt the text');
    assertExists(encryptedText, 'Must provide encryptedText');
    try {
      return decryptDatagram(MailTextDatagram, sessionKey, encryptedText.encryptedData).body.text;
    } catch (e) {
      console.error(`readDecryptedText: failed to decrypt text for email ${id}`, e);
      return null;
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
    assertExists(sessionKey, 'Must provide sessionKey to decrypt the html');
    assertExists(encryptedHtml, 'Must provide encryptedHtml');
    try {
      return decryptDatagram(MailHtmlDatagram, sessionKey, encryptedHtml.encryptedData).body.html;
    } catch (e) {
      console.error(`readDecryptedHtml: failed to decrypt html for email ${id}`, e);
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
    assertExists(sessionKey, 'Must provide sessionKey to decrypt the text as html');
    assertExists(encryptedTextAsHtml, 'Must provide encryptedTextAsHtml');
    try {
      return decryptDatagram(MailTextAsHTMLDatagram, sessionKey, encryptedTextAsHtml.encryptedData).body.textAsHTML;
    } catch (e) {
      console.error(`readDecryptedTextAsHtml: failed to decrypt textAsHtml for email ${id}`, e);
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
      assertExists(sessionKey, 'Must provide sessionKey to decrypt attachment metadata');
      assertExists(attachmentMetadata, 'Must provide attachmentMetadata');
      const decryptedAttachments = attachmentMetadata.map((attachment) => {
        try {
          return {
            attachmentID: attachment.attachmentID,
            decryptedMetadata: decryptDatagram(
              AttachmentMetadataDatagram,
              sessionKey,
              attachment.encryptedData.encryptedData
            ).body
          };
        } catch (e) {
          console.error(
            `readDecryptedAttachmentMetadata: failed to decrypt attachment ${attachment.attachmentID} for email ${id}`,
            e
          );
          return {
            attachmentID: attachment.attachmentID,
            decryptedMetadata: null
          };
        }
      });
      return decryptedAttachments;
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
    createdAt: {
      read: parseAsMemoizedDate
    },
    decryptedAttachmentMetadata: {
      read: readDecryptedAttachmentMetadata
    },
    encryptedRawMimeUrl: {
      read: (existing) => existing
    }
  }
};
