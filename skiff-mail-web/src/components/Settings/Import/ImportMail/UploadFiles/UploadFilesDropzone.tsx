import { ButtonGroup, ButtonGroupItem, FilledVariant, IconText, Typography, TypographyWeight } from 'nightwatch-ui';
import { MutableRefObject } from 'react';
import { useDropzone } from 'react-dropzone';
import { handleFileUploadErrors, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import { MailUploadItem } from './MailUploadItem';
import { FileType, UploadStatus } from './UploadFiles.constants';
import { FileUploadItem } from './UploadFiles.types';

const DropzoneRootContainer = styled.div<{ active: boolean }>`
  border-radius: 4px;
  border: 1px ${({ active }) => (active ? 'solid var(--border-hover)' : 'dashed var(--border-primary)')};
  background: var(--bg-overlay-quaternary);
  width: 100%;
  display: flex;
  padding: 80px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;

  /* Important: Without this, scroll breaks for the mobile version */
  height: 100%;
`;

const UploadItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-height: 190px;
  overflow: hidden;
  :hover {
    overflow: auto;
  }
`;

interface UploadFilesDropzoneProps {
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

export const UploadFilesDropzone: React.FC<UploadFilesDropzoneProps> = ({
  onClose,
  inputRef,
  maxFileSizeInBytes,
  uploadFiles,
  filesBeingUploaded,
  clearFilesBeingUploaded,
  importFiles
}: UploadFilesDropzoneProps) => {
  const { enqueueToast } = useToast();
  const { getRootProps: getDropzoneRootProps, isDragActive } = useDropzone({
    noKeyboard: true,
    maxSize: maxFileSizeInBytes,
    onDropAccepted: (files) => {
      void uploadFiles(files);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ file, errors }) => {
        handleFileUploadErrors(errors, enqueueToast, file);
      });
    }
  });

  const isUploading = !!filesBeingUploaded?.length;
  const isUploadComplete = isUploading && !!filesBeingUploaded.every((file) => file.status === UploadStatus.COMPLETE);
  const uploadFailed = isUploading && !!filesBeingUploaded.some((file) => file.status === UploadStatus.FAILED);

  const removeUploadItem = (uploadItem: FileUploadItem) => {
    clearFilesBeingUploaded(uploadItem);
  };

  const clear = () => clearFilesBeingUploaded();

  return (
    <>
      <DropzoneRootContainer {...getDropzoneRootProps()} active={isDragActive}>
        <Typography color={isDragActive ? 'primary' : 'secondary'}>Drop files to upload or</Typography>
        <IconText
          label='Select files'
          onClick={() => inputRef.current?.click()}
          variant={FilledVariant.FILLED}
          weight={TypographyWeight.REGULAR}
        />
      </DropzoneRootContainer>
      {isUploading && (
        <UploadItems>
          {filesBeingUploaded.map((uploadItem) => (
            <MailUploadItem key={uploadItem.file.name} removeUploadItem={removeUploadItem} uploadItem={uploadItem} />
          ))}
        </UploadItems>
      )}
      {isUploadComplete && (
        <ButtonGroup>
          <ButtonGroupItem
            label='Import'
            onClick={() => {
              void importFiles(filesBeingUploaded);
            }}
          />
          <ButtonGroupItem label='Cancel' onClick={onClose} />
        </ButtonGroup>
      )}
      {uploadFailed && (
        <ButtonGroup>
          <ButtonGroupItem label='Try again' onClick={clear} />
          <ButtonGroupItem label='Cancel' onClick={onClose} />
        </ButtonGroup>
      )}
    </>
  );
};
