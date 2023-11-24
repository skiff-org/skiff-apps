import { Icon, Icons, Size } from 'nightwatch-ui';
import React, { Suspense, useEffect } from 'react';
import { NwContentType } from 'skiff-graphql';
import styled from 'styled-components';

import { fileTypeMatcher, FileTypes } from '../../../utils/fileUtils';

import AudioPreview from './Previews/AudioPreview';
import CodePreview from './Previews/CodePreview';
import DocxPreview from './Previews/DocxPreview';
import ErrorPreview from './Previews/ErrorPreview';
import IconPreview from './Previews/IconPreview';
import ImagePreview from './Previews/ImagePreview';
import LoadingPreview from './Previews/LoadingPreview';
import SheetPreview from './Previews/SheetPreview';
import SkiffPagePreview from './Previews/SkiffPagePreview';
import TextPreview from './Previews/TextPreview';
import UnknownPreview from './Previews/UnknownPreview';
import VideoPreview from './Previews/VideoPreview';
import { PreviewDisplayProps, PreviewSize } from './RecentFilePreview.types';

const FallbackIconContainer = styled.div`
  display: 'flex';
  justify-content: 'center';
  margin-top: '16px';
`;

const PDFPreview = React.lazy(() => import('./Previews/PdfPreview'));

const FilePreviewDisplay = ({
  progress,
  progressSize,
  error,
  refetch,
  fileProps,
  placeholderIcon,
  iconColor,
  size,
  title,
  onClose,
  CustomUnknownPreviewComponent,
  isEmbeddedInPage,
  reactPdf,
  width
}: PreviewDisplayProps) => {
  useEffect(() => {
    // esc to close handling
    if (!onClose) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // handle loading previews
  if (progress !== undefined) {
    return <LoadingPreview progress={progress} size={progressSize} />;
  }

  // handle errors previews
  if (error) {
    return <ErrorPreview error={error || 'Error: error'} refetch={refetch} size={size} />;
  }

  const FallbackIcon = ({ icon }: { icon: Icon }) => {
    return (
      <FallbackIconContainer>
        <Icons
          color={iconColor || 'secondary'}
          icon={icon}
          size={size === PreviewSize.Small ? Size.MEDIUM : Size.X_LARGE}
        />
      </FallbackIconContainer>
    );
  };

  // return placeholder incase there is no content type for the preview
  if (!fileProps?.contentType) return <FallbackIcon icon={placeholderIcon || Icon.File} />;

  const { contentType, mimeType } = fileProps;

  // handle NwContentType previews
  // if the file is Skiff Page or a pdf, render the matching preview
  switch (contentType) {
    case NwContentType.Pdf:
      return (
        <Suspense fallback={null}>
          <PDFPreview {...fileProps} size={size} width={width} />
        </Suspense>
      );
    case NwContentType.RichText:
      return <SkiffPagePreview {...fileProps} color={iconColor} icon={placeholderIcon} title={title} />;
    case NwContentType.Folder:
      return <FallbackIcon icon={placeholderIcon || Icon.Folder} />;
  }

  // handle custom mimeTypes previews
  const preview = fileTypeMatcher(mimeType ?? '', {
    [FileTypes.Image]: <ImagePreview {...fileProps} />,
    [FileTypes.Icon]: <IconPreview {...fileProps} />,
    [FileTypes.Pdf]: (
      <Suspense fallback={null}>
        <PDFPreview {...fileProps} isEmbeddedInPage={isEmbeddedInPage} size={size} width={width} reactPdf={reactPdf} />
      </Suspense>
    ),
    [FileTypes.Code]: <CodePreview isEmbeddedInPage={isEmbeddedInPage} {...fileProps} />,
    [FileTypes.Video]: <VideoPreview {...fileProps} isEmbeddedInPage={isEmbeddedInPage} />,
    [FileTypes.Sound]: <AudioPreview {...fileProps} isEmbeddedInPage={isEmbeddedInPage} />,
    [FileTypes.Word]: <DocxPreview {...fileProps} />,
    [FileTypes.Sheet]: <SheetPreview {...fileProps} />,
    [FileTypes.MarkDown]: <TextPreview {...fileProps} />,
    [FileTypes.Text]: <TextPreview {...fileProps} />,
    [FileTypes.Unknown]: CustomUnknownPreviewComponent ? (
      <>{CustomUnknownPreviewComponent}</>
    ) : (
      <UnknownPreview {...fileProps} />
    )
  });
  return preview;
};

export default FilePreviewDisplay;
