import { ToastProps } from 'nightwatch-ui';
import { FileError } from 'react-dropzone';

import { sha256 } from './hashUtils';

/**
 * Possible ways that file import can fail.
 * Error codes from @see https://github.com/react-dropzone/react-dropzone.
 */
export enum FileImportFailures {
  TOO_LARGE = 'file-too-large',
  TOO_SMALL = 'file-too-small',
  TOO_MANY = 'too-many-files',
  INVALID_TYPE = 'file-invalid-type',
  UNKNOWN_ERROR = 'unknown-error',
  PERMISSION_ERROR = 'permission-error',
  GOOGLE_USAGE_LIMIT_ERROR = 'google-usage-limit-error',
  NETWORK_ERROR = 'network-error'
}

export async function computeContentHash(contentChunks: string[]) {
  const hashes = await Promise.all(contentChunks.map((content) => sha256(content)));
  return hashes.join('_');
}

export const handleFileUploadErrors = (
  errors: FileError[],
  enqueueToast: (toastParams: ToastProps) => void,
  file: File | { name: string },
  setPaywallOpen?: (open: boolean) => void
) => {
  const errorCodes = errors.map(({ code }) => code);
  if (setPaywallOpen && errorCodes.includes(FileImportFailures.TOO_LARGE)) {
    setPaywallOpen(true);
  }
  if (errorCodes.includes(FileImportFailures.TOO_MANY)) {
    enqueueToast({ title: 'Import failed', body: `Trying to import too many files.` });
  }
  if (errorCodes.includes(FileImportFailures.INVALID_TYPE)) {
    enqueueToast({ title: 'Import failed', body: `${file.name} types are not accepted.` });
  }
  if (errorCodes.includes(FileImportFailures.PERMISSION_ERROR)) {
    enqueueToast({
      title: 'Import failed',
      body: `${file.name} can't be imported. Ask the document owner for export permissions.`
    });
  }
  if (errorCodes.includes(FileImportFailures.UNKNOWN_ERROR)) {
    enqueueToast({
      title: 'Import failed',
      body: `Something went wrong while trying to import ${file.name}.`
    });
  }
  if (errorCodes.includes(FileImportFailures.GOOGLE_USAGE_LIMIT_ERROR)) {
    enqueueToast({
      title: 'Import failed',
      body: `Too many files imported, some of the imports were canceled.`
    });
  }
  if (errorCodes.includes(FileImportFailures.NETWORK_ERROR)) {
    enqueueToast({
      title: 'Import failed',
      body: `Network error occurred, try importing fewer files.`
    });
  }

  errors.forEach((error) => console.error(error));
};
