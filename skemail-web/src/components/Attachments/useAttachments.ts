import axios from 'axios';
import saveAs from 'file-saver';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { decryptDatagramV2 } from 'skiff-crypto';
import { AttachmentDatagram, Email, EmailFragment, useGetAttachmentsQuery } from 'skiff-front-graphql';
import {
  BANNED_CONTENT_TYPES,
  BANNED_FILE_EXTENSIONS,
  DEFAULT_FILE_TITLE,
  contentAsBase64,
  isDataUrl,
  isMobileApp,
  isReactNativeDesktopApp,
  sendRNWebviewMsg,
  useToast
} from 'skiff-front-utils';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { addClientFetchedAttachment, getClientFetchedAttachment } from '../../apollo/clientAttachments';
import { MailboxEmailInfo } from '../../models/email';
import { readFile } from '../../utils/readFile';
import { MESSAGE_MAX_SIZE_IN_BYTES, MESSAGE_MAX_SIZE_IN_MB } from '../MailEditor/Plugins/MessageSizePlugin';

import { isPgpFile } from '../Compose/Compose.utils';
import { canBeFetched, canBeFetchedWithFailed, isAttachment } from './typeUtils';
import { AttachmentStates, ClientAttachment } from './types';
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
  return decryptDatagramV2(AttachmentDatagram, attachmentData.sessionKey, response.data as string).body.content;
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

  const uploadAttachment = async (file: File, inline = false, encoding = 'base64' as BufferEncoding) => {
    const localID = v4();
    try {
      // Don't add attachments that are too large
      if (file.size > MESSAGE_MAX_SIZE_IN_BYTES) {
        showAttachmentToast();
        return;
      }
      addAttachment({
        id: localID,
        state: AttachmentStates.LocalUploading,
        progress: 0,
        contentType: file.type,
        name: file.name,
        size: file.size,
        inline
      });

      // Check if file MIME type is banned or if file type from name is banned. Empty/null MIME types are considered invalid
      const fileExtensionIndex = file.name.lastIndexOf('.');
      if (
        BANNED_CONTENT_TYPES.has(file.type) ||
        (fileExtensionIndex > 0 && BANNED_FILE_EXTENSIONS.has(file.name.substring(fileExtensionIndex))) ||
        (inline && file.type == 'image/svg+xml')
      ) {
        updateAttachment(localID, {
          state: AttachmentStates.LocalError,
          error: 'File type not supported',
          id: localID,
          contentType: file.type,
          name: file.name,
          size: file.size,
          inline
        });
        return { attachmentID: localID, error: 'File type not supported' };
      }
      const { content } = await readFile(file, (event) => {
        updateAttachment(localID, {
          state: AttachmentStates.LocalUploading,
          progress: Math.round(100 * (event.loaded / event.total)),
          id: localID,
          contentType: file.type,
          name: file.name,
          size: file.size,
          inline
        });
      }, encoding);

      if (content) {
        updateAttachment(localID, {
          size: file.size,
          state: AttachmentStates.Local,
          id: localID,
          contentType: file.type,
          name: file.name,
          content,
          inline
        });
        return { attachmentID: localID, content };
      } else {
        updateAttachment(localID, {
          state: AttachmentStates.LocalError,
          error: 'Failed reading',
          id: localID,
          contentType: file.type,
          name: file.name,
          size: file.size,
          inline
        });
        return { attachmentID: localID, error: 'Failed reading' };
      }
    } catch (error) {
      updateAttachment(localID, {
        state: AttachmentStates.LocalError,
        error: `Failed reading: ${error as string}`,
        id: localID,
        contentType: file.type,
        name: file.name,
        size: file.size,
        inline
      });
      return { attachmentID: localID, error };
    }
  };

  const uploadAttachments = (files: File[], inline: boolean, encoding?: BufferEncoding) =>
    Promise.allSettled(files.map((file) => uploadAttachment(file, inline, encoding)));
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
  const showAttachmentToast = () => {
    enqueueToast({
      title: 'Attachment too large',
      body: `Cannot upload files larger than ${MESSAGE_MAX_SIZE_IN_MB}MB`
    });
  };
  const [isDownloadingAttachments, setIsDownloadingAttachments] = useState(false);

  const enqueueDownloadErrorToast = (body: string) => enqueueToast({ title: 'Download failed', body });

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

    if (!attachment) {
      enqueueDownloadErrorToast('Error downloading the attachment');
      return;
    }

    const decryptedAttachment = await fetchAndDecryptAttachment(attachment);

    if (!contentType) contentType = 'text';

    if (!decryptedAttachment) {
      enqueueDownloadErrorToast('Error with the decryption');
      return;
    }

    if (isMobileApp() || isReactNativeDesktopApp()) {
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

    const firstAttachmentID = attachmentsIds[0];
    // if only one attachment dont zip
    if (attachmentsIds.length === 1 && !!firstAttachmentID)
      return downloadAttachment(
        firstAttachmentID,
        decryptedAttachmentMetadata[0]?.decryptedMetadata?.contentType || 'text',
        decryptedAttachmentMetadata[0]?.decryptedMetadata?.filename || DEFAULT_FILE_TITLE.toLowerCase()
      );

    setIsDownloadingAttachments(true);

    const { default: JSZIP } = await import('jszip');
    const zip = new JSZIP();

    const attachmentsData = await getAttachmentsDownloadData(attachmentsIds);

    await Promise.all(
      decryptedAttachmentMetadata.map(async (attachment) => {
        const attachmentData = attachmentsData[attachment.attachmentID];

        if (!attachmentData) {
          enqueueDownloadErrorToast('Failed to download attachments data');
          return;
        }

        const decryptedAttachment = await fetchAndDecryptAttachment(attachmentData);

        if (!decryptedAttachment) {
          enqueueDownloadErrorToast('Error with the decryption');
          return;
        }

        zip.file(
          attachment.decryptedMetadata?.filename || DEFAULT_FILE_TITLE,
          Buffer.from(decryptedAttachment, 'base64')
        );
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    if (isMobileApp() || isReactNativeDesktopApp()) {
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              error: `Failed decrypting attachment: ${error?.message ?? ''}`
            });
          }
        });
      } catch (error: any) {
        enqueueToast({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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

  const getAttachedPublicKey = async (metadata: Email['decryptedAttachmentMetadata']): Promise<string | undefined> => {
    if (!metadata) return undefined;
    // find attachments with Content-Type: application/pgp-keys
    const publicKeyAttachmentId = metadata.find((attachment) => {
      return isPgpFile(attachment.decryptedMetadata?.contentType || '', attachment.decryptedMetadata?.filename || '');
    })?.attachmentID;


    if (!publicKeyAttachmentId) return undefined;
    const publicKeyAttachment = (await getAttachmentsDownloadData([publicKeyAttachmentId]))[publicKeyAttachmentId];
    if (!publicKeyAttachment) return undefined;
    const decryptedAttachment = await fetchAndDecryptAttachment(publicKeyAttachment);
    if (!decryptedAttachment) return undefined;
    const attachmentBlob = new Blob([Buffer.from(decryptedAttachment, 'base64')], { type: 'text/plain' });

    const fileValue = new Promise<string | undefined>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        if (!event.target) {
          reject(undefined);
          return;
        }
        const publicKey = event.target.result;
        if (!publicKey) {
          reject(undefined);
          return;
        }
        resolve(publicKey?.toString());
      };
      fileReader.onerror = function () {
        reject(undefined);
      };
      fileReader.readAsText(attachmentBlob);
    });
    const publicKey = await fileValue;
    return publicKey;
  };

  // Add all the initial attachments
  useEffect(() => {
    initialAttachments.metadata?.forEach((attachment) => {
      if (!attachment.decryptedMetadata) return;
      const { contentType, filename, size, contentId, contentDisposition } = attachment.decryptedMetadata;
      // Don't add attachments that are too large
      if (size > MESSAGE_MAX_SIZE_IN_BYTES) {
        showAttachmentToast();
        return;
      }
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
    fetchAllAttachments,
    getAttachedPublicKey
  };
};

export default useAttachments;
