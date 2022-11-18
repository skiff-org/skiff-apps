import axios from 'axios';
import saveAs from 'file-saver';
import JSZIP from 'jszip';
import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { decryptDatagram } from 'skiff-crypto-v2';
import { useToast } from 'skiff-front-utils';
import { contentAsBase64, isDataUrl } from 'skiff-front-utils';
import { isDesktopApp, isMobileApp, sendRNWebviewMsg } from 'skiff-front-utils';
import { AttachmentDatagram, EmailFragment, useGetAttachmentsQuery } from 'skiff-mail-graphql';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { addClientFetchedAttachment, getClientFetchedAttachment } from '../../apollo/clientAttachments';
import { MailboxEmailInfo } from '../../models/email';
import { readFile } from '../../utils/readFile';

import { AttachmentStates, ClientAttachment } from './types';
import { canBeFetched, canBeFetchedWithFailed, isAttachment } from './typeUtils';
import { getBase64FromZip, isInline } from './utils';

interface ProgressEvent {
  loaded: number; // current amount of data (in bytes) already downloaded
  total: number; // total bytes of data to be transferred
}
interface AttachmentData {
  link: string;
  sessionKey: string | null;
}

export const fetchAndDecryptAttachment = async (
  attachmentData: AttachmentData,
  onProgress?: (progress: number) => void
) => {
  assertExists(attachmentData.sessionKey, 'Session key must be provided');

  const response = await axios.get(attachmentData.link, {
    onDownloadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent as ProgressEvent;
      onProgress?.(Math.floor((loaded / total) * 100));
    }
  });
  if (!response) {
    return;
  }
  return decryptDatagram(AttachmentDatagram, attachmentData.sessionKey, response.data as string).body.content;
};

export interface InitialAttachmentsData {
  metadata?: MailboxEmailInfo['decryptedAttachmentMetadata'];
  clientAttachments?: ClientAttachment[];
}

