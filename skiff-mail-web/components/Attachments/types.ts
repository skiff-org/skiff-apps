export enum AttachmentTypes {
  Local,
  Remote
}

export enum LocalAttachmentStates {
  Uploading,
  Error,
  Success
}

export enum RemoteAttachmentState {
  Downloading,
  Error,
  Resolved
}

export interface AttachmentBase {
  type: AttachmentTypes;
  id: string;
  contentType: string;
  name: string;
  size: number;
  inline?: boolean;
}

export interface LocalAttachmentBase extends AttachmentBase {
  type: AttachmentTypes.Local;
  state: LocalAttachmentStates;
}

export interface LocalAttachmentUploading extends LocalAttachmentBase {
  state: LocalAttachmentStates.Uploading;
  progress: number;
}

export interface LocalAttachmentSuccess extends LocalAttachmentBase {
  state: LocalAttachmentStates.Success;
  content: string;
}

export interface LocalAttachmentError extends LocalAttachmentBase {
  state: LocalAttachmentStates.Error;
  error: string;
}

export interface RemoteAttachmentBase extends AttachmentBase {
  type: AttachmentTypes.Remote;
  state: RemoteAttachmentState;
}

export interface RemoteAttachmentDownloading extends RemoteAttachmentBase {
  state: RemoteAttachmentState.Downloading;
  progress: number;
}

export interface RemoteAttachmentError extends RemoteAttachmentBase {
  state: RemoteAttachmentState.Error;
  error: string;
}

export interface RemoteAttachmentResolved extends RemoteAttachmentBase {
  state: RemoteAttachmentState.Resolved;
}

export type RemoteAttachment = RemoteAttachmentDownloading | RemoteAttachmentError | RemoteAttachmentResolved;
export type LocalAttachment = LocalAttachmentUploading | LocalAttachmentError | LocalAttachmentSuccess;

export type LocalOrRemoteAttachment = RemoteAttachment | LocalAttachment;

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
