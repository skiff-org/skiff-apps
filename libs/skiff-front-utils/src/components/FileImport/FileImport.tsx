/* eslint-disable react/jsx-props-no-spreading */
import { Button, CircularProgress, Icon, Icons, RelativelyCentered, Size, Type } from 'nightwatch-ui';
import React, { useEffect, useMemo, useRef } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { MB_SCALE_FACTOR } from 'skiff-utils';
import styled from 'styled-components';

import { useMediaQuery } from '../../hooks';
import useToast from '../../hooks/useToast';
import { fileMimeTypesAndExtensionsReverseLookup } from '../../utils';

import { FileMimeTypesOrExtensions } from './common';
import ImportSelect from './ImportSelect';
import useInputProps from './useInputProps';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  boxSizing: 'border-box' as const,
  padding: '18px',
  gap: '16px',
  borderWidth: 2,
  borderRadius: 10,
  borderColor: 'var(--border-secondary)',
  borderStyle: 'dashed',
  background: 'var(--bg-l0-solid)',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
  cursor: 'pointer'
};

const activeStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#027AFF'
};

const loadingStyle = {
  borderColor: 'transparent'
};

const DropzoneActiveOverlay = styled.div`
  background: var(--bg-cell-active);
  border: 1px solid var(--border-active);
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  z-index: 1051;
`;

const selectVariantContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'inherit'
};

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

type FileImportProps = {
  /**
   * A box allows for file drag-n-drop and import on click.
   * A button opens the browser's file importer on click.
   * A dropzone wraps the children in a draggable area that shows import information when a file is being dragged over it.
   */
  variant: 'BOX' | 'BUTTON' | 'DROPZONE' | 'SELECT';
  /**
   * List of accepted MIME types
   */
  acceptedFileTypes?: FileMimeTypesOrExtensions[];
  /**
   * @default 10
   */
  maxFileSizeMegabytes?: number;
  /**
   * Callback for new files added event.
   * @param {Record<string, File>} newFiles New files added, stored in a dictionary hashed by their unique identifiers (UUID version-4).
   */
  onFilesAdded: (newFiles: File[], isFolder?: boolean) => void;
  /**
   * Callback for when attempted file drop is rejected.
   */
  onFilesRejected?: (rejectedFiles: FileRejection[]) => void;
  /**
   * Controls whether helper file icon is shown.
   */
  showDropzoneFileIcon?: boolean;
  /**
   * Helper text to annotate dropzone.
   * Default text will list out accepted file types and max size.
   */
  dropzoneDetailedMessage?: string;
  /**
   * A label for the button or text.
   * Relevant only if variant is button or select.
   */
  label?: string;
  /**
   * Relevant only if variant is button or select.
   */
  labelIcon?: Icon;
  /**
   * A sublabel for select.
   * Relevant only if variant is select.
   */
  sublabel?: string;
  /**
   * Set Dropzone as loading state.
   * @default false
   */
  loading?: boolean;
  /**
   * Should component programatically open OS file picker on mount if is a mobile device
   */
  openOnMountForMobile?: boolean;
  /**
   * If true show folders upload
   */
  foldersUpload?: boolean;
  /**
   * How to display the file import select row
   */
  compact?: boolean;
};

