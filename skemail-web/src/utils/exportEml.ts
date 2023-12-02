import { decryptDatagramV2 } from 'skiff-crypto';
import {
  AttachmentDatagram,
  GetAttachmentsDocument,
  GetAttachmentsQuery,
  GetAttachmentsQueryVariables
} from 'skiff-front-graphql';
import { contentAsBase64, decryptSessionKey, getCurrentUserData } from 'skiff-front-utils';
import { filterExists } from 'skiff-utils';

import client from '../apollo/client';
import { ClientLocalAttachment, isInline } from '../components/Attachments';
import { ThreadViewEmailInfo } from '../models/email';

export const fetchAndDecryptAttachments = async (
  attachmentsToFetch: ThreadViewEmailInfo['decryptedAttachmentMetadata'],
  privateKey: string
) => {
  const { data: getAttachmentsData } = await client.query<GetAttachmentsQuery, GetAttachmentsQueryVariables>({
    query: GetAttachmentsDocument,
    variables: { ids: attachmentsToFetch?.map((attach) => attach.attachmentID) ?? [] }
  });
  if (!getAttachmentsData.attachments || getAttachmentsData.attachments.length === 0) return [];

  const { default: axios } = await import('axios');
  const decryptedAttachmentsArray = await Promise.all(
    getAttachmentsData.attachments.filter(filterExists).map(async (attachment) => {
      const fetchResponse = await axios.get<string>(attachment.downloadLink);
      const encryptedAttachmentContent = fetchResponse.data;

      const decryptedSessionKey = decryptSessionKey(
        attachment.encryptedSessionKey.encryptedSessionKey,
        privateKey,
        attachment.encryptedSessionKey.encryptedBy
      );

      const decryptedAttachmentContent = decryptDatagramV2(
        AttachmentDatagram,
        decryptedSessionKey,
        encryptedAttachmentContent
      ).body.content;

      const otherAttachmentData = attachmentsToFetch?.find((attach) => attach.attachmentID === attachment.attachmentID);

      return {
        id: attachment.attachmentID,
        data: decryptedAttachmentContent,
        contentType: otherAttachmentData?.decryptedMetadata?.contentType,
        name: otherAttachmentData?.decryptedMetadata?.filename,
        isInline: otherAttachmentData && isInline(otherAttachmentData)
      };
    })
  );

  return decryptedAttachmentsArray;
};

// we have to invert the base64 string to get the correct content in the EML builder library
const base64ToBuffer = (base64String: string) => {
  return Buffer.from(base64String, 'base64');
};

export const createExportableEML = async (
  userData: ReturnType<typeof getCurrentUserData>,
  email: ThreadViewEmailInfo
) => {
  if (!userData || !userData.privateUserData?.privateKey) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { default: emlFormat } = await import('eml-format');
  const downloadedAttachments = await fetchAndDecryptAttachments(
    email.decryptedAttachmentMetadata ?? [],
    userData.privateUserData.privateKey
  );

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    void emlFormat.build(
      {
        from: email.from.address,
        to: email.to.map((toElem) => ({
          name: toElem.name,
          email: toElem.address
        })),
        cc: email.cc.map((ccElem) => ({
          name: ccElem.name,
          email: ccElem.address
        })),
        bcc: email.bcc.map((bccElem) => ({
          name: bccElem.name,
          email: bccElem.address
        })),
        text: email.decryptedText,
        subject: email.decryptedSubject,
        html: email.decryptedHtml,
        attachments: downloadedAttachments.map((attach) => {
          const base64Data = contentAsBase64(attach.data);
          return {
            name: attach.name,
            contentType: attach.contentType,
            data: base64ToBuffer(base64Data),
            inline: attach.isInline,
            cid: attach.id
          };
        }),
        headers: {
          Date: email.createdAt.toISOString()
        }
      },
      (error: Error | null, eml: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(eml);
        }
      }
    );
  });
};


const DUMMY_EMAIL = 'dummy@placeholder.com';

export const createPgpMIME = async (
  message: string,
  attachments: ClientLocalAttachment[]
): Promise<string> => {

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { default: emlFormat } = await import('eml-format');

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    void emlFormat.build(
      {
        to: {
          name: '',
          // eml-format requires a TO header, but proton doesn't expect it
          email: DUMMY_EMAIL
        },
        html: message,
        attachments: attachments.map((attach) => {
          const decodedContent = Buffer.from(attach.content, 'base64');
          return {
            name: attach.name,
            contentType: attach.contentType,
            data: decodedContent,
            inline: attach.inline,
            cid: attach.id
          };
        })
      },
      (error: Error | null, eml: string) => {
        if (error) {
          reject(error);
        } else {
          // remove first line (i.e. TO header) from eml
          const removeFirstline = eml.split('\n');
          removeFirstline.shift();
          resolve(removeFirstline.join('\n'));
        }
      }
    );
  });
};
