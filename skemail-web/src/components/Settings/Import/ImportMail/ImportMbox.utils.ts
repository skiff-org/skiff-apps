import { ApolloError } from '@apollo/client';
import axios from 'axios';
import * as t from 'io-ts';
import { ToastProps } from 'nightwatch-ui';
import { ChangeEvent } from 'react';
import {
  GetMboxImportUrlDocument,
  GetMboxImportUrlMutation,
  GetMboxImportUrlMutationVariables,
  ImportMboxEmailsDocument,
  ImportMboxEmailsMutation,
  ImportMboxEmailsMutationVariables
} from 'skiff-front-graphql';
import { MBOX_FILE_MAX_SIZE_IN_GB, assertExists, filterExists } from 'skiff-utils';

import client from '../../../../apollo/client';
import { skemailImportReducer } from '../../../../redux/reducers/importReducer';
import { AppDispatch } from '../../../../redux/store/types';

import { MBOX_FILE_MAX_SIZE_IN_BYTES, UploadStatus } from './UploadFiles';
import { FileUploadItem } from './UploadFiles/UploadFiles.types';

const MboxImportSignedDataValidator = t.type({
  url: t.string,
  fields: t.record(t.string, t.string)
});

// Upload selected file
export const uploadFile = async (
  files: File[],
  handleMaxFileSizeExceeded: (maxSize: string) => void,
  enqueueToast: (toast: ToastProps) => void,
  setFilesBeingUploaded: (files: FileUploadItem[]) => void,
  filesBeingUploaded: FileUploadItem[]
) => {
  const file = files[0];
  try {
    // Apple mail exports mbox files with the name 'mbox'
    if (file?.name.endsWith('.mbox') || file?.name === 'mbox') {
      if (file.size > MBOX_FILE_MAX_SIZE_IN_BYTES) {
        handleMaxFileSizeExceeded(`${MBOX_FILE_MAX_SIZE_IN_GB} GB`);
        return;
      }
      const { data } = await client.mutate<GetMboxImportUrlMutation, GetMboxImportUrlMutationVariables>({
        mutation: GetMboxImportUrlDocument,
        variables: {
          getImportUrlRequest: {
            fileSizeInBytes: file.size
          }
        }
      });

      assertExists(data);
      assertExists(data.getMboxImportUrl);
      const { uploadData, fileID } = data.getMboxImportUrl;
      const uploadDataParsed = JSON.parse(uploadData) as unknown;
      if (!MboxImportSignedDataValidator.is(uploadDataParsed)) {
        throw new Error('Invalid upload data');
      }
      const formData = new FormData();

      Object.entries(uploadDataParsed.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);
      await axios(uploadDataParsed.url, {
        method: 'POST',
        data: formData,
        onUploadProgress: (progressEvent: ProgressEvent) => {
          // Update upload progress
          setFilesBeingUploaded([
            {
              file,
              fileID,
              progress: progressEvent.loaded / progressEvent.total,
              status: UploadStatus.UPLOADING
            }
          ]);
        }
      });

      // Upload complete
      setFilesBeingUploaded([
        {
          file,
          fileID,
          progress: 1,
          status: UploadStatus.COMPLETE
        }
      ]);
    } else {
      enqueueToast({
        title: 'Invalid file type',
        body: 'You can import .mbox files.'
      });
      return;
    }
  } catch (err) {
    console.error(err);
    if (filesBeingUploaded?.length && file) {
      // Update to failed status
      setFilesBeingUploaded([
        {
          file,
          progress: 0,
          status: UploadStatus.FAILED
        }
      ]);
    }
    enqueueToast({
      title: 'Upload failed',
      body: 'Could not upload .mbox files. Try again later.'
    });
  }
};

// Import all uploaded files
export const importFiles = async (
  uploadedFiles: FileUploadItem[],
  dispatch: AppDispatch,
  enqueueToast: (toast: ToastProps) => void,
  onClose: () => void,
  handleFileImportError: (err: ApolloError) => void
) => {
  try {
    const fileIDs = uploadedFiles.map((uploadItem) => uploadItem.fileID).filter(filterExists);
    dispatch(skemailImportReducer.actions.startImport());

    await Promise.all(
      fileIDs.map(async (fileID) => {
        // Begin import
        await client.mutate<ImportMboxEmailsMutation, ImportMboxEmailsMutationVariables>({
          mutation: ImportMboxEmailsDocument,
          variables: { importMboxRequest: { fileID } },
          context: {
            headers: {
              'Apollo-Require-Preflight': true // this is required for files uploading. Otherwise, router backend will reject request.
            }
          }
        });
      })
    );
    enqueueToast({
      title: 'Mbox import started',
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
export const handleFileImportFromChangeEvent = async (
  event: ChangeEvent<HTMLInputElement>,
  uploadNewFile: (files: File[]) => Promise<void> | void
) => {
  event.preventDefault();
  if (event.target.files?.item(0)) {
    const files = event.target.files;
    await uploadNewFile(Array.from(files));
  }
};
