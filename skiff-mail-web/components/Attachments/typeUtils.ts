import {
  AttachmentTypes,
  LocalAttachment,
  LocalAttachmentError,
  LocalAttachmentStates,
  LocalAttachmentSuccess,
  LocalAttachmentUploading,
  RemoteAttachment
} from './types';

export const isLocalAttachment = (attachment: LocalAttachment | RemoteAttachment): attachment is LocalAttachment =>
  attachment.type === AttachmentTypes.Local;

export const isRemoteAttachment = (attachment: LocalAttachment | RemoteAttachment): attachment is RemoteAttachment =>
  attachment.type === AttachmentTypes.Remote;

export const isLocalSuccess = (attachment: LocalAttachment | RemoteAttachment): attachment is LocalAttachmentSuccess =>
  isLocalAttachment(attachment) && attachment.state === LocalAttachmentStates.Success;

export const isInProgress = (attachment: LocalAttachment | RemoteAttachment): attachment is LocalAttachmentUploading =>
  isLocalAttachment(attachment) && attachment.state === LocalAttachmentStates.Uploading;

export const isAllSuccess = (
  attachment: (LocalAttachment | RemoteAttachment)[]
): attachment is LocalAttachmentSuccess[] => attachment.every(isLocalSuccess);

export const isFailedAttachment = (
  attachment: RemoteAttachment | LocalAttachment
): attachment is LocalAttachmentError =>
  isLocalAttachment(attachment) && attachment.state === LocalAttachmentStates.Error;