const useAttachments = (initialAttachments: InitialAttachmentsData, fetchAll = false) => {
  const [attachments, setAttachments] = useState<ClientAttachment[]>(initialAttachments.clientAttachments || []);

  const addAttachment = useCallback((attachment: ClientAttachment) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex(({ id }) => id === attachment.id);
      if (attachmentIndex < 0) return [...oldAttachments, attachment];
      return oldAttachments;
    });
  }, []);

  const updateAttachment = (id: string, newAttachment: ClientAttachment) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex((attachment) => attachment.id === id);
      if (attachmentIndex < 0) return oldAttachments;
      const attachment = oldAttachments[attachmentIndex];
      const newAttachments = [...oldAttachments];
      newAttachments.splice(attachmentIndex, 1, { ...attachment, ...newAttachment });
      return newAttachments;
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex((attachment) => attachment.id === id);
      if (attachmentIndex < 0) return oldAttachments;
      const newAttachments = [...oldAttachments];
      newAttachments.splice(attachmentIndex, 1);
      return newAttachments;
    });
  };

  const removeAllAttachments = () => setAttachments([]);

  const uploadAttachment = async (file: File, inline = false) => {
    const localID = v4();
    try {
      addAttachment({
        id: localID,
        state: AttachmentStates.LocalUploading,
        progress: 0,
        contentType: file.type,
        name: file.name,
        size: file.size,
        inline
      });

      const { content } = await readFile(file, (event) => {
        updateAttachment(localID, {
          state: AttachmentStates.LocalUploading,
          progress: Math.round(100 * (event.loaded / event.total)),
          id: localID,
          contentType: file.type,
          name: file.name,
          size: file.size
        });
      });

      if (content) {
        updateAttachment(localID, {
          size: file.size,
          state: AttachmentStates.Local,
          id: localID,
          contentType: file.type,
          name: file.name,
          content
        });
        return { attachmentID: localID, content };
      } else {
        updateAttachment(localID, {
          state: AttachmentStates.LocalError,
          error: 'Failed reading',
          id: localID,
          contentType: file.type,
          name: file.name,
          size: file.size
        });
        return { attachmentID: localID, error: 'Failed reading' };
      }
    } catch (error) {
      updateAttachment(localID, {
        state: AttachmentStates.LocalError,
        error: `Failed reading: ${error}`,
        id: localID,
        contentType: file.type,
        name: file.name,
        size: file.size
      });
      return { attachmentID: localID, error };
    }
  };

  const uploadAttachments = (files: File[]) => Promise.allSettled(files.map((file) => uploadAttachment(file)));
  // the best option will be to use lazy query here,
  // at the moment the decrypted sessions key is undefined in the first request, so the the query is failing at the first try
  const { refetch: getAttachments } = useGetAttachmentsQuery({
    variables: {
      ids: []
    },
    // use network for refreshed links
    fetchPolicy: 'cache-and-network'
  });
  const { enqueueToast } = useToast();
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

    if (!contentType) contentType = 'text';

    if (!decryptedAttachment) {
      enqueueToast({
        body: 'something went wrong with the decryption',
        icon: Icon.Warning
      });
      return;
    }

    if (isMobileApp() || isDesktopApp()) {
      // On mobile app save file with RN
      sendRNWebviewMsg('saveFile', {
        base64Data: decryptedAttachment,
        type: contentType,
        filename
      });
    } else {
      saveAs(new Blob([Buffer.from(decryptedAttachment, 'base64')], { type: contentType }), filename);
    }
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

    const zip = new JSZIP();

    const attachmentsData = await getAttachmentsDownloadData(attachmentsIds);

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
    if (isMobileApp() || isDesktopApp()) {
      // On mobile app save file with RN
      // Convert zip to base64
      const base64Data = await getBase64FromZip(content);
      sendRNWebviewMsg('saveFile', {
        base64Data,
        type: 'application/zip',
        filename
      });
    } else {
      saveAs(content, filename);
    }
    setIsDownloadingAttachments(false);
  };

  const fetchAttachments = useCallback(
    async (ids: string[], fetchFailed?: boolean) => {
      const attachmentsToFetch = ids.filter((id) => {
        const attachment = attachments.find((attach) => attach.id === id);
        if (!attachment) return false;
        const willFetch = fetchFailed ? canBeFetchedWithFailed(attachment) : canBeFetched(attachment);
        if (!willFetch) return false;
        const existingData = getClientFetchedAttachment(id);

        if (existingData) {
          updateAttachment(id, {
            state: AttachmentStates.Local,
            id: id,
            contentType: attachment.contentType,
            name: attachment.name,
            size: attachment.size,
            content: existingData
          });
          return false;
        }
        // Update attachment state to remote fetching
        updateAttachment(id, {
          state: AttachmentStates.RemoteFetching,
          id: id,
          contentType: attachment.contentType,
          name: attachment.name,
          size: attachment.size,
          progress: 0
        });
        return true;
      });
      if (attachmentsToFetch.length === 0) return;

      try {
        const attachmentsData = await getAttachmentsDownloadData(attachmentsToFetch);
        Object.entries(attachmentsData).forEach(async ([attachmentID, attachmentData]) => {
          const attachmentMeta = attachments?.find((attachment) => attachment.id === attachmentID);
          if (!attachmentMeta) return;

          try {
            const decryptedAttachmentContent = await fetchAndDecryptAttachment(attachmentData, (progress) => {
              updateAttachment(attachmentID, {
                state: AttachmentStates.RemoteFetching,
                id: attachmentID,
                contentType: attachmentMeta.contentType,
                name: attachmentMeta.name,
                size: attachmentMeta.size,
                progress
              });
            });

            if (!decryptedAttachmentContent) {
              updateAttachment(attachmentID, {
                state: AttachmentStates.RemoteError,
                id: attachmentID,
                contentType: attachmentMeta.contentType,
                name: attachmentMeta.name,
                size: attachmentMeta.size,
                error: 'Failed fetching attachment'
              });
            } else {
              addClientFetchedAttachment(attachmentID, decryptedAttachmentContent);
              updateAttachment(attachmentID, {
                state: AttachmentStates.RemoteFetched,
                id: attachmentID,
                contentType: attachmentMeta.contentType,
                name: attachmentMeta.name,
                size: attachmentMeta.size,
                content: isDataUrl(decryptedAttachmentContent)
                  ? contentAsBase64(decryptedAttachmentContent)
                  : decryptedAttachmentContent
              });
            }
          } catch (error) {
            updateAttachment(attachmentID, {
              state: AttachmentStates.RemoteError,
              id: attachmentID,
              contentType: attachmentMeta.contentType,
              name: attachmentMeta.name,
              size: attachmentMeta.size,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore
              error: 'Failed decrypting attachment: ' + error?.message
            });
          }
        });
      } catch (error: any) {
        enqueueToast({
          icon: Icon.Warning,
          body: error.message,
          title: 'Failed getting attachments download data'
        });
        // Update all attachments to failed to fetch
        attachmentsToFetch.forEach((attachmentID) => {
          const attachmentMeta = attachments?.find((attachment) => attachment.id === attachmentID);
          if (!attachmentMeta) return false;
          updateAttachment(attachmentID, {
            state: AttachmentStates.RemoteError,
            id: attachmentID,
            contentType: attachmentMeta.contentType,
            name: attachmentMeta.name,
            size: attachmentMeta.size,
            error: 'Failed fetching attachment'
          });
        });
      }
    },
    [attachments, getAttachmentsDownloadData]
  );

  const fetchAllAttachments = useCallback(
    (onlyInline?: boolean) =>
      fetchAttachments(
        attachments.filter((attachment) => attachment.inline || !onlyInline).map((attachment) => attachment.id),
        true
      ),
    [attachments, fetchAttachments]
  );

  // Add all the initial attachments
  useEffect(() => {
    initialAttachments.metadata?.forEach((attachment) => {
      if (!attachment.decryptedMetadata) return;
      const { contentType, filename, size, contentId, contentDisposition } = attachment.decryptedMetadata;

      // Don't display the ics attachment
      if (contentDisposition === 'calendar') return;

      addAttachment({
        state: AttachmentStates.Remote,
        id: attachment.attachmentID,
        contentType,
        name: filename,
        size,
        contentID: contentId,
        inline: !!isInline(attachment)
      });
    });
  }, [addAttachment, initialAttachments.metadata]);

  useEffect(() => {
    if (attachments.some((attachment) => attachment.state === AttachmentStates.Remote)) {
      void fetchAllAttachments(!fetchAll);
    }
  }, [fetchAll, fetchAllAttachments]);

  const attachmentsSize = useMemo(
    () => attachments.reduce((sum, attachment) => (sum += attachment.size), 0),
    [attachments]
  );

  return {
    downloadAttachment,
    downloadAllAttachments,
    getAttachmentsDownloadData,
    isDownloadingAttachments,
    attachments,
    attachmentsSize,
    addAttachment,
    removeAttachment,
    removeAllAttachments,
    uploadAttachments,
    uploadAttachment,
    fetchAttachments,
    fetchAllAttachments
  };
};

export default useAttachments;
