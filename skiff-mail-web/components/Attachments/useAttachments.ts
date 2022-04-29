import { useCallback, useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { MailboxEmailInfo } from '../../models/email';
import { readFile } from '../../utils/readFile';
import {
  AttachmentTypes,
  LocalAttachmentStates,
  LocalOrRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentState
} from './types';
import { isInProgress, isLocalAttachment } from './typeUtils';
import { isInline } from './utils';

const useAttachments = (attachmentsMetadata?: MailboxEmailInfo['decryptedAttachmentMetadata']) => {
  const [attachments, setAttachments] = useState<LocalOrRemoteAttachment[]>(
    attachmentsMetadata?.map(
      (attachment): RemoteAttachment =>
        attachment.decryptedMetadata
          ? {
              type: AttachmentTypes.Remote,
              contentType: attachment.decryptedMetadata.contentType,
              name: attachment.decryptedMetadata.filename,
              size: attachment.decryptedMetadata.size,
              id: attachment.attachmentID,
              state: RemoteAttachmentState.Resolved,
              inline: isInline(attachment) || false
            }
          : {
              type: AttachmentTypes.Remote,
              id: attachment.attachmentID,
              contentType: 'unknown',
              name: 'Failed encrypting',
              size: 0,
              state: RemoteAttachmentState.Error,
              error: 'Failed encrypting'
            }
    ) || []
  );

  const addAttachment = useCallback((attachment: LocalOrRemoteAttachment) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex(({ id }) => id === attachment.id);
      if (attachmentIndex < 0) return [...oldAttachments, attachment];
      return oldAttachments;
    });
  }, []);

  const updateAttachmentProgress = (id: string, progress: number) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex((attachment) => attachment.id === id);
      if (attachmentIndex < 0) return oldAttachments;

      const attachment = oldAttachments[attachmentIndex];
      if (!isInProgress(attachment)) return oldAttachments;

      const newAttachments = [...oldAttachments];
      newAttachments.splice(attachmentIndex, 1, { ...attachment, progress });
      return newAttachments;
    });
  };

  const updateUploadSuccess = (id: string, content: string) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex((attachment) => attachment.id === id);
      if (attachmentIndex < 0) return oldAttachments;

      const attachment = oldAttachments[attachmentIndex];
      if (!isLocalAttachment(attachment)) return oldAttachments;

      const newAttachments = [...oldAttachments];
      newAttachments.splice(attachmentIndex, 1, {
        ...attachment,
        state: LocalAttachmentStates.Success,
        content
      });
      return newAttachments;
    });
  };

  const updateUploadError = (id: string, error: string) => {
    setAttachments((oldAttachments) => {
      const attachmentIndex = oldAttachments.findIndex((attachment) => attachment.id === id);
      if (attachmentIndex < 0) return oldAttachments;

      const attachment = oldAttachments[attachmentIndex];
      if (!isLocalAttachment(attachment)) return oldAttachments;

      const newAttachments = [...oldAttachments];
      newAttachments.splice(attachmentIndex, 1, {
        ...attachment,
        state: LocalAttachmentStates.Error,
        error
      });
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

  const uploadAttachment = async (file: File, inline = false) => {
    const localID = v4();
    try {
      addAttachment({
        type: AttachmentTypes.Local,
        id: localID,
        state: LocalAttachmentStates.Uploading,
        progress: 0,
        contentType: file.type,
        name: file.name,
        size: file.size,
        inline
      });

      const { content } = await readFile(file, (event) => {
        updateAttachmentProgress(localID, Math.round(100 * (event.loaded / event.total)));
      });

      if (content) {
        updateUploadSuccess(localID, content);
        return { attachmentID: localID, content };
      } else {
        updateUploadError(localID, 'Failed reading');
        return { attachmentID: localID, error: 'Failed reading' };
      }
    } catch (error) {
      updateUploadError(localID, '' + error);
      return { attachmentID: localID, error };
    }
  };

  const uploadAttachments = (files: File[]) => Promise.allSettled(files.map((file) => uploadAttachment(file)));

  const attachmentsSize = useMemo(
    () =>
      attachments.reduce(
        (sum, attachment) => (sum += attachment.type === AttachmentTypes.Local ? attachment.size : 0),
        0
      ),
    [attachments]
  );

  return {
    attachments,
    attachmentsSize,
    addAttachment,
    updateAttachmentProgress,
    updateUploadError,
    updateUploadSuccess,
    removeAttachment,
    uploadAttachments,
    uploadAttachment
  };
};

export default useAttachments;
