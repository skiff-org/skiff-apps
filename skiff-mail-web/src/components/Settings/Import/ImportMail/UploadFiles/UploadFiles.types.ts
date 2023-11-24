import { UploadStatus } from './UploadFiles.constants';

export interface FileUploadItem {
  file: File;
  status: UploadStatus;
  progress: number;
  fileID?: string; // Needed for Mbox imports
}
