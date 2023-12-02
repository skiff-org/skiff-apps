import { Dialog } from 'nightwatch-ui';
import { MutableRefObject } from 'react';

import { FileType, UploadStatus } from './UploadFiles.constants';
import { FileUploadItem } from './UploadFiles.types';
import { UploadFilesDropzone } from './UploadFilesDropzone';

interface UploadFilesProps {
  open: boolean;
  onClose: () => void;
  inputRef: MutableRefObject<HTMLInputElement | null>;
  fileType: FileType;
  maxFileSizeInBytes: number;
  uploadFiles: (files: File[]) => Promise<void> | void;
  filesBeingUploaded: FileUploadItem[] | undefined;
  clearFilesBeingUploaded: (uploadItem?: FileUploadItem) => void;
  importFiles: (uploadedFiles: FileUploadItem[]) => Promise<void> | void;
}

export const UploadFiles: React.FC<UploadFilesProps> = ({
  open,
  onClose,
  inputRef,
  fileType,
  maxFileSizeInBytes,
  uploadFiles,
  filesBeingUploaded,
  clearFilesBeingUploaded,
  importFiles
}: UploadFilesProps) => {
  const isUploading = !!filesBeingUploaded?.length;
  const isUploadComplete = isUploading && !!filesBeingUploaded.every((file) => file.status === UploadStatus.COMPLETE);

  const getTitle = () => {
    if (isUploadComplete) return `Upload ${filesBeingUploaded?.length || ''} ${fileType} files?`;
    if (isUploading) return `Uploading ${fileType} files`;
    return `Upload ${fileType} files`;
  };

  const getDescription = () => {
    if (isUploadComplete) return 'The import may take up to a few hours.';
    if (isUploading) return 'Please do not close this page while uploading.';
    return `Browse or drop ${fileType} files to begin uploading.`;
  };

  return (
    <Dialog
      customContent
      description={getDescription()}
      hideCloseButton
      onClose={() => {
        // Do not close the modal if there is a current upload in progress
        if (isUploading && !isUploadComplete) return;
        onClose();
      }}
      open={open}
      title={getTitle()}
    >
      <UploadFilesDropzone
        clearFilesBeingUploaded={clearFilesBeingUploaded}
        fileType={fileType}
        filesBeingUploaded={filesBeingUploaded}
        importFiles={importFiles}
        inputRef={inputRef}
        maxFileSizeInBytes={maxFileSizeInBytes}
        onClose={onClose}
        open={open}
        uploadFiles={uploadFiles}
      />
    </Dialog>
  );
};