// TODO: Dedup others
const FileImport: React.FC<FileImportProps> = ({
  variant,
  acceptedFileTypes,
  maxFileSizeMegabytes = 10,
  onFilesAdded,
  onFilesRejected,
  showDropzoneFileIcon = true,
  dropzoneDetailedMessage,
  label,
  labelIcon,
  sublabel,
  loading = false,
  children,
  openOnMountForMobile,
  foldersUpload,
  compact
}) => {
  // media query for mobile devices
  const isMobileWidth = useMediaQuery('(max-width:479px)');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { enqueueToast, closeToast } = useToast();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    open: openFileInput
  } = useDropzone({
    onDropAccepted: (newFiles) => onFilesAdded(newFiles),
    onDropRejected: onFilesRejected,
    maxSize: maxFileSizeMegabytes * MB_SCALE_FACTOR,
    accept: acceptedFileTypes ? acceptedFileTypes.join(', ') : undefined,
    noKeyboard: true
  });
  const acceptLoadStyle = loading ? loadingStyle : acceptStyle;
  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptLoadStyle : {})
    }),
    [isDragActive, isDragAccept]
  );

  useEffect(() => {
    if (isMobileWidth && openOnMountForMobile) {
      openFileInput();
    }
  }, [isMobileWidth, openFileInput, openOnMountForMobile]);

  useEffect(() => {
    if (isDragActive) {
      enqueueToast({
        title: 'Import files',
        body: 'Drop files to upload to Skiff'
      });
    } else {
      closeToast();
    }
  }, [isDragActive]);

  // We create two inputs, one for files and one for folders
  // because we cannot change the type of input on safari
  // also on safari the folder input acts also as file input (unlike other browsers)
  const { fileInputProps, folderInputProps } = useInputProps({
    getInputProps,
    maxFileSizeMegabytes,
    onFilesRejected,
    onFilesAdded,
    acceptedFileTypes
  });

  if (loading) {
    return (
      <RelativelyCentered>
        <CircularProgress size={Size.X_MEDIUM} spinner />
      </RelativelyCentered>
    );
  }

  const openFolderInput = () => folderInputRef.current?.click();

  const baseContainerStyle = { overflow: 'auto', width: '100%' };
  const containerStyle =
    variant === 'SELECT' ? { ...baseContainerStyle, ...selectVariantContainerStyle } : baseContainerStyle;

  return (
    <div style={containerStyle}>
      <input {...fileInputProps} />
      <input {...folderInputProps} ref={folderInputRef} />
      {variant === 'BUTTON' && !!label && (
        <Button onClick={openFileInput} type={Type.SECONDARY}>
          {label}
        </Button>
      )}
      {variant === 'SELECT' && (
        <>
          <ImportSelect
            compact={compact}
            dataTest='open-files-upload'
            icon={labelIcon || Icon.PaperClip}
            iconColor='secondary'
            label={label || 'Upload files'}
            onClick={openFileInput}
            sublabel={sublabel}
          />
          {foldersUpload && (
            <ImportSelect
              dataTest='open-folder-upload'
              icon={Icon.Upload}
              iconColor='secondary'
              label='Upload folder'
              onClick={openFolderInput}
              sublabel='Upload from your local computer'
            />
          )}
        </>
      )}
      {variant === 'BOX' && (
        <div {...getRootProps({ style })}>
          {showDropzoneFileIcon && <Icons color='secondary' icon={Icon.Upload} size={Size.X_LARGE} />}
          <div style={{ color: 'var(--text-primary)' }}>
            {isMobileWidth ? (
              'Tap here to select files'
            ) : (
              <>
                <span>Drop files or</span>
                <button
                  data-test='upload-files-open-file-input'
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontFamily: 'Skiff Sans Text, sans-serif',
                    fontSize: '16px',
                    color: 'var(--text-link)',
                    outline: 'none'
                  }}
                  type='button'
                >
                  click
                </button>
                to select files
              </>
            )}
          </div>
          <div style={{ fontSize: '0.8em', color: 'var(--text-primary)', textAlign: 'center' }}>
            {dropzoneDetailedMessage ??
              `${
                acceptedFileTypes
                  ?.filter(Boolean)
                  .flatMap(
                    (fileMimeTypeOrExtension) => fileMimeTypesAndExtensionsReverseLookup[fileMimeTypeOrExtension]
                  )
                  .filter(Boolean)
                  .join(', ') ?? ''
              } accepted, ${Math.floor(maxFileSizeMegabytes)} MB max`}
          </div>
        </div>
      )}
      {variant === 'DROPZONE' && (
        // we're disabling onClick, so we don't need key event
        <div style={{ position: isDragActive ? 'relative' : undefined }} {...{ ...getRootProps(), onClick: undefined }}>
          {isDragActive && <DropzoneActiveOverlay />}
          {children}
        </div>
      )}
    </div>
  );
};

export default FileImport;
