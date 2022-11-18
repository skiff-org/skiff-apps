import { Base64 } from 'skiff-front-utils';

export enum AttachmentStates {
  LocalUploading,
  Local,
  LocalError,
  RemoteFetching,
  Remote,
  RemoteError,
  RemoteFetched
}

export interface AttachmentBase {
  state: AttachmentStates;
  id: string;
  contentType: string;
  name: string;
  size: number;
  inline?: boolean;
  contentID?: string;
}

export interface ClientLocalUploadingAttachment extends AttachmentBase {
  state: AttachmentStates.LocalUploading;
  progress: number;
}
export interface ClientLocalAttachment extends AttachmentBase {
  state: AttachmentStates.Local;
  content: Base64;
}
export interface ClientLocalErrorAttachment extends AttachmentBase {
  state: AttachmentStates.LocalError;
  error: string;
}
export interface ClientRemoteFetchingAttachment extends AttachmentBase {
  state: AttachmentStates.RemoteFetching;
  progress: number;
}
export interface ClientRemoteAttachment extends AttachmentBase {
  state: AttachmentStates.Remote;
}
export interface ClientRemoteErrorAttachment extends AttachmentBase {
  state: AttachmentStates.RemoteError;
  error: string;
}
export interface ClientRemoteFetchedAttachment extends AttachmentBase {
  state: AttachmentStates.RemoteFetched;
  content: Base64;
}

export type ClientAttachment =
  | ClientLocalAttachment
  | ClientLocalErrorAttachment
  | ClientLocalUploadingAttachment
  | ClientRemoteAttachment
  | ClientRemoteErrorAttachment
  | ClientRemoteFetchedAttachment
  | ClientRemoteFetchingAttachment;

interface OptionalOptions {
  attachmentType: 'inline' | 'attachment';
  attachmentHost: string;
  fileName: string;
  contentID: string;
}

interface StrictOptions {
  content: string;
}

export type AttachmentHeadersOptions = Partial<OptionalOptions> & StrictOptions;
