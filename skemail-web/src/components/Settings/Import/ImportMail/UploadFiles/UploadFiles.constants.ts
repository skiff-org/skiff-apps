import { MBOX_FILE_MAX_SIZE_IN_GB, gbToBytes } from 'skiff-utils';

export enum UploadStatus {
  UPLOADING,
  COMPLETE,
  FAILED
}

export enum FileType {
  MBOX = 'Mbox',
  EML = 'EML'
}

export const MBOX_FILE_MAX_SIZE_IN_BYTES = gbToBytes(MBOX_FILE_MAX_SIZE_IN_GB);
