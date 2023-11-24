import { ApolloError } from '@apollo/client';
import { Dialog, Typography } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import { handleFileImportFromChangeEvent, importFiles, uploadFile } from './ImportMbox.utils';
import { FileType, MBOX_FILE_MAX_SIZE_IN_BYTES } from './UploadFiles/UploadFiles.constants';
import { FileUploadItem } from './UploadFiles/UploadFiles.types';
import { UploadFilesDropzone } from './UploadFiles/UploadFilesDropzone';

const Link = styled.a`
  color: var(--text-link);
`;

interface AppleImportDialogProps {
  open: boolean;
  onClose: () => void | Promise<void>;
  handleMaxFileSizeExceeded: (maxSize: string) => void;
  handleFileImportError: (error: ApolloError) => void;
  uploadFilesOpen: boolean;
  setUploadFilesOpen: (open: boolean) => void;
}

const MboxInput = styled.input`
  display: none;
`;

export const AppleImportDialog: React.FC<AppleImportDialogProps> = ({
  open,
  onClose,
  handleMaxFileSizeExceeded,
  handleFileImportError,
  setUploadFilesOpen,
  uploadFilesOpen
}: AppleImportDialogProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filesBeingUploaded, setFilesBeingUploaded] = useState<FileUploadItem[]>();

  const { enqueueToast } = useToast();
  const dispatch = useDispatch();

  const clearFilesBeingUploaded = () => {
    setFilesBeingUploaded(undefined);
  };

  const onCloseFn = () => {
    // Clear input value on close
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setUploadFilesOpen(false);
    clearFilesBeingUploaded();
    void onClose();
  };

  const uploadFileFn = async (files: File[]) => {
    await uploadFile(files, handleMaxFileSizeExceeded, enqueueToast, setFilesBeingUploaded, filesBeingUploaded || []);
  };

  const importFilesFn = async (uploadedFiles: FileUploadItem[]) => {
    await importFiles(uploadedFiles, dispatch, enqueueToast, onCloseFn, handleFileImportError);
  };

  return (
    <Dialog customContent hideCloseButton onClose={() => void onClose()} open={open} title='Import from Apple Mail'>
      <MboxInput
        accept='.mbox'
        multiple={false}
        onChange={(event) => {
          void handleFileImportFromChangeEvent(event, uploadFileFn);
        }}
        ref={inputRef}
        type='file'
      />
      <Typography color='secondary' wrap>
        In Apple Mail,choose Mailbox &#8250; Export Mailbox from the menu bar. Select the exported MBOX file below.
        See&nbsp;
        <Link
          href='https://support.apple.com/guide/mail/import-or-export-mailboxes-mlhlp1030/mac'
          rel='noopener noreferrer'
          target='_blank'
        >
          this link
        </Link>
      </Typography>
      <UploadFilesDropzone
        clearFilesBeingUploaded={clearFilesBeingUploaded}
        fileType={FileType.MBOX}
        filesBeingUploaded={filesBeingUploaded}
        importFiles={importFilesFn}
        inputRef={inputRef}
        maxFileSizeInBytes={MBOX_FILE_MAX_SIZE_IN_BYTES}
        onClose={() => void onClose()}
        open={uploadFilesOpen || !!filesBeingUploaded?.length}
        uploadFiles={uploadFileFn}
      />
    </Dialog>
  );
};
