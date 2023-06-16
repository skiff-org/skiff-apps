import { FileRejection, ErrorCode, DropzoneInputProps } from 'react-dropzone';
import { MB_SCALE_FACTOR } from 'skiff-utils';

import { FileMimeTypesOrExtensions } from './common';

interface CreateInputPropsProps {
  getInputProps: (props?: DropzoneInputProps | undefined) => DropzoneInputProps;
  maxFileSizeMegabytes: number;
  onFilesRejected: ((rejectedFiles: FileRejection[]) => void) | undefined;
  onFilesAdded: (newFiles: File[], isFolder?: boolean | undefined) => void;
  acceptedFileTypes?: FileMimeTypesOrExtensions[];
}

function createInputProps({
  getInputProps,
  maxFileSizeMegabytes,
  onFilesRejected,
  onFilesAdded,
  acceptedFileTypes,
  directory
}: CreateInputPropsProps & { directory?: boolean }) {
  const initialInputProps = getInputProps();
  const directoryProps = { directory: '', webkitdirectory: '' };
  const inputProps = {
    ...(directory ? { ...initialInputProps, ...directoryProps } : { ...initialInputProps })
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // to-do validate files here
    if (files.length) {
      const acceptedFiles: File[] = [];
      const rejectedFiles: FileRejection[] = [];
      files.forEach((file) => {
        if (file.size / MB_SCALE_FACTOR > maxFileSizeMegabytes) {
          rejectedFiles.push({
            file,
            errors: [
              {
                message: `Max file size is ${Math.floor(maxFileSizeMegabytes)}, received file ${
                  file.name
                } which has size ${Math.floor(file.size / MB_SCALE_FACTOR)} MB.`,
                code: 'file-too-large'
              }
            ]
          });
        } else if (!!acceptedFileTypes && !acceptedFileTypes.includes(file.type as FileMimeTypesOrExtensions)) {
          rejectedFiles.push({
            file,
            errors: [
              {
                message: `Accepted file types are ${(acceptedFileTypes ?? []).join(',')}, received file ${
                  file.name
                } which has type ${file.type}.`,
                code: ErrorCode.FileInvalidType
              }
            ]
          });
        } else {
          acceptedFiles.push(file);
        }
      });
      if (rejectedFiles.length && onFilesRejected) {
        onFilesRejected(rejectedFiles);
      }
      if (acceptedFiles.length) {
        onFilesAdded(acceptedFiles, directory);
      }
    }
  };

  return { ...inputProps, onChange };
}

export default function useInputProps(props: CreateInputPropsProps) {
  const fileInputProps = createInputProps({ ...props, directory: false });
  const folderInputProps = createInputProps({ ...props, directory: true });
  return { fileInputProps, folderInputProps };
}
