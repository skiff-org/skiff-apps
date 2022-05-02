import { Icon } from '@skiff-org/skiff-ui';
import saveAs from 'file-saver';
import JSZIP from 'jszip';
import { useCallback, useEffect, useState } from 'react';

import { Attachment, EmailFragment, useGetAttachmentsQuery } from '../../generated/graphql';
import useCustomSnackbar from '../../hooks/useCustomSnackbar';
import { MailboxEmailInfo } from '../../models/email';
import { AttachmentDatagram, decryptDatagram } from '../../utils/crypto/v2/email';
import { assertExists } from '../../utils/typeUtils';
import { isInline } from './utils';

const isAttachment = (attachment: Attachment | null): attachment is Attachment =>
  attachment?.__typename === 'Attachment';

interface AttachmentData {
  link: string;
  sessionKey: string | null;
}
export async function fetchAndDecryptAttachment(attachmentData: AttachmentData) {
  const data = await (await fetch(attachmentData.link)).text();
  assertExists(attachmentData.sessionKey, 'Session key must be provided');
  return decryptDatagram(AttachmentDatagram, attachmentData.sessionKey, data).body.content;
}

const useDownloadAttachments = (attachmentsMetadata: MailboxEmailInfo['decryptedAttachmentMetadata']) => {
  // the best option will be to use lazy query here,
  // at the moment the decrypted sessions key is undefined in the first request, so the the query is failing at the first try
  const { refetch: getAttachments } = useGetAttachmentsQuery({
    variables: {
      ids: []
    }
  });
  const { enqueueCustomSnackbar } = useCustomSnackbar();
  const [inlineAttachments, setInlineAttachments] = useState<{ [cid: string]: string | null | undefined }>({});
  const [isDownloadingAttachments, setIsDownloadingAttachments] = useState(false);

  const getAttachmentsDownloadData: (ids: string[]) => Promise<{ [attachmentID: string]: AttachmentData }> =
    useCallback(
      async (ids: string[]) => {
        const { data } = await getAttachments({
          ids
        });

        const allResults = data?.attachments?.filter(isAttachment);
        if (!allResults) return {};
        return Object.fromEntries(
          allResults?.map((attachment) => [
            attachment.attachmentID,
            { link: attachment.downloadLink, sessionKey: attachment.decryptedSessionKey || null }
          ])
        );
      },
      [getAttachments]
    );

  const downloadAttachment = async (id: string, contentType: string, filename: string) => {
    const attachment = (await getAttachmentsDownloadData([id]))[id];
    const decryptedAttachment = await fetchAndDecryptAttachment(attachment);
    if (!decryptedAttachment) {
      enqueueCustomSnackbar({
        body: 'something went wrong with the decryption',
        icon: Icon.Warning
      });
      return;
    }

    saveAs(new Blob([Buffer.from(decryptedAttachment, 'base64')], { type: contentType }), filename);
  };

  const downloadAllAttachments = async (
    decryptedAttachmentMetadata: EmailFragment['decryptedAttachmentMetadata'],
    filename: string
  ) => {
    if (!decryptedAttachmentMetadata) return;

    const attachmentsIds = decryptedAttachmentMetadata.map((attachment) => attachment.attachmentID);

    // if only one attachment dont zip
    if (attachmentsIds.length === 1)
      return downloadAttachment(
        attachmentsIds[0],
        decryptedAttachmentMetadata[0].decryptedMetadata?.contentType || 'text',
        decryptedAttachmentMetadata[0].decryptedMetadata?.filename || 'untitled'
      );

    setIsDownloadingAttachments(true);

    const attachmentsData = await getAttachmentsDownloadData(attachmentsIds);

    const zip = new JSZIP();

    await Promise.all(
      decryptedAttachmentMetadata.map(async (attachment) => {
        const attachmentData = attachmentsData[attachment.attachmentID];
        const decryptedAttachment = await fetchAndDecryptAttachment(attachmentData);

        if (!decryptedAttachment) return;

        await zip.file(
          attachment.decryptedMetadata?.filename || 'untitled',
          Buffer.from(decryptedAttachment, 'base64')
        );
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, filename);
    setIsDownloadingAttachments(false);
  };

  useEffect(() => {
    async function downloadInlineAttachments() {
      const allInline = attachmentsMetadata?.filter(isInline);

      if (!allInline) return;

      const attachmentsData = await getAttachmentsDownloadData(allInline.map((attachment) => attachment.attachmentID));
      const decryptedAttachments = await Promise.all(
        Object.entries(attachmentsData).map(async (attachmentData) => [
          attachmentData[0],
          await fetchAndDecryptAttachment(attachmentData[1])
        ])
      );
      const decryptedAttachmentMap = Object.fromEntries(decryptedAttachments);

      setInlineAttachments(
        Object.fromEntries(
          allInline.map((inlineAttachment) => [
            inlineAttachment.decryptedMetadata?.contentId,
            decryptedAttachmentMap[inlineAttachment.attachmentID]
          ])
        )
      );
    }
    void downloadInlineAttachments();
  }, [attachmentsMetadata, getAttachmentsDownloadData]);

  return {
    downloadAttachment,
    downloadAllAttachments,
    getAttachmentsDownloadData,
    inlineAttachments,
    isDownloadingAttachments
  };
};

export default useDownloadAttachments;
