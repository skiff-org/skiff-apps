import { ApolloError } from '@apollo/client';
import { Icon } from 'nightwatch-ui';
import { ChangeEvent, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { ImportEmlEmailDocument, ImportEmlEmailMutation, ImportEmlEmailMutationVariables } from 'skiff-front-graphql';
import { ImportSelect, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import client from '../../../../apollo/client';
import { MESSAGE_MAX_SIZE_IN_BYTES, MESSAGE_MAX_SIZE_IN_MB } from '../../../MailEditor/Plugins/MessageSizePlugin';

import { FileType, UploadFiles, UploadStatus } from './UploadFiles';
import { FileUploadItem } from './UploadFiles/UploadFiles.types';

const EmlInput = styled.input`
  display: none;
`;

interface ImportEmlProps {
  handleMaxFileSizeExceeded: (maxSizeInBytes: string) => void;
  handleFileImportError: (error: ApolloError) => void;
  uploadFilesOpen: boolean;
  setUploadFilesOpen: (open: boolean) => void;
}

export const ImportEml: React.FC<ImportEmlProps> = ({
  handleMaxFileSizeExceeded,
  handleFileImportError,
  uploadFilesOpen,
  setUploadFilesOpen
}: ImportEmlProps) => {
  const [filesBeingUploaded, setFilesBeingUploaded] = useState<FileUploadItem[]>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { enqueueToast } = useToast();

  const clearFilesBeingUploaded = (uploadItem?: FileUploadItem) => {
    if (!!uploadItem) {
      setFilesBeingUploaded(filesBeingUploaded?.filter((f) => f.file.name !== uploadItem.file.name));
    } else {
      setFilesBeingUploaded(undefined);
    }
  };

  const onClose = () => {
    // Clear input value on close
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setUploadFilesOpen(false);
    clearFilesBeingUploaded();
  };

  // Upload selected files
  const uploadFiles = (files: File[]) => {
    try {
      if (files?.[0]?.name.endsWith('.eml')) {
        const containsOversizedFiles = files.some((emlFile) => emlFile.size > MESSAGE_MAX_SIZE_IN_BYTES);
        if (containsOversizedFiles) {
          handleMaxFileSizeExceeded(`${MESSAGE_MAX_SIZE_IN_MB} MB`);
          return;
        }

        // Upload complete
        setFilesBeingUploaded((prevState) => [
          ...(prevState || []),
          ...files.map((file) => ({
            file,
            progress: 1,
            status: UploadStatus.COMPLETE
          }))
        ]);
      } else {
        enqueueToast({
          title: 'Invalid file type',
          body: 'You can import .eml files.'
        });
      }
    } catch (error) {
      console.error(error);
      if (filesBeingUploaded?.length) {
        // Update to failed status
        setFilesBeingUploaded((prevState) => [
          ...(prevState || []),
          ...files.map((file) => ({
            file,
            progress: 0,
            status: UploadStatus.FAILED
          }))
        ]);
      }
      enqueueToast({
        title: 'Upload failed',
        body: 'Could not upload .eml files. Try again later.'
      });
    }
  };

  // Import uploaded files
  const importFiles = async (uploadedFiles: FileUploadItem[]) => {
    try {
      const files = uploadedFiles.map((uploadedFile) => uploadedFile.file);
      await client.mutate<ImportEmlEmailMutation, ImportEmlEmailMutationVariables>({
        mutation: ImportEmlEmailDocument,
        variables: { importRequest: { emlFiles: files } },
        context: {
          headers: {
            'Apollo-Require-Preflight': true // this is required for files uploading. Otherwise, router backend will reject request.
          }
        }
      });
      enqueueToast({
        title: 'EML import started',
        body: 'Emails are being added into your inbox.'
      });
      onClose();
    } catch (err) {
      if (err instanceof ApolloError) {
        handleFileImportError(err);
      }
    }
  };

  // Upload files after selecting them from the file viewer
  const handleFileUploadFromChangeEvent = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (event.target.files?.item(0)) {
      const files = event.target.files;
      try {
        uploadFiles(Array.from(files));
      } catch (err) {
        if (err instanceof ApolloError) {
          handleFileImportError(err);
        }
      }
    }
  };

  return (
    <>
      <ImportSelect
        icon={Icon.Envelope}
        iconColor='secondary'
        label='EML file'
        onClick={() => {
          // On mobile directly open up file viewer,
          // as it is not possible to drag files
          if (isMobile) {
            inputRef.current?.click();
            return;
          }
          setUploadFilesOpen(true);
        }}
        subLabel='Upload a .eml file to get started.'
      />
      <EmlInput
        accept='.eml'
        multiple={true}
        onChange={(event) => {
          void handleFileUploadFromChangeEvent(event);
        }}
        ref={inputRef}
        type='file'
      />
      <UploadFiles
        clearFilesBeingUploaded={clearFilesBeingUploaded}
        fileType={FileType.EML}
        filesBeingUploaded={filesBeingUploaded}
        importFiles={importFiles}
        inputRef={inputRef}
        maxFileSizeInBytes={MESSAGE_MAX_SIZE_IN_BYTES}
        onClose={onClose}
        open={uploadFilesOpen || !!filesBeingUploaded?.length}
        uploadFiles={uploadFiles}
      />
    </>
  );
};
