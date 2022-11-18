import { Attachment } from 'skiff-graphql';

import {
  AttachmentStates,
  ClientAttachment,
  ClientLocalAttachment,
  ClientLocalErrorAttachment,
  ClientLocalUploadingAttachment,
  ClientRemoteAttachment,
  ClientRemoteErrorAttachment,
  ClientRemoteFetchedAttachment,
  ClientRemoteFetchingAttachment
} from './types';

export const isFailedAttachment = (
  attachment: ClientAttachment
): attachment is ClientLocalErrorAttachment | ClientRemoteErrorAttachment =>
  attachment.state === AttachmentStates.LocalError || attachment.state === AttachmentStates.RemoteError;

export const isLocal = (attachment: ClientAttachment): attachment is ClientLocalAttachment =>
  attachment.state === AttachmentStates.Local;

export const isAllLocal = (attachment: ClientAttachment[]): attachment is ClientLocalAttachment[] =>
  attachment.every(isLocal);

export const canBeFetched = (attachment: ClientAttachment): attachment is ClientRemoteAttachment =>
  attachment.state === AttachmentStates.Remote;

export const canBeFetchedWithFailed = (
  attachment: ClientAttachment
): attachment is ClientRemoteAttachment | ClientRemoteErrorAttachment =>
  attachment.state === AttachmentStates.Remote || attachment.state === AttachmentStates.RemoteError;

export const isAttachment = (attachment: Attachment | null): attachment is Attachment =>
  attachment?.__typename === 'Attachment';

/**
 * Checks if all attachments ready to be send
 */
export const isAllHasContent = (
  attachments: ClientAttachment[]
): attachments is (ClientLocalAttachment | ClientRemoteFetchedAttachment)[] => attachments.every(hasContent);

export const hasContent = (
  attachment: ClientAttachment
): attachment is ClientLocalAttachment | ClientRemoteFetchedAttachment =>
  attachment.state === AttachmentStates.Local || attachment.state === AttachmentStates.RemoteFetched;

export const inProgress = (
  attachment: ClientAttachment
): attachment is ClientRemoteFetchingAttachment | ClientLocalUploadingAttachment =>
  attachment.state === AttachmentStates.LocalUploading || attachment.state === AttachmentStates.RemoteFetching;

export const errorAttachment = (
  attachment: ClientAttachment
): attachment is ClientLocalErrorAttachment | ClientRemoteErrorAttachment =>
  attachment.state === AttachmentStates.LocalError || attachment.state === AttachmentStates.RemoteError;
