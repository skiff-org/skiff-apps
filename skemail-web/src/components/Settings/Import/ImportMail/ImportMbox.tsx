import { ApolloError } from '@apollo/client';
import { Icon } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { ImportSelect, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import { handleFileImportFromChangeEvent, importFiles, uploadFile } from './ImportMbox.utils';
import { FileType, UploadFiles } from './UploadFiles';
import { MBOX_FILE_MAX_SIZE_IN_BYTES } from './UploadFiles/UploadFiles.constants';
import { FileUploadItem } from './UploadFiles/UploadFiles.types';

const MboxInput = styled.input`
  display: none;
`;

interface ImportMboxProps {
  handleMaxFileSizeExceeded: (maxSize: string) => void;
  handleFileImportError: (error: ApolloError) => void;
  uploadFilesOpen: boolean;
  setUploadFilesOpen: (open: boolean) => void;
}

export const ImportMbox: React.FC<ImportMboxProps> = ({
  handleMaxFileSizeExceeded,
  handleFileImportError,
  uploadFilesOpen,
  setUploadFilesOpen
}: ImportMboxProps) => {
  const [filesBeingUploaded, setFilesBeingUploaded] = useState<FileUploadItem[]>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { enqueueToast } = useToast();
  const dispatch = useDispatch();

  const clearFilesBeingUploaded = () => {
    setFilesBeingUploaded(undefined);
  };

  const onClose = () => {
    // Clear input value on close
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setUploadFilesOpen(false);
    clearFilesBeingUploaded();
  };

  const uploadFileFn = (files: File[]) => {
    void uploadFile(files, handleMaxFileSizeExceeded, enqueueToast, setFilesBeingUploaded, filesBeingUploaded || []);
  };

  const importFilesFn = (uploadedFiles: FileUploadItem[]) => {
    void importFiles(uploadedFiles, dispatch, enqueueToast, onClose, handleFileImportError);
  };

  return (
    <>
      <ImportSelect
        icon={Icon.Mailbox}
        iconColor='secondary'
        label='MBOX file'
        onClick={() => {
          // On mobile directly open up file viewer,
          // as it is not possible to drag files
          if (isMobile) {
            inputRef.current?.click();
            return;
          }
          setUploadFilesOpen(true);
        }}
        subLabel='Upload a .mbox file to get started.'
      />
      <MboxInput
        accept='.mbox'
        multiple={false}
        onChange={(event) => {
          void handleFileImportFromChangeEvent(event, uploadFileFn);
        }}
        ref={inputRef}
        type='file'
      />
      <UploadFiles
        clearFilesBeingUploaded={clearFilesBeingUploaded}
        fileType={FileType.MBOX}
        filesBeingUploaded={filesBeingUploaded}
        importFiles={importFilesFn}
        inputRef={inputRef}
        maxFileSizeInBytes={MBOX_FILE_MAX_SIZE_IN_BYTES}
        onClose={onClose}
        open={uploadFilesOpen || !!filesBeingUploaded?.length}
        uploadFiles={uploadFileFn}
      />
    </>
  );
};
